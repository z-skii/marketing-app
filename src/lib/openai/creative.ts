import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { imageSize, loadImage, type ImageBytes, type Usage } from "./client";
import {
  designCreative, reviewCreative, type BusinessBrandInput, type CreativeAssetType, type CreativeBrief, type CreativeInput, type CreativeReview, type SourceImage,
} from "./director";
import { editImage, generateImage } from "./images";
import { imageModel, MODELS, type Aspect, type Effort, type ImageTier } from "./models";
import { saveCreativeAsset, totalUsage, type CreativeAsset } from "./assets";

/**
 * The creative loop every asset type shares:
 *
 *   director writes the brief  ->  image model renders it  ->  director
 *   reviews the ACTUAL image   ->  approve, or edit with precise
 *   instructions, or regenerate with a revised prompt  ->  repeat within
 *   the round budget  ->  save as a DRAFT in the asset library.
 *
 * Nothing here publishes. A person approves or rejects the result.
 * Each step's usage is recorded on the asset so cost per job is visible.
 */

export type RenderedRound = {
  round: number;
  action: "generate" | "edit" | "regenerate";
  image: ImageBytes;
  imageModel: string;
  size: string;
  quality?: string;
  prompt: string;
  review: CreativeReview | null;
  usage: Usage[];
};

export type CreativeJobResult = {
  type: CreativeAssetType;
  brandRead: string;
  audienceRead: string;
  brief: CreativeBrief;
  rounds: RenderedRound[];
  /** The last rendered image: what a person will see as the draft or final. */
  image: ImageBytes;
  finalReview: CreativeReview | null;
  approvedByDirector: boolean;
  usage: Usage[];
  asset: CreativeAsset | null;
  /** Where files went when the job ran without the database (CLI tests). */
  files?: string[];
};

export type CreativeJobOptions = {
  /** Which image model renders: fast for concepts and previews, final for the selected asset. */
  tier: ImageTier;
  /** How many review-and-fix rounds after the first render. Drafts get 1, finals 2. */
  maxFixRounds?: number;
  /** Save into creative_assets (needs DATABASE_URL). false keeps everything in memory or on disk. */
  save?: boolean;
  businessId?: string | null;
  campaignId?: string | null;
  createdBy?: string | null;
  /** Write every round's image and JSON here (CLI tests, debugging). */
  outDir?: string | null;
  effort?: Effort;
  dryRun?: boolean;
  onProgress?: (message: string) => void;
};

/** Run one concept from brief to reviewed image. The brief may be supplied (a chosen concept) or directed now. */
export async function runCreativeJob(input: CreativeInput, o: CreativeJobOptions, chosen?: { brief: CreativeBrief; brandRead: string; audienceRead: string }): Promise<CreativeJobResult> {
  const say = o.onProgress ?? (() => {});
  const usage: Usage[] = [];
  let brief: CreativeBrief;
  let brandRead = chosen?.brandRead ?? "";
  let audienceRead = chosen?.audienceRead ?? "";
  if (chosen) {
    brief = chosen.brief;
  } else {
    say(`Directing a ${input.type} concept with ${MODELS.director}`);
    const d = await designCreative({ ...input, count: 1 }, { effort: o.effort, dryRun: o.dryRun });
    usage.push(d.usage);
    if (o.dryRun) return dry(input.type, usage);
    brief = d.data.concepts[0];
    brandRead = d.data.brand_read;
    audienceRead = d.data.audience_read;
  }
  if (input.aspect) brief.aspect_ratio = input.aspect;
  const sources = input.sourceImages ?? [];
  const sourceUrls = sources.map((s) => s.url);

  const rounds: RenderedRound[] = [];
  let round = 1;
  let action: RenderedRound["action"] = brief.generation_mode === "edit" && sources.length > 0 ? "edit" : "generate";
  let prompt = brief.prompt;
  let base: ImageBytes | null = null;
  const budget = o.maxFixRounds ?? (o.tier === "final" ? 2 : 1);

  while (true) {
    say(`Round ${round}: ${action} with ${imageModel(o.tier)}`);
    let r: Awaited<ReturnType<typeof generateImage>>;
    try {
      r = action === "generate" || action === "regenerate"
        ? await generateImage({ prompt, aspect: brief.aspect_ratio, tier: o.tier })
        : await editImage({ instructions: prompt, images: base ? [base, ...sourceUrls] : sourceUrls, aspect: brief.aspect_ratio, tier: o.tier });
    } catch (e) {
      // A failed fix round must not throw away the image already reviewed.
      if (rounds.length === 0) throw e;
      say(`Round ${round}: ${action} failed (${e instanceof Error ? e.message.slice(0, 160) : String(e)}); keeping round ${rounds.length}.`);
      break;
    }
    const image: ImageBytes = r.images[0];
    const stepUsage: Usage[] = [r.usage];
    say(`Round ${round}: reviewing the image with ${MODELS.director}`);
    const rv = await reviewCreative({ type: input.type, brief, business: input.business, image, sourceImages: sources, final: o.tier === "final", round }, { effort: o.tier === "final" ? undefined : "medium" });
    stepUsage.push(rv.usage);
    usage.push(...stepUsage);
    rounds.push({ round, action, image, imageModel: r.model, size: r.size, quality: r.quality, prompt, review: rv.data, usage: stepUsage });
    say(`Round ${round}: ${rv.data.verdict} (purpose ${rv.data.scores.purpose}, brand ${rv.data.scores.brand}, not AI looking ${rv.data.scores.not_ai_looking}, premium ${rv.data.scores.premium})`);

    if (rv.data.verdict === "approve" || round > budget) break;
    round += 1;
    if (rv.data.verdict === "edit" && rv.data.edit_instructions.trim()) {
      action = "edit";
      prompt = rv.data.edit_instructions;
      base = image;
    } else {
      action = "regenerate";
      prompt = rv.data.revised_prompt.trim() || brief.prompt;
      base = null;
    }
  }

  const last = rounds[rounds.length - 1];
  const result: CreativeJobResult = {
    type: input.type, brandRead, audienceRead, brief, rounds, image: last.image, finalReview: last.review,
    approvedByDirector: last.review?.verdict === "approve", usage, asset: null,
  };

  if (o.outDir) result.files = await writeRounds(o.outDir, input, result);

  if (o.save !== false && o.businessId) {
    const size = imageSize(last.image);
    result.asset = await saveCreativeAsset({
      businessId: o.businessId, campaignId: o.campaignId ?? null, type: input.type, stage: o.tier === "final" ? "final" : "draft",
      image: last.image, aspect: brief.aspect_ratio, size: last.size, width: size?.width ?? null, height: size?.height ?? null,
      directorModel: MODELS.director, imageModel: last.imageModel, prompt: last.prompt, round: last.round,
      sourceUrls, brief, review: last.review, usage, createdBy: o.createdBy ?? null,
    });
  }
  return result;
}

// ----------------------------------------------------------- entry points

export type StoryAdInput = {
  business: BusinessBrandInput;
  objective: string;
  offer?: string | null;
  product?: string | null;
  audience?: string | null;
  sourceImages?: SourceImage[];
  constraints?: string[];
};

/**
 * Instagram Story ads, step one: the director studies the brand and writes
 * N distinct concepts; each is rendered fast and reviewed once. The business
 * picks one; `finalizeStoryAd` then renders it at final quality.
 */
export async function storyAdConcepts(i: StoryAdInput, o: Omit<CreativeJobOptions, "tier"> & { count?: number }): Promise<{ brandRead: string; audienceRead: string; concepts: CreativeJobResult[]; usage: Usage[] }> {
  const say = o.onProgress ?? (() => {});
  const count = o.count ?? 3;
  const input: CreativeInput = {
    type: "STORY_AD", business: i.business, objective: i.objective, offer: i.offer, product: i.product, audience: i.audience,
    placement: "Instagram Story, full screen 9:16, posted by a creator for 24 hours. Keep the top 250px and bottom 300px free of anything essential (profile bar and reply field overlap them). Not filled with text; the product or place carries it.",
    sourceImages: i.sourceImages, constraints: ["NOT obviously AI generated", "NOT a template look", "consistent with the business brand", "ready to post as is", ...(i.constraints ?? [])],
    aspect: "9:16", count,
  };
  say(`Directing ${count} Story concepts for ${i.business.name} with ${MODELS.director}`);
  const d = await designCreative(input, { effort: o.effort, dryRun: o.dryRun });
  const usage: Usage[] = [d.usage];
  if (o.dryRun) return { brandRead: "", audienceRead: "", concepts: [], usage };
  const concepts: CreativeJobResult[] = [];
  for (const brief of d.data.concepts.slice(0, count)) {
    brief.image_route = "fast";
    const r = await runCreativeJob(input, { ...o, tier: "fast", maxFixRounds: o.maxFixRounds ?? 1 }, { brief, brandRead: d.data.brand_read, audienceRead: d.data.audience_read });
    usage.push(...r.usage);
    concepts.push(r);
  }
  return { brandRead: d.data.brand_read, audienceRead: d.data.audience_read, concepts, usage };
}

/** Step two: the chosen concept at final quality, with up to two director fix rounds. Still a draft until a person approves it. */
export async function finalizeStoryAd(i: StoryAdInput & { brief: CreativeBrief; brandRead?: string; audienceRead?: string; parentAssetId?: string | null }, o: Omit<CreativeJobOptions, "tier">): Promise<CreativeJobResult> {
  const input: CreativeInput = {
    type: "STORY_AD", business: i.business, objective: i.objective, offer: i.offer, product: i.product, audience: i.audience,
    placement: "Instagram Story, full screen 9:16.", sourceImages: i.sourceImages, constraints: i.constraints, aspect: "9:16",
  };
  const brief = { ...i.brief, image_route: "final" as const };
  return runCreativeJob(input, { ...o, tier: "final", maxFixRounds: o.maxFixRounds ?? 2 }, { brief, brandRead: i.brandRead ?? "", audienceRead: i.audienceRead ?? "" });
}

/** A Recreate campaign cover: says "this is a video you can get paid to recreate" at a glance. Uses real reference frames when there are any. */
export async function recreateCover(i: { business: BusinessBrandInput; reelTitle: string; reelSummary: string; referenceFrames?: string[]; placementNote?: string | null }, o: CreativeJobOptions): Promise<CreativeJobResult> {
  return runCreativeJob({
    type: "RECREATE_COVER", business: i.business,
    objective: `A cover for a Recreate campaign. A creator sees it in a feed of paid opportunities and must understand instantly: this is a specific short video I can film my own version of, for this business, and get paid. Reel: "${i.reelTitle}". ${i.reelSummary}`,
    placement: "Campaign cover in the TapMart feed, media 4:5, with a lime payout and a title laid over the bottom by the app (leave the bottom third calm).",
    sourceImages: (i.referenceFrames ?? []).map((url) => ({ url, role: "reel_frame" as const })),
    constraints: ["No fake app UI, no fake play buttons, no text on the image", i.placementNote ?? ""].filter(Boolean), aspect: "4:5",
  }, o);
}

/** A car advertising direction and preview on a real driver's car. The car stays itself; only the named placement zones carry the ad. */
export async function carAdPreview(i: { business: BusinessBrandInput; goal: string; car: { label: string; color?: string | null; photoUrl: string }; zones: string[] }, o: CreativeJobOptions): Promise<CreativeJobResult> {
  return runCreativeJob({
    type: "CAR_AD_PREVIEW", business: i.business,
    objective: `An advertising concept for this business on a real driver's car (${i.car.label}${i.car.color ? `, ${i.car.color}` : ""}). Goal: ${i.goal}. The artwork lives only on these zones: ${i.zones.join(", ")}. Realistic vinyl on the real car; the car's identity, colour, shape, plates and surroundings stay exactly as photographed.`,
    placement: `Vehicle placement zones: ${i.zones.join(", ")}. Preview shown to the business before anything is printed.`,
    sourceImages: [{ url: i.car.photoUrl, role: "car", note: "the real car; edit this image, do not redraw the car" }, ...(i.business.logoUrl ? [{ url: i.business.logoUrl, role: "logo" as const }] : [])],
    constraints: ["Edit the real car photo; never generate a different car", "Only the named zones change", "Legible from ten metres: logo and at most five words"], aspect: "3:2",
  }, o);
}

/** Real business photography turned into a creative: edit, never regenerate the place, product or people. */
export async function photoCreative(i: { business: BusinessBrandInput; type: Extract<CreativeAssetType, "STORY_AD" | "SOCIAL_POST" | "CAMPAIGN_COVER">; photoUrl: string; objective: string; placement: string; aspect: Aspect; preserve?: string[] }, o: CreativeJobOptions): Promise<CreativeJobResult> {
  return runCreativeJob({
    type: i.type, business: i.business, objective: i.objective, placement: i.placement, aspect: i.aspect,
    sourceImages: [{ url: i.photoUrl, role: "photo", note: "real business photography; this is the base image" }, ...(i.business.logoUrl ? [{ url: i.business.logoUrl, role: "logo" as const }] : [])],
    constraints: ["generation_mode must be edit", `Preserve: ${(i.preserve ?? ["products", "store details", "people", "logos", "brand identity"]).join(", ")}`],
  }, o);
}

/** Brand creative: a mood or template asset that refines the existing identity after research, never a new brand. */
export async function brandAsset(i: { business: BusinessBrandInput; ask: string; sourceImages?: SourceImage[]; aspect?: Aspect }, o: CreativeJobOptions): Promise<CreativeJobResult> {
  return runCreativeJob({
    type: "BRAND_ASSET", business: i.business,
    objective: `${i.ask} Start from the existing identity in the inputs (logo, colours, photos, tone); analyse, then refine. Do not invent a new brand.`,
    placement: "Brand kit preview for the business to approve.", sourceImages: i.sourceImages, aspect: i.aspect ?? "4:5",
  }, o);
}

// ----------------------------------------------------------------- helpers

function dry(type: CreativeAssetType, usage: Usage[]): CreativeJobResult {
  const empty: ImageBytes = { bytes: Buffer.alloc(0), contentType: "image/png" };
  const brief = { title: "", concept: "", subject: "", environment: "", composition: "", camera: "", lighting: "", color_treatment: "", headline: "", cta: "", aspect_ratio: "9:16" as const, preserve: [], avoid: [], image_route: "fast" as const, generation_mode: "generate" as const, prompt: "", source_image_use: "" };
  return { type, brandRead: "", audienceRead: "", brief, rounds: [], image: empty, finalReview: null, approvedByDirector: false, usage, asset: null };
}

async function writeRounds(dir: string, input: CreativeInput, r: CreativeJobResult): Promise<string[]> {
  await mkdir(dir, { recursive: true });
  const stem = `${input.type.toLowerCase()}-${r.brief.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "concept"}`;
  const files: string[] = [];
  for (const round of r.rounds) {
    const ext = round.image.contentType === "image/png" ? "png" : round.image.contentType === "image/jpeg" ? "jpg" : "webp";
    const file = path.join(dir, `${stem}-round${round.round}.${ext}`);
    await writeFile(file, round.image.bytes);
    files.push(file);
  }
  const json = path.join(dir, `${stem}.json`);
  await writeFile(json, JSON.stringify({
    type: r.type, business: input.business.name, brandRead: r.brandRead, audienceRead: r.audienceRead, brief: r.brief,
    rounds: r.rounds.map((x) => ({ round: x.round, action: x.action, imageModel: x.imageModel, size: x.size, quality: x.quality, prompt: x.prompt, review: x.review, usage: x.usage })),
    approvedByDirector: r.approvedByDirector, usage: totalUsage(r.usage), directorModel: MODELS.director,
  }, null, 2));
  files.push(json);
  const md = path.join(dir, `${stem}.md`);
  await writeFile(md, creativeMarkdown(input, r));
  files.push(md);
  return files;
}

export function creativeMarkdown(input: CreativeInput, r: CreativeJobResult): string {
  const b = r.brief;
  const lines = [`# ${input.type}: ${b.title}`, "", `Business: ${input.business.name} · Director: ${MODELS.director} · Image: ${r.rounds.map((x) => x.imageModel).filter((v, i, a) => a.indexOf(v) === i).join(", ")}`, ""];
  if (r.brandRead) lines.push(`**Brand read.** ${r.brandRead}`, "");
  if (r.audienceRead) lines.push(`**Audience.** ${r.audienceRead}`, "");
  lines.push("## Creative brief", "", `**Concept.** ${b.concept}`, "", `- Subject: ${b.subject}`, `- Environment: ${b.environment}`, `- Composition: ${b.composition}`, `- Camera: ${b.camera}`, `- Lighting: ${b.lighting}`, `- Colour: ${b.color_treatment}`, `- Headline: ${b.headline || "(none)"}`, `- CTA: ${b.cta || "(none)"}`, `- Aspect: ${b.aspect_ratio}`, `- Preserve: ${b.preserve.join("; ") || "(nothing; no source images)"}`, `- Avoid: ${b.avoid.join("; ")}`, `- Route: ${b.image_route} · Mode: ${b.generation_mode}`, "", "**Prompt.**", "", b.prompt, "");
  for (const x of r.rounds) {
    lines.push(`## Round ${x.round}: ${x.action} (${x.imageModel}, ${x.size}${x.quality ? `, ${x.quality}` : ""})`, "");
    if (x.action !== "generate") lines.push("**Instructions.**", "", x.prompt, "");
    if (x.review) {
      const s = x.review.scores;
      lines.push(`**Director review: ${x.review.verdict.toUpperCase()}.** ${x.review.summary}`, "", `purpose ${s.purpose} · brand ${s.brand} · professional ${s.professional} · not AI looking ${s.not_ai_looking} · text clean ${s.text_clean} · product correct ${s.product_correct} · premium ${s.premium}`, "");
      if (x.review.problems.length) { lines.push("Problems:", ""); for (const p of x.review.problems) lines.push(`- ${p}`); lines.push(""); }
      if (x.review.edit_instructions) lines.push("Edit instructions:", "", x.review.edit_instructions, "");
      if (x.review.revised_prompt) lines.push("Revised prompt:", "", x.review.revised_prompt, "");
    }
  }
  const u = totalUsage(r.usage);
  lines.push(`Usage: ${u.calls} calls, ${u.input_tokens} input tokens, ${u.output_tokens} output tokens, ${u.images} images. Director approved: ${r.approvedByDirector ? "yes" : "no"}. Status: draft until a person approves it.`, "");
  return lines.join("\n");
}
