import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { AiSource, BriefStep, CampaignBrief } from "./types";
import type { TrendItem } from "@/lib/trends/types";
import {
  AI_REQUEST, aiModel, extractJsonObject, getAnthropic, imageBlockFor, isAiConfigured, isVideoMediaUrl, responseText,
} from "./client";

/**
 * The business-facing brief for a Recreate campaign. When Claude is
 * configured the brief is written from the reference (image references are
 * shown to the model; video references are described by URL). Otherwise a
 * deterministic template writes a sensible generic recreate brief from the
 * same inputs and the result is labelled `source: "template"`.
 *
 * Every number the model returns is clamped to the ranges the product
 * accepts so a wild suggestion never reaches the wizard.
 */

export type BriefInput = {
  businessName: string;
  category: string | null;
  city: string | null;
  referenceUrl?: string | null;
  referenceMediaUrl?: string | null;
  referenceTitle?: string | null;
  referenceNotes?: string | null;
  trend?: TrendItem | null;
};

/** Default pay when the settings table has no override, in cents. */
export const DEFAULT_PAY_CENTS = 7500;
export const DEFAULT_SLOTS = 8;
export const DEFAULT_DEADLINE_DAYS = 10;

export const LIMITS = {
  pay_cents: [500, 500_000] as const,
  slots: [1, 500] as const,
  deadline_days: [1, 90] as const,
  duration: [5, 180] as const,
  steps: [3, 10] as const,
};

const stepSchema = z.object({
  n: z.number().int().optional(),
  text: z.string().min(1).max(300),
  frame_hint: z.string().max(200).nullable().optional(),
});

const briefSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(1000),
  steps: z.array(stepSchema).min(1).max(12),
  must_keep: z.array(z.string().max(200)).max(12).default([]),
  can_change: z.array(z.string().max(200)).max(12).default([]),
  required_elements: z.array(z.string().max(200)).max(12).default([]),
  avoid: z.array(z.string().max(200)).max(12).default([]),
  spoken_lines: z.array(z.string().max(300)).max(8).default([]),
  duration_seconds: z.tuple([z.number(), z.number()]),
  orientation: z.enum(["vertical", "horizontal"]).default("vertical"),
  editing_style: z.string().max(300).default("Simple cuts, natural light"),
  pace: z.enum(["slow", "medium", "fast"]).default("medium"),
  location: z.string().max(200).default(""),
  suggested_pay_cents: z.number().default(DEFAULT_PAY_CENTS),
  suggested_slots: z.number().default(DEFAULT_SLOTS),
  deadline_days: z.number().default(DEFAULT_DEADLINE_DAYS),
});

/** Plain JSON schema for the API's structured output, mirroring briefSchema. */
const BRIEF_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title", "summary", "steps", "must_keep", "can_change", "required_elements", "avoid", "spoken_lines",
    "duration_seconds", "orientation", "editing_style", "pace", "location",
    "suggested_pay_cents", "suggested_slots", "deadline_days",
  ],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["n", "text", "frame_hint"],
        properties: { n: { type: "integer" }, text: { type: "string" }, frame_hint: { type: ["string", "null"] } },
      },
    },
    must_keep: { type: "array", items: { type: "string" } },
    can_change: { type: "array", items: { type: "string" } },
    required_elements: { type: "array", items: { type: "string" } },
    avoid: { type: "array", items: { type: "string" } },
    spoken_lines: { type: "array", items: { type: "string" } },
    duration_seconds: { type: "array", items: { type: "integer" }, minItems: 2, maxItems: 2 },
    orientation: { type: "string", enum: ["vertical", "horizontal"] },
    editing_style: { type: "string" },
    pace: { type: "string", enum: ["slow", "medium", "fast"] },
    location: { type: "string" },
    suggested_pay_cents: { type: "integer" },
    suggested_slots: { type: "integer" },
    deadline_days: { type: "integer" },
  },
} as const;

const clamp = (n: unknown, [min, max]: readonly [number, number], fallback: number) => {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.min(Math.max(v, min), max);
};

/** Strip dashes the product does not use in copy, and trim. */
function tidy(text: string): string {
  return text.replace(/\s*[\u2013\u2014]\s*/g, ", ").replace(/\s+/g, " ").trim();
}

function cleanList(items: string[], max = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const t = tidy(raw).slice(0, 200);
    if (!t || seen.has(t.toLowerCase())) continue;
    seen.add(t.toLowerCase());
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Validate and clamp anything shaped like a brief. Exported so the wizard's
 * edits pass through the same guard before a campaign stores them.
 */
export function normalizeBrief(raw: unknown, defaults: { payCents?: number } = {}): CampaignBrief | null {
  const parsed = briefSchema.safeParse(raw);
  if (!parsed.success) return null;
  const b = parsed.data;
  const pay = defaults.payCents ?? DEFAULT_PAY_CENTS;

  let [lo, hi] = b.duration_seconds;
  lo = clamp(lo, LIMITS.duration, 15);
  hi = clamp(hi, LIMITS.duration, 30);
  if (hi < lo) [lo, hi] = [hi, lo];
  if (hi === lo) hi = Math.min(lo + 10, LIMITS.duration[1]);

  const steps: BriefStep[] = b.steps
    .map((s) => ({ text: tidy(s.text).slice(0, 300), frame_hint: s.frame_hint ? tidy(s.frame_hint).slice(0, 200) : null }))
    .filter((s) => s.text.length > 0)
    .slice(0, LIMITS.steps[1])
    .map((s, i) => ({ n: i + 1, text: s.text, frame_hint: s.frame_hint }));
  if (steps.length < 1) return null;

  return {
    title: tidy(b.title).slice(0, 120),
    summary: tidy(b.summary).slice(0, 1000),
    steps,
    must_keep: cleanList(b.must_keep),
    can_change: cleanList(b.can_change),
    required_elements: cleanList(b.required_elements),
    avoid: cleanList(b.avoid),
    spoken_lines: cleanList(b.spoken_lines, 8),
    duration_seconds: [lo, hi],
    orientation: b.orientation,
    editing_style: tidy(b.editing_style).slice(0, 300) || "Simple cuts, natural light",
    pace: b.pace,
    location: tidy(b.location).slice(0, 200),
    suggested_pay_cents: clamp(b.suggested_pay_cents, LIMITS.pay_cents, pay),
    suggested_slots: clamp(b.suggested_slots, LIMITS.slots, DEFAULT_SLOTS),
    deadline_days: clamp(b.deadline_days, LIMITS.deadline_days, DEFAULT_DEADLINE_DAYS),
  };
}

// ---------------------------------------------------------------- template

/** A sensible generic recreate brief from the inputs alone. */
export function templateBrief(input: BriefInput, payCents = DEFAULT_PAY_CENTS): CampaignBrief {
  const name = input.businessName.trim() || "the business";
  const cat = (input.category ?? input.trend?.category ?? "local business").toLowerCase();
  const refTitle = input.referenceTitle?.trim() || input.trend?.title?.trim() || "";
  const where = input.city ? ` in ${input.city}` : "";
  const notes = input.referenceNotes?.trim() ?? "";
  const fit = input.trend?.fit_note?.trim() ?? "";
  const platform = input.trend?.platform && input.trend.platform !== "other" ? input.trend.platform : "the reference";

  const title = refTitle ? `Recreate: ${refTitle}`.slice(0, 120) : `Recreate our video at ${name}`.slice(0, 120);
  const summaryParts = [
    refTitle
      ? `Recreate "${refTitle}" at ${name}${where}: same structure and pace, your own take.`
      : `Recreate the reference video at ${name}${where}: same shots, same pace, your own take.`,
    `Casual phone footage is exactly right. Say ${name} once.`,
  ];
  if (fit) summaryParts.push(fit);
  if (notes) summaryParts.push(notes);

  const steps: BriefStep[] = [
    { n: 1, text: `Open on the outside or the entrance of ${name} so people know where you are.`, frame_hint: "The first second of the reference" },
    { n: 2, text: "Walk in while filming, one continuous move, phone held vertical.", frame_hint: "The entrance shot" },
    { n: 3, text: `Show the main thing: the product, the counter or the moment that makes a ${cat} worth a visit.`, frame_hint: "The middle of the reference" },
    { n: 4, text: "Get one close-up: hands, texture, the detail people stop for.", frame_hint: "The close-up beat" },
    { n: 5, text: `Say ${name} once, on camera or as a voiceover.`, frame_hint: null },
    { n: 6, text: `End on the ${name} sign, logo or storefront.`, frame_hint: "The last frame of the reference" },
  ];

  return normalizeBrief({
    title,
    summary: summaryParts.join(" "),
    steps,
    must_keep: ["The order of the shots", "Vertical framing", `${name} named once`, "The real place, filmed on the day"],
    can_change: ["Who is on camera", "Time of day", "Music and captions", "Exact wording"],
    required_elements: [`${name} visible at least once`, "The product or service on screen", "Filmed at the location"],
    avoid: ["Stock footage", "Other businesses' logos", "Long intros", "Text that covers the subject"],
    spoken_lines: [`This is ${name}${where}.`],
    duration_seconds: [15, 30],
    orientation: "vertical",
    editing_style: `Simple cuts, natural light, in the style of ${platform}`,
    pace: "medium",
    location: input.city ? `${name}, ${input.city}` : name,
    suggested_pay_cents: payCents,
    suggested_slots: DEFAULT_SLOTS,
    deadline_days: DEFAULT_DEADLINE_DAYS,
  }, { payCents })!;
}

// ---------------------------------------------------------------------- ai

const SYSTEM =
  "You write campaign briefs for TapMart, where local businesses pay ordinary people to recreate a short reference video " +
  "at the business. Write for a small business owner who will review and edit the brief, then for the person filming. " +
  "Plain words, short sentences, no emojis, no dashes in text (use commas or the word 'to'). " +
  "The brief describes what the reference does and how to recreate it at this business: 5 to 7 numbered steps, " +
  "each with a frame_hint naming what to look for in the reference at that moment (or null). " +
  "Keep duration_seconds between 15 and 30 unless the reference is clearly longer. Orientation is vertical for Reels, " +
  "TikToks and Shorts. suggested_pay_cents is per approved video in US cents, between 2500 and 15000. " +
  "suggested_slots is how many approved videos to buy, 3 to 20. deadline_days is 5 to 21. " +
  "Never invent view counts, statistics or facts about the business you were not given. " +
  "If the reference is a video URL you cannot open, work from its title, notes and the platform conventions, and say so in the summary.";

async function aiBrief(input: BriefInput, payCents: number): Promise<CampaignBrief | null> {
  const client = getAnthropic();
  const mediaUrl = input.referenceMediaUrl?.trim() || input.trend?.media_url || null;
  const content: Anthropic.ContentBlockParam[] = [];

  const image = mediaUrl ? await imageBlockFor(mediaUrl) : null;
  if (image) content.push(image);

  const lines = [
    `Business: ${input.businessName}`,
    `Category: ${input.category ?? input.trend?.category ?? "unknown"}`,
    `City: ${input.city ?? "unknown"}`,
    `Reference title: ${input.referenceTitle ?? input.trend?.title ?? "none"}`,
    `Reference link: ${input.referenceUrl ?? input.trend?.reference_url ?? "none"}`,
  ];
  if (image) lines.push("Reference image: attached above (a frame or thumbnail of the reference).");
  else if (mediaUrl && isVideoMediaUrl(mediaUrl)) lines.push(`Reference video URL (not opened): ${mediaUrl}`);
  else if (mediaUrl) lines.push(`Reference media URL: ${mediaUrl}`);
  if (input.trend?.growth_note) lines.push(`Trend note: ${input.trend.growth_note}`);
  if (input.trend?.fit_note) lines.push(`Why it fits: ${input.trend.fit_note}`);
  if (input.referenceNotes) lines.push(`Notes from the business: ${input.referenceNotes}`);
  lines.push(`Default pay per approved video: ${payCents} cents.`);
  content.push({ type: "text", text: lines.join("\n") });

  const message = await client.messages.create({
    model: aiModel(),
    max_tokens: 4000,
    ...AI_REQUEST,
    output_config: { ...AI_REQUEST.output_config, format: { type: "json_schema", schema: BRIEF_JSON_SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  if (message.stop_reason === "refusal") return null;
  const raw = extractJsonObject(responseText(message));
  return raw ? normalizeBrief(raw, { payCents }) : null;
}

/**
 * Generate a brief. Falls back to the template when there is no key, when
 * the model output does not validate, or when the request fails.
 */
export async function generateBrief(
  input: BriefInput,
  options: { payCents?: number } = {},
): Promise<{ brief: CampaignBrief; source: AiSource }> {
  const payCents = options.payCents ?? DEFAULT_PAY_CENTS;
  if (isAiConfigured()) {
    try {
      const brief = await aiBrief(input, payCents);
      if (brief) return { brief, source: "ai" };
    } catch (error) {
      console.error("generateBrief fell back to the template:", error);
    }
  }
  return { brief: templateBrief(input, payCents), source: "template" };
}
