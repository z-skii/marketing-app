import { NextResponse } from "next/server";
import { sqlOne } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A link's artwork, exactly as uploaded — never trimmed or cropped — only
 * normalized to a generous size so every surface can scale it down to fill
 * its space. Falls back to redirecting to the original file.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ linkId: string }> },
) {
  const { linkId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(linkId)) return new NextResponse("Not found", { status: 404 });

  const row = await sqlOne<{ image_url: string | null }>(
    `select image_url from links where id = $1`, [linkId],
  );
  const url = row?.image_url;
  if (!url) return new NextResponse("Not found", { status: 404 });

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) throw new Error("fetch failed");
    const type = (res.headers.get("content-type") ?? "").split(";")[0];
    if (!type.startsWith("image/")) throw new Error("not an image");
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4_000_000) throw new Error("too large");

    try {
      const sharp = (await import("sharp")).default;
      // The uploaded file is shown exactly as uploaded — never trimmed or
      // cropped. It is only normalized to a generous size so the page can
      // always scale the photo DOWN to fill its space.
      const out = await sharp(buf)
        .resize(1400, 1400, { fit: "inside", withoutEnlargement: false })
        .png()
        .toBuffer();
      return new NextResponse(new Uint8Array(out), {
        // Short-lived cache only: a changed upload or a fixed pipeline must
        // reach every viewer within a minute, never an hour.
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=60",
        },
      });
    } catch {
      return new NextResponse(new Uint8Array(buf), {
        headers: { "content-type": type, "cache-control": "public, max-age=60" },
      });
    }
  } catch {
    return NextResponse.redirect(url);
  }
}
