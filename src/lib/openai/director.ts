import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { imagePart, imageSize, loadImage, respond, textPart, type ImageBytes, type InputPart, type RespondResult } from "./client";
import { route, type Effort, type JobKind } from "./models";
import {
  campaignImages, creativeInstructions, creativeReviewInstructions, DESIGNER_INSTRUCTIONS, productBrain, referenceImage,
  reviewerInstructions, slug, SPEC_DIR, uiSystemText,
} from "./prompts";
import {
  COPY_SCHEMA, CREATIVE_DIRECTION_SCHEMA, CREATIVE_REVIEW_SCHEMA, SCREEN_REVIEW_SCHEMA, SCREEN_SCHEMA, SYSTEM_SCHEMA,
} from "./schemas";
import { screenDesignMarkdown, screenReviewMarkdown, systemMarkdown } from "./markdown";

/**
 * The design director's jobs. Each takes plain inputs, assembles the
 * material the director must see, routes to the right model and effort,
 * and returns typed JSON plus usage. Screen designs and reviews are also
 * saved under docs/design-specs and design-reviews so the engineer works
 * from files, not from chat.
 */

// ------------------------------------------------------------------- types

export type SystemSpec = Record<string, unknown> & { name: string; principles: string[] };

export type ScreenDesign = {
  concept: string; three_second_read: string; layout_architecture: string; visual_hierarchy: string[];
  content_order: { name: string; composition: string; height: string }[];
  removed: string[]; moved_deeper: string[]; media: string[]; typography: string[]; spacing: string[]; cards_and_rows: string[];
  cta: string[]; navigation: string; animation: string[]; desktop: string[]; empty_states: string[];
  implementation: { priority: number; change: string; where: string }[];
};

export type ScreenReview = {
  verdict: string; tapmart_match: number; generic_ai_look: number; reference_match: number; premium_feel: number; same_kit: boolean;
  kit: Record<string, number>; three_second_read: string; scores: Record<string, number>; keep: string[]; animation: string[];
  checklist: { priority: number; change: string; where: string; why: string }[];
};

export type CreativeBrief = {
  title: string; concept: string; subject: string; environment: string; composition: string; camera: string; lighting: string;
  color_treatment: string; headline: string; cta: string; aspect_ratio: "9:16" | "4:5" | "1:1" | "16:9" | "3:2";
  preserve: string[]; avoid: string[]; image_route: "fast" | "final"; generation_mode: "generate" | "edit"; prompt: string; source_image_use: string;
};

export type CreativeDirection = { brand_read: string; audience_read: string; concepts: CreativeBrief[] };

export type CreativeReview = {
  summary: string;
  scores: { purpose: number; brand: number; professional: number; not_ai_looking: number; text_clean: number; product_correct: number; premium: number };
  problems: string[]; verdict: "approve" | "edit" | "regenerate"; edit_instructions: string; revised_prompt: string;
};

export type CreativeAssetType = "STORY_AD" | "RECREATE_COVER" | "CAR_AD_PREVIEW" | "SOCIAL_POST" | "CAMPAIGN_COVER" | "BRAND_ASSET";

export type SourceImage = { url: string; role: "logo" | "product" | "photo" | "reference" | "car" | "reel_frame"; note?: string };

export type BusinessBrandInput = {
  name: string; category?: string | null; city?: string | null; description?: string | null; website?: string | null; instagram?: string | null;
  logoUrl?: string | null; colors?: string[]; typography?: { display?: string | null; body?: string | null } | null;
  tone?: string | null; photoStyle?: string | null; guidelines?: string[];
};

export type CreativeInput = {
  type: CreativeAssetType;
  business: BusinessBrandInput;
  objective: string;
  audience?: string | null;
  placement: string;
  offer?: string | null;
  product?: string | null;
  sourceImages?: SourceImage[];
  constraints?: string[];
  aspect?: CreativeBrief["aspect_ratio"];
  count?: number;
  effort?: Effort;
};

export type CommonOptions = { effort?: Effort; dryRun?: boolean; onProgress?: (s: string) => void };

// -------------------------------------------------------------- UI system

export async function designSystem(o: CommonOptions = {}): Promise<RespondResult<SystemSpec>> {
  const r = route("ui_system", o.effort);
  const content: InputPart[] = [textPart("Define TapMart's complete UI system. Every screen will be built from it, so every value must be exact and every role covered. Use the reference image as the aesthetic source of truth and the three campaign images to calibrate how media sits inside the system.")];
  content.push(...(await tapmartMaterial()));
  content.push(textPart(`=== TAPMART PRODUCT BRAIN ===\n${await productBrain()}\n=== END ===`));
  const res = await respond<SystemSpec>({ model: r.model, effort: r.effort, instructions: DESIGNER_INSTRUCTIONS, content, schema: SYSTEM_SCHEMA, dryRun: o.dryRun, onProgress: o.onProgress });
  if (!o.dryRun) await saveSpec("system", { screen: "system", model: r.model, when: new Date().toISOString(), usage: res.usage, spec: res.data }, systemMarkdown(res.data));
  return res;
}

// ----------------------------------------------------------- screen design

export type ScreenDesignInput = {
  screenName: string;
  purpose: string;
  data: string;
  actions: string;
  requirements?: string | null;
  /** Current screenshots: a functionality inventory, never a visual reference. */
  phoneScreenshot?: string | null;
  desktopScreenshot?: string | null;
  /** Real media that belongs on this screen, if any. */
  mediaUrls?: string[];
};

export async function designScreen(i: ScreenDesignInput, o: CommonOptions = {}): Promise<RespondResult<ScreenDesign>> {
  const r = route("screen_design", o.effort);
  const system = await uiSystemText();
  const content: InputPart[] = [textPart([
    `Redesign the "${i.screenName}" screen from scratch while preserving its product purpose and functionality.`,
    `SCREEN PURPOSE: ${i.purpose}`,
    `AVAILABLE DATA: ${i.data}`,
    `AVAILABLE ACTIONS: ${i.actions}`,
    `REQUIREMENTS: ${i.requirements || "Phone 390 wide first; desktop 1360 wide with a left rail; both clearly the same product."}`,
    system ? `THE UI SYSTEM YOU DEFINED (use it; extend it only if this screen needs a new part):\n${system}` : "",
  ].filter(Boolean).join("\n\n"))];
  content.push(...(await tapmartMaterial()));
  await pushImage(content, i.phoneScreenshot, "CURRENT PHONE SCREENSHOT (functionality inventory only; not a visual reference):");
  await pushImage(content, i.desktopScreenshot, "CURRENT DESKTOP SCREENSHOT (functionality inventory only; not a visual reference):");
  for (const url of i.mediaUrls ?? []) await pushImage(content, url, `REAL MEDIA that belongs on this screen (${url}):`);
  content.push(textPart(`=== TAPMART PRODUCT BRAIN ===\n${await productBrain()}\n=== END ===`));
  const res = await respond<ScreenDesign>({ model: r.model, effort: r.effort, instructions: DESIGNER_INSTRUCTIONS, content, schema: SCREEN_SCHEMA, dryRun: o.dryRun, onProgress: o.onProgress });
  if (!o.dryRun) await saveSpec(slug(i.screenName), { screen: i.screenName, model: r.model, when: new Date().toISOString(), usage: res.usage, spec: res.data }, screenDesignMarkdown(i.screenName, res.data));
  return res;
}

// ----------------------------------------------------------- screen review

export type ScreenReviewInput = {
  screenName: string;
  /** Path to the real browser screenshot. */
  screenshot: string;
  instructions?: string | null;
  /** Spec slug or path; derived from the screen name when omitted. */
  spec?: string | null;
  /** The last pass before the screen ships: higher effort. */
  final?: boolean;
  /** Mechanical QA after a tiny change: the cheap reviewer, low effort. */
  minor?: boolean;
  outDir?: string | null;
};

export async function reviewScreen(i: ScreenReviewInput, o: CommonOptions = {}): Promise<RespondResult<ScreenReview> & { markdown: string; specPath: string | null }> {
  const kind: JobKind = i.minor ? "minor_qa" : i.final ? "screen_review_final" : "screen_review";
  const r = route(kind, o.effort);
  const shot = await loadImage(i.screenshot);
  if (!shot) throw new Error(`Screenshot not readable: ${i.screenshot}`);
  const size = imageSize(shot);
  const ref = await referenceImage();
  const own = i.minor ? null : await loadSpecText(i.spec ?? null, i.screenName);
  const brain = await productBrain();
  const content: InputPart[] = [
    textPart([
      `Screen: ${i.screenName}.`,
      ref ? "Images in order: CURRENT SCREEN (the real app), REFERENCE IMAGE (the saved PNG)." : "One image: CURRENT SCREEN.",
      `Screenshot: ${size ? `${size.width}x${size.height}px, ` : ""}${size && size.width <= 900 ? "phone capture" : "desktop capture"}. A full-page phone capture can show the fixed bottom bar painted mid-page; that is a capture artifact, not a layout problem.`,
      i.instructions ? `Extra instructions from the team: ${i.instructions}` : "",
      "Answer with the JSON only.",
    ].filter(Boolean).join("\n")),
    textPart("CURRENT SCREEN:"), imagePart(shot),
  ];
  if (ref) content.push(textPart("REFERENCE IMAGE (the saved PNG):"), imagePart(ref));
  const res = await respond<ScreenReview>({
    model: r.model, effort: r.effort, instructions: reviewerInstructions(brain, await uiSystemText(), own?.text ?? null), content, schema: SCREEN_REVIEW_SCHEMA, dryRun: o.dryRun, onProgress: o.onProgress,
  });
  const when = new Date().toISOString();
  const markdown = o.dryRun ? "" : screenReviewMarkdown(res.data, { screenName: i.screenName, screenshot: i.screenshot, model: r.model, effort: r.effort, when, instructions: i.instructions ?? null, specPath: own?.path ?? null, hasReference: Boolean(ref) });
  if (!o.dryRun) {
    const dir = i.outDir ?? path.join(process.cwd(), "design-reviews");
    await mkdir(dir, { recursive: true });
    const base = path.join(dir, `${when.replace(/[:.]/g, "-")}-${slug(i.screenName)}`);
    await writeFile(`${base}.md`, markdown);
    await writeFile(`${base}.json`, JSON.stringify({ screen: i.screenName, screenshot: path.basename(i.screenshot), model: r.model, effort: r.effort, when, usage: res.usage, review: res.data }, null, 2));
  }
  return { ...res, markdown, specPath: own?.path ?? null };
}

// ------------------------------------------------------- creative direction

export async function designCreative(i: CreativeInput, o: CommonOptions = {}): Promise<RespondResult<CreativeDirection>> {
  const r = route("creative_direction", o.effort ?? i.effort);
  const b = i.business;
  const brand = [
    `BUSINESS: ${b.name}${b.category ? ` (${b.category})` : ""}${b.city ? `, ${b.city}` : ""}.`,
    b.description ? `About: ${b.description}` : "",
    b.website ? `Website: ${b.website}` : "", b.instagram ? `Instagram: ${b.instagram}` : "",
    b.colors?.length ? `Brand colours: ${b.colors.join(", ")}` : "Brand colours: not set (derive from the logo and photos; do not invent a palette that fights them).",
    b.typography?.display || b.typography?.body ? `Typography: display ${b.typography.display ?? "unset"}, body ${b.typography.body ?? "unset"}` : "",
    b.tone ? `Tone: ${b.tone}` : "", b.photoStyle ? `Photo style: ${b.photoStyle}` : "",
    b.guidelines?.length ? `Guidelines: ${b.guidelines.join("; ")}` : "",
  ].filter(Boolean).join("\n");
  const sources = i.sourceImages ?? [];
  const content: InputPart[] = [textPart([
    `Direct ${i.count ?? 1} ${i.count && i.count > 1 ? "distinct concepts" : "concept"} for a ${label(i.type)}.`,
    brand,
    `OBJECTIVE: ${i.objective}`,
    i.audience ? `AUDIENCE: ${i.audience}` : "",
    `PLACEMENT: ${i.placement}`,
    i.offer ? `OFFER: ${i.offer}` : "", i.product ? `PRODUCT OR SERVICE: ${i.product}` : "",
    i.aspect ? `ASPECT RATIO: ${i.aspect}` : "",
    i.constraints?.length ? `CONSTRAINTS: ${i.constraints.join("; ")}` : "",
    sources.length ? `SOURCE IMAGES (${sources.length}) follow, each labelled with its role. Real assets are preserved through editing; they are never redrawn.` : "No source images exist for this business yet; the concept must not pretend to show its real product, people or storefront. Use generation_mode 'generate' and keep the subject generic to the category.",
    "Return the JSON only.",
  ].filter(Boolean).join("\n\n"))];
  for (const s of sources) await pushImage(content, s.url, `SOURCE IMAGE, role ${s.role}${s.note ? ` (${s.note})` : ""}:`);
  content.push(textPart("PRIMARY TAPMART VISUAL REFERENCE (the quality and material bar; not a template for the ad):"));
  const ref = await referenceImage();
  if (ref) content.push(imagePart(ref, "low"));
  return respond<CreativeDirection>({ model: r.model, effort: r.effort, instructions: creativeInstructions(await productBrain()), content, schema: CREATIVE_DIRECTION_SCHEMA, dryRun: o.dryRun, onProgress: o.onProgress });
}

export type CreativeReviewInput = {
  type: CreativeAssetType;
  brief: CreativeBrief;
  business: BusinessBrandInput;
  /** The generated or edited image to judge. */
  image: ImageBytes;
  /** The real sources it had to preserve, if any. */
  sourceImages?: SourceImage[];
  final?: boolean;
  round: number;
};

export async function reviewCreative(i: CreativeReviewInput, o: CommonOptions = {}): Promise<RespondResult<CreativeReview>> {
  const r = route(i.final ? "creative_final_review" : "creative_review", o.effort);
  const content: InputPart[] = [textPart([
    `Review round ${i.round} of a ${label(i.type)} for ${i.business.name}${i.business.category ? ` (${i.business.category})` : ""}.`,
    `THE BRIEF YOU WROTE: ${JSON.stringify(i.brief)}`,
    i.business.colors?.length ? `Brand colours: ${i.business.colors.join(", ")}` : "",
    "The GENERATED IMAGE follows, then the source images it had to preserve, if any. Judge the actual pixels. Return the JSON only.",
  ].filter(Boolean).join("\n\n")), textPart("GENERATED IMAGE:"), imagePart(i.image)];
  for (const s of i.sourceImages ?? []) await pushImage(content, s.url, `SOURCE IMAGE, role ${s.role}:`);
  return respond<CreativeReview>({ model: r.model, effort: r.effort, instructions: creativeReviewInstructions(), content, schema: CREATIVE_REVIEW_SCHEMA, dryRun: o.dryRun, onProgress: o.onProgress });
}

export async function writeCopy(i: { business: BusinessBrandInput; purpose: string; placement: string; count?: number }, o: CommonOptions = {}): Promise<RespondResult<{ options: { headline: string; cta: string; why: string }[] }>> {
  const r = route("copy", o.effort);
  const content: InputPart[] = [textPart(`Write ${i.count ?? 3} headline and CTA options for ${i.business.name}${i.business.category ? ` (${i.business.category})` : ""}. Purpose: ${i.purpose}. Placement: ${i.placement}. ${i.business.tone ? `Tone: ${i.business.tone}.` : ""} Headlines at most six words; CTAs at most three. No exclamation marks, no emoji, no corporate filler. Return the JSON only.`)];
  return respond({ model: r.model, effort: r.effort, instructions: creativeInstructions(await productBrain()), content, schema: COPY_SCHEMA, dryRun: o.dryRun, onProgress: o.onProgress });
}

// ----------------------------------------------------------------- helpers

export function label(t: CreativeAssetType): string {
  return { STORY_AD: "9:16 Instagram Story advertisement", RECREATE_COVER: "Recreate campaign cover", CAR_AD_PREVIEW: "car advertising placement preview", SOCIAL_POST: "social post creative", CAMPAIGN_COVER: "campaign cover image", BRAND_ASSET: "brand asset" }[t];
}

async function tapmartMaterial(): Promise<InputPart[]> {
  const parts: InputPart[] = [];
  const ref = await referenceImage();
  if (ref) parts.push(textPart("PRIMARY VISUAL REFERENCE (aesthetic source of truth):"), imagePart(ref));
  for (const c of await campaignImages()) parts.push(textPart(c.label), imagePart(c.image));
  return parts;
}

async function pushImage(content: InputPart[], source: string | null | undefined, caption: string) {
  if (!source) return;
  const img = await loadImage(source);
  if (img) content.push(textPart(caption), imagePart(img));
}

async function saveSpec(name: string, json: unknown, markdown: string) {
  await mkdir(SPEC_DIR, { recursive: true });
  await writeFile(path.join(SPEC_DIR, `${name}.json`), JSON.stringify(json, null, 2));
  await writeFile(path.join(SPEC_DIR, `${name}.md`), markdown);
}

/** The director's saved design for a screen, as compact JSON text. */
export async function loadSpecText(spec: string | null, screenName: string): Promise<{ path: string; text: string } | null> {
  let file: string;
  if (spec && /\.json$/.test(spec)) file = path.resolve(spec);
  else if (spec) file = path.join(SPEC_DIR, `${spec}.json`);
  else file = path.join(SPEC_DIR, `${slug(screenName.split(/[(,]/)[0].trim())}.json`);
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    return { path: file, text: JSON.stringify(parsed.spec) };
  } catch {
    return null;
  }
}
