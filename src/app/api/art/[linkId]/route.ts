import { NextResponse } from "next/server";
import { sqlOne } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A link's artwork with the dead space cut off. Uploads are often screenshots
 * padded with their own background; every surface that displays the photo goes
 * through here so what people see is the content, not the canvas. Falls back
 * to the original file whenever trimming isn't possible.
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
      // Trim the canvas padding, then normalize to a generous size so the
      // page can always scale the photo DOWN to fill its space — a small
      // upload never renders as a small photo.
      const out = await sharp(buf)
        .trim({ threshold: 40 })
        .resize(1400, 1400, { fit: "inside", withoutEnlargement: false })
        .png()
        .toBuffer();
      return new NextResponse(new Uint8Array(out), {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=300, s-maxage=3600",
        },
      });
    } catch {
      return new NextResponse(new Uint8Array(buf), {
        headers: { "content-type": type, "cache-control": "public, max-age=300" },
      });
    }
  } catch {
    return NextResponse.redirect(url);
  }
}
