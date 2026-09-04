import "server-only";
import { supabaseService, STORAGE_BUCKET } from "./supabase";

/**
 * Rendered ads land in the storage bucket under ads/ so publishing has a
 * public URL to hand to the platforms. When the service key is not
 * configured (local dev), callers fall back to the render endpoint URL —
 * the admin review screen still shows the image; only external publishing
 * needs the stored copy.
 */
export async function uploadAdPng(png: ArrayBuffer): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const name = `ads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const supabase = supabaseService();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(name, png, { contentType: "image/png", cacheControl: "31536000" });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(name).data.publicUrl;
}
