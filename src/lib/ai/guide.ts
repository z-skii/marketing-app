import { z } from "zod";
import type { CampaignBrief, CreatorGuide, CreatorStep } from "./types";
import { AI_REQUEST, aiModel, extractJsonObject, getAnthropic, isAiConfigured, responseText } from "./client";

/**
 * The creator guide: what the person filming actually sees. It is derived
 * from the brief, never written from scratch, so it can only say what the
 * business approved. When Claude is configured the steps are rewritten into
 * short imperative sentences; otherwise they are shortened deterministically.
 */

export const MAX_STEP_WORDS = 9;

// ----------------------------------------------------------- deterministic

const LEADING_FILLER = /^(please|you should|you can|make sure to|make sure you|try to|start by|then|next|now|first|finally|also)\s+/i;

/** Shorten one brief step into an imperative line of at most MAX_STEP_WORDS words. */
export function shortenStep(text: string, maxWords = MAX_STEP_WORDS): string {
  let t = text.replace(/\s*[\u2013\u2014]\s*/g, ", ").replace(/\s+/g, " ").trim();
  // Keep the first clause: sentences and comma-led asides go.
  t = t.split(/[.!?]/)[0].trim();
  for (let guard = 0; guard < 4 && LEADING_FILLER.test(t); guard++) t = t.replace(LEADING_FILLER, "");
  const clauses = t.split(/,|;|:| so that | so | because | while /i).map((c) => c.trim()).filter(Boolean);
  let line = clauses[0] ?? t;
  if (line.split(" ").length < 3 && clauses[1]) line = `${line}, ${clauses[1]}`;
  const words = line.split(" ").filter(Boolean);
  if (words.length > maxWords) line = words.slice(0, maxWords).join(" ");
  line = line.replace(/[,\s]+$/, "");
  if (!line) line = "Follow the reference";
  line = line[0].toUpperCase() + line.slice(1);
  return /[.!?]$/.test(line) ? line : `${line}.`;
}

/** Timing labels: spread the steps evenly across the duration range. */
function timingFor(index: number, count: number, [lo, hi]: [number, number]): string {
  const total = Math.max(hi, lo, 1);
  const start = Math.round((index / count) * total);
  const end = Math.round(((index + 1) / count) * total);
  return `${start} to ${end} s`;
}

function assemble(
  brief: CampaignBrief,
  stepTexts: string[],
  source: CreatorGuide["source"],
  frames?: string[],
): CreatorGuide {
  const steps: CreatorStep[] = stepTexts.map((text, i) => ({
    n: i + 1,
    text,
    frame_url: frames?.[i] ?? null,
    timing: timingFor(i, stepTexts.length, brief.duration_seconds),
  }));
  const rules = dedupe([...brief.must_keep, ...brief.spoken_lines.map((l) => `Say: "${l}"`)]);
  const checklist = dedupe([
    ...brief.required_elements,
    `${brief.duration_seconds[0]} to ${brief.duration_seconds[1]} seconds`,
    brief.orientation === "vertical" ? "Vertical 9:16" : "Horizontal 16:9",
  ]);
  return {
    steps,
    duration_seconds: brief.duration_seconds,
    orientation: brief.orientation,
    rules,
    avoid: dedupe(brief.avoid),
    checklist,
    source,
  };
}

function dedupe(items: string[], max = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const t = raw.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

/** Deterministic guide from a brief. */
export function templateGuide(brief: CampaignBrief, frames?: string[]): CreatorGuide {
  return assemble(brief, brief.steps.map((s) => shortenStep(s.text)), "template", frames);
}

// ---------------------------------------------------------------------- ai

const stepsSchema = z.object({ steps: z.array(z.string().min(1).max(120)).min(1).max(12) });

const STEPS_JSON_SCHEMA = {
  type: "object", additionalProperties: false, required: ["steps"],
  properties: { steps: { type: "array", items: { type: "string" } } },
} as const;

async function aiSteps(brief: CampaignBrief): Promise<string[] | null> {
  const client = getAnthropic();
  const message = await client.messages.create({
    model: aiModel(),
    max_tokens: 1500,
    ...AI_REQUEST,
    output_config: { ...AI_REQUEST.output_config, format: { type: "json_schema", schema: STEPS_JSON_SCHEMA } },
    system:
      "Rewrite campaign brief steps as instructions for the person filming on their phone. " +
      `One short imperative sentence per step, at most ${MAX_STEP_WORDS} words, same order, same count, same meaning. ` +
      "Plain words, no emojis, no dashes. Return JSON: {\"steps\": string[]}.",
    messages: [{
      role: "user",
      content: brief.steps.map((s) => `${s.n}. ${s.text}`).join("\n"),
    }],
  });
  if (message.stop_reason === "refusal") return null;
  const parsed = stepsSchema.safeParse(extractJsonObject(responseText(message)));
  if (!parsed.success || parsed.data.steps.length !== brief.steps.length) return null;
  // The word cap is enforced here too; the model is asked, the code guarantees.
  return parsed.data.steps.map((s) => shortenStep(s));
}

/**
 * Build the guide stored on the campaign. `referenceFrameUrls` attaches a
 * frame or thumbnail to each step by index when present.
 */
export async function buildCreatorGuide(
  brief: CampaignBrief,
  opts: { referenceFrameUrls?: string[] } = {},
): Promise<{ guide: CreatorGuide }> {
  const frames = opts.referenceFrameUrls?.filter((u) => typeof u === "string" && u.length > 0);
  if (isAiConfigured()) {
    try {
      const steps = await aiSteps(brief);
      if (steps) return { guide: assemble(brief, steps, "ai", frames) };
    } catch (error) {
      console.error("buildCreatorGuide fell back to the template:", error);
    }
  }
  return { guide: templateGuide(brief, frames) };
}

// -------------------------------------------------------------- from a row

const guideSchema = z.object({
  steps: z.array(z.object({
    n: z.number().optional(),
    text: z.string().min(1),
    frame_url: z.string().nullable().optional(),
    timing: z.string().nullable().optional(),
  })).min(1),
  duration_seconds: z.tuple([z.number(), z.number()]),
  orientation: z.enum(["vertical", "horizontal"]),
  rules: z.array(z.string()).default([]),
  avoid: z.array(z.string()).default([]),
  checklist: z.array(z.string()).default([]),
  source: z.enum(["ai", "template"]).default("template"),
});

const DURATION_RE = /(\d+)\s*(?:to|-|\u2013|\u2014)\s*(\d+)\s*(?:s|sec|secs|seconds)\b/i;

/**
 * Pure: the guide stored on a campaign, or one derived from its requirements
 * for campaigns created before guides existed. Never touches the network.
 */
export function guideFromCampaign(details: Record<string, unknown>, requirements: string[]): CreatorGuide {
  const stored = guideSchema.safeParse(details.guide);
  if (stored.success) {
    const g = stored.data;
    return {
      steps: g.steps.map((s, i) => ({ n: i + 1, text: s.text, frame_url: s.frame_url ?? null, timing: s.timing ?? null })),
      duration_seconds: g.duration_seconds,
      orientation: g.orientation,
      rules: g.rules,
      avoid: g.avoid,
      checklist: g.checklist,
      source: g.source,
    };
  }

  const reqs = (requirements ?? []).map((r) => r.trim()).filter(Boolean);
  const range = details.duration_seconds;
  let duration: [number, number] | null =
    Array.isArray(range) && range.length === 2 && range.every((n) => typeof n === "number" && Number.isFinite(n))
      ? [Math.round(range[0] as number), Math.round(range[1] as number)] : null;
  let orientation: CreatorGuide["orientation"] = "vertical";
  const steps: string[] = [];
  for (const r of reqs) {
    const m = r.match(DURATION_RE);
    if (m) { if (!duration) duration = [Number(m[1]), Number(m[2])]; continue; }
    if (/vertical|9:16/i.test(r)) { orientation = "vertical"; continue; }
    if (/horizontal|landscape|16:9/i.test(r)) { orientation = "horizontal"; continue; }
    steps.push(shortenStep(r));
  }
  if (duration && duration[1] < duration[0]) duration = [duration[1], duration[0]];
  const finalDuration: [number, number] = duration ?? [15, 30];
  const stepTexts = steps.length > 0 ? steps : ["Watch the reference twice.", "Recreate it shot for shot.", "Show the business clearly."];

  return {
    steps: stepTexts.map((text, i) => ({ n: i + 1, text, frame_url: null, timing: timingFor(i, stepTexts.length, finalDuration) })),
    duration_seconds: finalDuration,
    orientation,
    rules: reqs,
    avoid: [],
    checklist: dedupe([
      ...reqs,
      `${finalDuration[0]} to ${finalDuration[1]} seconds`,
      orientation === "vertical" ? "Vertical 9:16" : "Horizontal 16:9",
    ]),
    source: "template",
  };
}
