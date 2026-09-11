import { imagesEdit, imagesGenerate, loadImage, OpenAiError, type ImageBytes, type ImageResult } from "./client";
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
  format?: "png" | "jpeg" | "webp";
  dryRun?: boolean;
};

export async function generateImage(i: GenerateImageInput): Promise<ImageResult & { size: string; model: string; quality: string }> {
  const model = imageModel(i.tier);
  const size = IMAGE_SIZE[i.aspect];
  const quality = i.quality ?? (i.tier === "final" ? "high" : "medium");
  try {
    const res = await imagesGenerate({ model, prompt: i.prompt, size, quality, format: i.format, dryRun: i.dryRun });
    return { ...res, size, model, quality };
  } catch (e) {
    // The upstream renderer drops some long high quality requests with a 502.
    // The same request at medium quality renders in seconds; a medium render
    // beats no render, and the record says which quality was used.
    if (quality === "high" && e instanceof OpenAiError && e.code === "upstream") {
      const res = await imagesGenerate({ model, prompt: i.prompt, size, quality: "medium", format: i.format, dryRun: i.dryRun });
      return { ...res, size, model, quality: "medium (high failed upstream)" };
    }
    throw e;
  }
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
  format?: "png" | "jpeg" | "webp";
  dryRun?: boolean;
};

export async function editImage(i: EditImageInput): Promise<ImageResult & { size: string; model: string; quality: string }> {
  const model = imageModel(i.tier);
  const size = IMAGE_SIZE[i.aspect];
  const images: ImageBytes[] = [];
  for (const src of i.images) {
    const img = typeof src === "string" ? await loadImage(src) : src;
    if (img) images.push(img);
  }
  if (images.length === 0) throw new Error("editImage needs at least one readable image.");
  const quality = i.quality ?? (i.tier === "final" ? "high" : "medium");
  try {
    const res = await imagesEdit({ model, prompt: i.instructions, images, mask: i.mask ?? null, size, quality, format: i.format, preserveInput: true, dryRun: i.dryRun });
    return { ...res, size, model, quality };
  } catch (e) {
    if (quality === "high" && e instanceof OpenAiError && e.code === "upstream") {
      const res = await imagesEdit({ model, prompt: i.instructions, images, mask: i.mask ?? null, size, quality: "medium", format: i.format, preserveInput: true, dryRun: i.dryRun });
      return { ...res, size, model, quality: "medium (high failed upstream)" };
    }
    throw e;
  }
}
