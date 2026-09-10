import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { CheckItem, CheckStatus, ClientMediaMeta, SubmissionCheck } from "./types";
import { guideFromCampaign } from "./guide";
import { AI_REQUEST, aiModel, extractJsonObject, getAnthropic, imageBlockFor, isAiConfigured, responseText } from "./client";

/**
 * The advisory pre-submission check. Deterministic items come from what the
 * browser could read off the file (duration, dimensions); AI items come from
 * the model looking at a few captured frames. Nothing here approves or pays:
 * the business decides. A thing that was not checked is `unknown`, never
 * `pass`.
 */

export type CheckInput = {
  campaign: {
    kind: string;
    details: Record<string, unknown>;
    requirements: string[];
    title: string;
    business_name: string;
  };
  mediaUrl: string;
  clientMeta: ClientMediaMeta | null;
};

const MAX_FRAMES = 6;

// ----------------------------------------------------------- deterministic

function deterministicItems(input: CheckInput, guide: ReturnType<typeof guideFromCampaign>): CheckItem[] {
  const meta = input.clientMeta;
  const [lo, hi] = guide.duration_seconds;
  const items: CheckItem[] = [];

  items.push({
    key: "file",
    label: "Video uploaded",
    status: input.mediaUrl.trim() ? "pass" : "fail",
    note: input.mediaUrl.trim() ? null : "No file was uploaded.",
  });

  const d = meta?.durationSeconds;
  if (typeof d === "number" && Number.isFinite(d) && d > 0) {
    const rounded = Math.round(d * 10) / 10;
    if (d >= lo && d <= hi) {
      items.push({ key: "duration", label: `${lo} to ${hi} seconds`, status: "pass", note: `${rounded} s` });
    } else if (d < lo * 0.8 || d > hi * 1.25) {
      items.push({ key: "duration", label: `${lo} to ${hi} seconds`, status: "fail", note: `${rounded} s, the campaign asks for ${lo} to ${hi} s.` });
    } else {
      items.push({ key: "duration", label: `${lo} to ${hi} seconds`, status: "warn", note: `${rounded} s, slightly outside ${lo} to ${hi} s.` });
    }
  } else {
    items.push({ key: "duration", label: `${lo} to ${hi} seconds`, status: "unknown", note: "Could not read the length before upload." });
  }

  const w = meta?.width;
  const h = meta?.height;
  const wantVertical = guide.orientation === "vertical";
  const label = wantVertical ? "Vertical 9:16" : "Horizontal 16:9";
  if (typeof w === "number" && typeof h === "number" && w > 0 && h > 0) {
    const isVertical = h > w;
    const ok = wantVertical ? isVertical : !isVertical;
    items.push({
      key: "orientation",
      label,
      status: ok ? "pass" : "fail",
      note: `${w} by ${h}${ok ? "" : wantVertical ? ", this video is horizontal." : ", this video is vertical."}`,
    });
  } else {
    items.push({ key: "orientation", label, status: "unknown", note: "Could not read the dimensions before upload." });
  }

  return items;
}

// ---------------------------------------------------------------------- ai

const aiResultSchema = z.object({
  items: z.array(z.object({
    key: z.string().min(1).max(80),
    status: z.enum(["pass", "warn", "fail", "unknown"]),
    note: z.string().max(300).nullable().optional(),
  })),
});

const AI_JSON_SCHEMA = {
  type: "object", additionalProperties: false, required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object", additionalProperties: false, required: ["key", "status", "note"],
        properties: {
          key: { type: "string" },
          status: { type: "string", enum: ["pass", "warn", "fail", "unknown"] },
          note: { type: ["string", "null"] },
        },
      },
    },
  },
} as const;

function aiChecklist(input: CheckInput, guide: ReturnType<typeof guideFromCampaign>): { key: string; label: string }[] {
  const brief = input.campaign.details.brief as { required_elements?: unknown } | undefined;
  const required = Array.isArray(brief?.required_elements)
    ? (brief!.required_elements as unknown[]).filter((r): r is string => typeof r === "string") : [];
  const seen = new Set<string>();
  const out: { key: string; label: string }[] = [];
  let i = 0;
  for (const label of [...required, ...guide.checklist]) {
    const t = label.trim();
    if (!t || seen.has(t.toLowerCase())) continue;
    // Duration and orientation are measured, not judged from frames.
    if (/\d+\s*(?:to|-)\s*\d+\s*(?:s|sec|seconds)\b/i.test(t) || /vertical|horizontal|9:16|16:9/i.test(t)) continue;
    seen.add(t.toLowerCase());
    out.push({ key: `req_${i++}`, label: t });
    if (out.length >= 12) break;
  }
  return out;
}

async function aiItems(input: CheckInput, checklist: { key: string; label: string }[], frames: string[]): Promise<CheckItem[] | null> {
  const client = getAnthropic();
  const content: Anthropic.ContentBlockParam[] = [];
  for (const frame of frames.slice(0, MAX_FRAMES)) {
    const block = await imageBlockFor(frame);
    if (block) content.push(block);
  }
  if (content.length === 0) return null;
  content.push({
    type: "text",
    text:
      `These are ${content.length} frames from a video someone made for "${input.campaign.title}" by ${input.campaign.business_name}.\n` +
      "For each requirement below say pass, warn or fail with a note of at most 20 words. " +
      "Use unknown when the frames cannot show it (sound, spoken words, anything outside the frames). " +
      "Never guess: unknown is better than a wrong pass.\n\n" +
      checklist.map((c) => `${c.key}: ${c.label}`).join("\n"),
  });

  const message = await client.messages.create({
    model: aiModel(),
    max_tokens: 2000,
    ...AI_REQUEST,
    output_config: { ...AI_REQUEST.output_config, format: { type: "json_schema", schema: AI_JSON_SCHEMA } },
    system:
      "You review a few frames of a short video against a small checklist for a local business marketing campaign. " +
      "You are advisory only, the business makes the decision. Be literal and careful. Plain words, no dashes, no emojis. " +
      "Return JSON: {\"items\": [{\"key\", \"status\": \"pass\"|\"warn\"|\"fail\"|\"unknown\", \"note\"}]}.",
    messages: [{ role: "user", content }],
  });
  if (message.stop_reason === "refusal") return null;
  const parsed = aiResultSchema.safeParse(extractJsonObject(responseText(message)));
  if (!parsed.success) return null;

  const byKey = new Map(parsed.data.items.map((i) => [i.key, i]));
  return checklist.map((c) => {
    const r = byKey.get(c.key);
    return {
      key: c.key,
      label: c.label,
      status: (r?.status ?? "unknown") as CheckStatus,
      note: r?.note?.replace(/\s*[\u2013\u2014]\s*/g, ", ").trim() || null,
    };
  });
}

// ------------------------------------------------------------------ public

function summarize(items: CheckItem[], checkedBy: SubmissionCheck["checked_by"]): string {
  const fails = items.filter((i) => i.status === "fail").length;
  const warns = items.filter((i) => i.status === "warn").length;
  const unknown = items.filter((i) => i.status === "unknown").length;
  if (checkedBy === "none") return "Nothing could be checked before upload. The business will review it.";
  const parts: string[] = [];
  if (fails > 0) parts.push(`${fails} thing${fails === 1 ? "" : "s"} to fix`);
  if (warns > 0) parts.push(`${warns} to double check`);
  if (unknown > 0) parts.push(`${unknown} not checked`);
  if (parts.length === 0) return checkedBy === "ai" ? "Looks ready. The business makes the final call." : "Length and format look right. The business reviews the rest.";
  return `${parts.join(", ")}. The business makes the final call.`;
}

export async function checkSubmission(input: CheckInput): Promise<SubmissionCheck> {
  const guide = guideFromCampaign(input.campaign.details, input.campaign.requirements);
  const items = deterministicItems(input, guide);

  const frames = (input.clientMeta?.frames ?? []).filter((f) => typeof f === "string" && f.startsWith("data:image/"));
  let checkedBy: SubmissionCheck["checked_by"] = "none";

  // The browser measured something real only when a number came through.
  const measured = items.some((i) => (i.key === "duration" || i.key === "orientation") && i.status !== "unknown");
  if (measured) checkedBy = "client";

  const checklist = aiChecklist(input, guide);
  if (isAiConfigured() && frames.length > 0 && checklist.length > 0) {
    try {
      const ai = await aiItems(input, checklist, frames);
      if (ai) {
        items.push(...ai);
        checkedBy = "ai";
      } else {
        items.push(...checklist.map((c) => ({ key: c.key, label: c.label, status: "unknown" as const, note: "Not reviewed." })));
      }
    } catch (error) {
      console.error("checkSubmission AI items skipped:", error);
      items.push(...checklist.map((c) => ({ key: c.key, label: c.label, status: "unknown" as const, note: "Not reviewed." })));
    }
  } else {
    items.push(...checklist.map((c) => ({ key: c.key, label: c.label, status: "unknown" as const, note: "Checked by the business." })));
  }

  return {
    items,
    summary: summarize(items, checkedBy),
    checked_by: checkedBy,
    checked_at: new Date().toISOString(),
  };
}
