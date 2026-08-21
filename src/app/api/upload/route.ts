import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured, STORAGE_BUCKET, supabaseService } from "@/lib/supabase";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

/**
 * Link artwork upload → Supabase Storage.
 *
 * Validation happens here, server-side: content type by magic bytes rather than
 * the client's claim, and a hard size cap. SVG is refused in V1 — it can carry
 * script. When Supabase Storage is not configured the endpoint reports that
 * plainly and the UI falls back to an image URL field.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;

const SIGNATURES: Array<{ mime: string; ext: string; match: (b: Buffer) => boolean }> = [
  { mime: "image/png", ext: "png", match: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/jpeg", ext: "jpg", match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/webp", ext: "webp", match: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
];

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  if (!rateLimit(`upload:${user.id}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many uploads. Try again shortly." }, { status: 429 });
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Uploads aren't configured. Paste an image URL instead.", unconfigured: true },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach an image file." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Images are capped at 2 MB." }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = SIGNATURES.find((s) => s.match(bytes));
  if (!kind) {
    return NextResponse.json({ error: "PNG, JPG, or WEBP only." }, { status: 415 });
  }

  const path = `${user.id}/${randomUUID()}.${kind.ext}`;
  const storage = supabaseService().storage.from(STORAGE_BUCKET);

  const { error } = await storage.upload(path, bytes, {
    contentType: kind.mime,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: "That upload didn't go through." }, { status: 502 });
  }

  const { data } = storage.getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
