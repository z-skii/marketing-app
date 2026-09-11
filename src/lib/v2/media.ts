import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { supabaseService, isSupabaseConfigured, STORAGE_BUCKET } from "@/lib/supabase";

/**
 * V2 media: profile photos, business logos, vehicle photos, campaign
 * references, submissions, portfolio work. Files land in organized storage
 * folders. Without a configured service key (local development) files are
 * written under public/uploads — dev only, never the production path.
 */

const MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export type MediaFolder =
  | "avatars" | "business" | "vehicles" | "campaigns" | "submissions" | "portfolio" | "proofs"
  /** Images the OpenAI creative system made for a business (see lib/openai/assets.ts). */
  | "creative";

export async function storeMedia(
  folder: MediaFolder,
  file: { bytes: ArrayBuffer; contentType: string },
): Promise<{ url: string } | { error: string }> {
  const ext = ALLOWED[file.contentType];
  if (!ext) return { error: "Use a JPG, PNG, WebP image or an MP4/WebM/MOV video." };
  if (file.bytes.byteLength > MAX_BYTES) return { error: "File is too big. Keep it under 25MB." };
  if (file.bytes.byteLength === 0) return { error: "That file is empty." };

  const name = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = supabaseService();
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(name, file.bytes, { contentType: file.contentType, upsert: false });
    if (error) return { error: "Upload failed. Try again." };
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(name);
    return { url: data.publicUrl };
  }

  if (process.env.NODE_ENV === "production") {
    return { error: "Uploads aren't configured yet. Add SUPABASE_SERVICE_ROLE_KEY." };
  }
  // Local development fallback: keep the flow testable without cloud storage.
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const filename = path.basename(name);
  await writeFile(path.join(dir, filename), Buffer.from(file.bytes));
  return { url: `/uploads/${folder}/${filename}` };
}
