import "server-only";
import { access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * The real aspect ratio of an uploaded image, read from the file when it
 * lives in this deployment's public uploads. Frame Shift shows sources at
 * their own ratio; when the ratio cannot be read (a remote file, a video),
 * the caller falls back to an honest contained frame.
 */
const cache = new Map<string, number | null>();

export async function imageRatio(url: string | null | undefined): Promise<number | null> {
  if (!url || !url.startsWith("/uploads/") || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)) return null;
  const clean = url.split(/[?#]/)[0];
  if (cache.has(clean)) return cache.get(clean) ?? null;
  const file = path.join(process.cwd(), "public", clean);
  let ratio: number | null = null;
  try {
    await access(file);
    const meta = await sharp(file).metadata();
    if (meta.width && meta.height) {
      const rotated = meta.orientation && meta.orientation >= 5;
      ratio = rotated ? meta.height / meta.width : meta.width / meta.height;
    }
  } catch {
    ratio = null;
  }
  cache.set(clean, ratio);
  return ratio;
}
