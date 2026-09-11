/**
 * TapMart's OpenAI model router: the one place a model id or a reasoning
 * effort is chosen. Nothing else in the codebase names a model.
 *
 * Roles
 *   DESIGN DIRECTOR   gpt-6-astra   creative director, product designer, art
 *                                   director. Designs screens and creatives,
 *                                   reviews screenshots and generated images,
 *                                   writes edit instructions, gives final
 *                                   creative approval.
 *   IMAGE FINAL       gpt-image-2.5-sunburst   high fidelity generation and
 *                                   editing for the selected final asset.
 *   IMAGE FAST        gpt-image-2.5-flare      concepts, previews, variations.
 *   QA REVIEWER       gpt-5.5       mechanical screenshot checks only; never
 *                                   a creative or design decision.
 *
 * Every id is overridable by environment variable so a rename never needs a
 * code change. Jobs pick a role and an effort through route(); callers never
 * pass a model id.
 */

export type ModelRole = "director" | "image_final" | "image_fast" | "qa";

export type Effort = "none" | "minimal" | "low" | "medium" | "high" | "xhigh";

export const MODELS: Record<ModelRole, string> = {
  director: env("OPENAI_DESIGN_DIRECTOR_MODEL") ?? env("OPENAI_DESIGN_MODEL") ?? "gpt-6-astra",
  image_final: env("OPENAI_IMAGE_FINAL_MODEL") ?? "gpt-image-2.5-sunburst",
  image_fast: env("OPENAI_IMAGE_FAST_MODEL") ?? "gpt-image-2.5-flare",
  qa: env("OPENAI_QA_MODEL") ?? env("OPENAI_REVIEW_MODEL") ?? "gpt-5.5",
};

/** What each kind of work costs in judgment. Expensive on purpose, cheap on purpose. */
export type JobKind =
  | "ui_system"           // define the whole UI system
  | "screen_design"       // design a major screen from scratch
  | "screen_review"       // compare a real screenshot with the director's own design
  | "screen_review_final" // the last pass before a screen ships
  | "creative_direction"  // ad, story, car, photo, brand concept and brief
  | "creative_review"     // judge a generated or edited image
  | "creative_final_review"
  | "copy"                // headlines, CTA lines, short copy
  | "minor_qa";           // mechanical screenshot checks after tiny changes

export type Route = { role: ModelRole; model: string; effort: Effort };

const ROUTES: Record<JobKind, { role: ModelRole; effort: Effort }> = {
  ui_system: { role: "director", effort: "xhigh" },
  screen_design: { role: "director", effort: "high" },
  screen_review: { role: "director", effort: "medium" },
  screen_review_final: { role: "director", effort: "high" },
  creative_direction: { role: "director", effort: "high" },
  creative_review: { role: "director", effort: "medium" },
  creative_final_review: { role: "director", effort: "high" },
  copy: { role: "director", effort: "medium" },
  minor_qa: { role: "qa", effort: "low" },
};

/** The model and effort for a kind of job; `effort` overrides the default for one call. */
export function route(kind: JobKind, effort?: Effort): Route {
  const r = ROUTES[kind];
  return { role: r.role, model: MODELS[r.role], effort: effort ?? r.effort };
}

/** Image work: `final` for the asset a business will use, `fast` for concepts and variations. */
export type ImageTier = "final" | "fast";

export function imageModel(tier: ImageTier): string {
  return tier === "final" ? MODELS.image_final : MODELS.image_fast;
}

/** Reasoning models take reasoning.effort; anything else gets a temperature. */
export function supportsReasoning(model: string): boolean {
  return /^(gpt-[5-9]|o[1-9])/.test(model);
}

/** Aspect ratios TapMart asks for, and the closest canvas the image API renders. */
export type Aspect = "9:16" | "4:5" | "1:1" | "16:9" | "3:2";

export const IMAGE_SIZE: Record<Aspect, string> = {
  "9:16": env("OPENAI_IMAGE_SIZE_PORTRAIT") ?? "1024x1536",
  "4:5": env("OPENAI_IMAGE_SIZE_PORTRAIT") ?? "1024x1536",
  "1:1": "1024x1024",
  "16:9": env("OPENAI_IMAGE_SIZE_LANDSCAPE") ?? "1536x1024",
  "3:2": env("OPENAI_IMAGE_SIZE_LANDSCAPE") ?? "1536x1024",
};

/** The whole routing table, for docs, tests and the CLI's `models` command. */
export function routingTable(): { job: JobKind; role: ModelRole; model: string; effort: Effort }[] {
  return (Object.keys(ROUTES) as JobKind[]).map((job) => ({ job, ...route(job) }));
}

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}
