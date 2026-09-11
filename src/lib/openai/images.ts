import { imagesEdit, imagesGenerate, loadImage, type ImageBytes, type ImageResult } from "./client";
import { IMAGE_SIZE, imageModel, type Aspect, type ImageTier } from "./models";

/**
 * Image rendering for the director's briefs. The director decides what;
 * these two functions make it with the right model for the tier:
 * `fast` (concepts, previews, variations) or `final` (the asset a business
 * will use). Editing keeps a real product, logo, person, place or car as it
 * is and changes only what the instructions name.
 */

export type GenerateImageInput = {
  prompt: string;
  aspect: Aspect;
  tier: ImageTier;
  /** high for finals; the fast tier renders at medium unless told otherwise. */
  quality?: "low" | "medium" | "high" | "auto";
  dryRun?: boolean;
};

export async function generateImage(i: GenerateImageInput): Promise<ImageResult & { size: string; model: string }> {
  const model = imageModel(i.tier);
  const size = IMAGE_SIZE[i.aspect];
  const res = await imagesGenerate({ model, prompt: i.prompt, size, quality: i.quality ?? (i.tier === "final" ? "high" : "medium"), dryRun: i.dryRun });
  return { ...res, size, model };
}

export type EditImageInput = {
  /** What to change and what to leave untouched, region by region. */
  instructions: string;
  /** The base image (first) and any references (logo, product), as bytes or URLs. */
  images: (ImageBytes | string)[];
  mask?: ImageBytes | null;
  aspect: Aspect;
  tier: ImageTier;
  quality?: "low" | "medium" | "high" | "auto";
  dryRun?: boolean;
};

export async function editImage(i: EditImageInput): Promise<ImageResult & { size: string; model: string }> {
  const model = imageModel(i.tier);
  const size = IMAGE_SIZE[i.aspect];
  const images: ImageBytes[] = [];
  for (const src of i.images) {
    const img = typeof src === "string" ? await loadImage(src) : src;
    if (img) images.push(img);
  }
  if (images.length === 0) throw new Error("editImage needs at least one readable image.");
  const res = await imagesEdit({ model, prompt: i.instructions, images, mask: i.mask ?? null, size, quality: i.quality ?? (i.tier === "final" ? "high" : "medium"), preserveInput: true, dryRun: i.dryRun });
  return { ...res, size, model };
}
