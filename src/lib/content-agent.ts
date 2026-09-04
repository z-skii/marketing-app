import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { sql, sqlOne } from "./db";
import { brandPromptBlock, SITE } from "./brand-kit";
import { parseAdParams, renderAd, type AdParams } from "./ad-render";
import { uploadAdPng } from "./agent-storage";

/**
 * The content generation agent. One run asks Claude for a full batch (5
 * Threads posts + 2 story ads by default), renders the ads to finished
 * PNGs, and files everything into content_queue as drafts for review at
 * /admin/content. Every run is logged to agent_runs with token cost.
 *
 * Without ANTHROPIC_API_KEY the run falls back to a small deterministic
 * sample batch (marked as such in the run log) so the pipeline can be
 * exercised end to end before the key exists.
 */

const MODEL = "claude-sonnet-4-6";
// Anthropic pricing for claude-sonnet-4-6, USD per million tokens.
const PRICE_IN = 3;
const PRICE_OUT = 15;

export type GeneratedItem = {
  platform: "threads" | "instagram";
  format: "post" | "caption" | "story_ad" | "feed_ad";
  copy: string;
  ad_params?: AdParams;
  hashtags?: string[];
};

export type GenerationResult = {
  runId: string;
  created: number;
  mode: "claude" | "sample";
  costUsd: number;
};

const BATCH_SPEC = "5 Threads posts and 2 story ads";

function systemPrompt(): string {
  return [
    "You are the content marketing agent for TapMart. You write social posts and ad copy.",
    "",
    brandPromptBlock(),
    "",
    "PLATFORM RULES:",
    "- threads/post: max 480 chars. lowercase-casual. conversational, punchy, specific. at most 1 hashtag, usually none.",
    "- instagram/story_ad: you produce ad_params for a rendered graphic PLUS a one-line copy field used as the caption.",
    "  ad_params: { template: 'ink'|'paper'|'signal', format: 'story', eyebrow: <=40 chars, headline: <=70 chars, sub: <=140 chars (optional), cta: <=24 chars }",
    "  Headlines are set in huge uppercase display type: write them short and hard-hitting. No emojis anywhere in ads.",
    "- instagram/caption: max 2200 chars, casual, hashtags array with 3-8 relevant tags (no # prefix).",
    "",
    "OUTPUT CONTRACT: Return ONLY a JSON array, no prose, no code fences. Each element:",
    `{ "platform": "threads"|"instagram", "format": "post"|"caption"|"story_ad"|"feed_ad", "copy": string, "ad_params"?: {...}, "hashtags"?: string[] }`,
    "",
    "Vary angles across the batch: how the board works, the Spot countdown, sharers earning on opens, the live-right-now energy. Never repeat a headline.",
  ].join("\n");
}

/** Deterministic on-brand fallback so the pipeline works before the key does. */
function sampleBatch(): GeneratedItem[] {
  return [
    { platform: "threads", format: "post", copy: "your link, a live board, and everyone watching what gets clicked. post it, back it, climb. tapmart.live" },
    { platform: "threads", format: "post", copy: "the spot rotates every minute. one link, sixty seconds, everybody sees it. take a minute → tapmart.live" },
    { platform: "threads", format: "post", copy: "views pay nothing here. when someone you sent actually opens a live link — that's when you earn. tapmart.live" },
    { platform: "threads", format: "post", copy: "no algorithm to please. the board ranks links by credit added today. simple, public, live. tapmart.live" },
    { platform: "threads", format: "post", copy: "posted a link at breakfast, watched it climb the board by lunch. what's getting clicked right now? tapmart.live" },
    {
      platform: "instagram", format: "story_ad",
      copy: "one slot. sixty seconds. yours. tapmart.live",
      ad_params: { template: "ink", format: "story", eyebrow: "the spot", headline: "one slot. sixty seconds. yours.", sub: "the top slot rotates on a countdown.", cta: "take it" },
    },
    {
      platform: "instagram", format: "story_ad",
      copy: "post your link. climb the board. get clicked. tapmart.live",
      ad_params: { template: "signal", format: "story", eyebrow: "live now", headline: "climb the board.", sub: "post your link, add credit, watch it rise.", cta: "put yours up" },
    },
  ];
}

function parseModelJson(text: string): unknown[] {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("model did not return a JSON array");
  return JSON.parse(cleaned.slice(start, end + 1)) as unknown[];
}

function validateItem(raw: unknown): GeneratedItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const platform = r.platform === "threads" || r.platform === "instagram" ? r.platform : null;
  const format =
    r.format === "post" || r.format === "caption" || r.format === "story_ad" || r.format === "feed_ad"
      ? r.format
      : null;
  const copy = typeof r.copy === "string" ? r.copy.trim() : "";
  if (!platform || !format || !copy || copy.length > 2200) return null;

  const item: GeneratedItem = { platform, format, copy };
  if (format === "story_ad" || format === "feed_ad") {
    const params = parseAdParams((r.ad_params ?? {}) as Record<string, unknown>);
    if ("error" in params) return null;
    if (format === "story_ad") params.format = "story";
    if (format === "feed_ad") params.format = "feed";
    item.ad_params = params;
  }
  if (Array.isArray(r.hashtags)) {
    item.hashtags = r.hashtags.filter((h): h is string => typeof h === "string").slice(0, 8);
  }
  return item;
}

/** The fallback asset URL: the admin-authenticated render endpoint. */
function renderUrlFor(params: AdParams): string {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null) as [string, string][],
  );
  return `/api/agents/render-ad?${q.toString()}`;
}

export async function runGeneration(): Promise<GenerationResult> {
  const started = await sqlOne<{ id: string }>(
    `insert into agent_runs (agent, model) values ('content', $1) returning id`,
    [MODEL],
  );
  const runId = started!.id;

  try {
    let items: GeneratedItem[];
    let mode: "claude" | "sample";
    let inputTokens = 0;
    let outputTokens = 0;

    if (process.env.ANTHROPIC_API_KEY) {
      const client = new Anthropic();
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt(),
        messages: [
          {
            role: "user",
            content: `Generate ${BATCH_SPEC} for ${SITE.url}. Remember: JSON array only.`,
          },
        ],
      });
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      inputTokens = response.usage.input_tokens;
      outputTokens = response.usage.output_tokens;
      items = parseModelJson(text)
        .map(validateItem)
        .filter((i): i is GeneratedItem => i !== null);
      mode = "claude";
      if (items.length === 0) throw new Error("no valid items in model output");
    } else {
      items = sampleBatch();
      mode = "sample";
    }

    // Render each ad to a finished PNG; store it, or fall back to the
    // render endpoint URL so review still shows the exact image.
    let created = 0;
    for (const item of items) {
      let assetUrl: string | null = null;
      if (item.ad_params) {
        const png = await (await renderAd(item.ad_params)).arrayBuffer();
        try {
          assetUrl = await uploadAdPng(png);
        } catch (error) {
          console.error("ad upload failed, using render URL:", error);
        }
        assetUrl ??= renderUrlFor(item.ad_params);
      }
      await sql(
        `insert into content_queue (run_id, platform, format, copy, asset_url, ad_params, hashtags)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          runId, item.platform, item.format, item.copy, assetUrl,
          item.ad_params ? JSON.stringify(item.ad_params) : null,
          item.hashtags ?? null,
        ],
      );
      created++;
    }

    const costUsd = (inputTokens * PRICE_IN + outputTokens * PRICE_OUT) / 1_000_000;
    await sql(
      `update agent_runs
          set finished_at = now(), input_tokens = $2, output_tokens = $3,
              cost_usd = $4, output_count = $5,
              summary = $6
        where id = $1`,
      [
        runId, inputTokens, outputTokens, costUsd, created,
        mode === "claude"
          ? `generated ${created} drafts (${BATCH_SPEC})`
          : `generated ${created} SAMPLE drafts — ANTHROPIC_API_KEY not set`,
      ],
    );
    return { runId, created, mode, costUsd };
  } catch (error) {
    await sql(`update agent_runs set finished_at = now(), error = $2 where id = $1`, [
      runId, error instanceof Error ? error.message : String(error),
    ]);
    throw error;
  }
}
