import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { sql, sqlOne } from "./db";
import { brandPromptBlock, SITE } from "./brand-kit";
import { parseAdParams, renderAd, type AdParams } from "./ad-render";
import { uploadAdPng } from "./agent-storage";

/**
 * The content generation agent. One run asks Claude for a full cross-platform
 * batch — Threads, Instagram (story + feed), Facebook, and a TikTok carousel —
 * renders every image, and files it all into content_queue as drafts for
 * review at /admin/content. EVERY item carries at least one rendered image;
 * carousels carry a slide per image. Runs log to agent_runs with token cost.
 *
 * Without ANTHROPIC_API_KEY the run falls back to a deterministic sample
 * batch (marked as such in the run log) so the pipeline still works end to
 * end before the key exists.
 */

const MODEL = "claude-sonnet-4-6";
// Anthropic pricing for claude-sonnet-4-6, USD per million tokens.
const PRICE_IN = 3;
const PRICE_OUT = 15;

export type GeneratedItem = {
  platform: "threads" | "instagram" | "facebook" | "tiktok";
  format: "post" | "caption" | "story_ad" | "feed_ad" | "carousel" | "video";
  copy: string;
  ad_params?: AdParams;
  slides?: AdParams[];
  script?: string;
  hashtags?: string[];
};

export type GenerationResult = {
  runId: string;
  created: number;
  mode: "claude" | "sample";
  costUsd: number;
};

/**
 * Posting strategy by phase. Launch: the app is new — post heavy, teach
 * people what it is. Steady (after ~20 published posts): fewer posts, aimed
 * at updates, momentum, and pulling customers in.
 */
export type Phase = "launch" | "steady";
const LAUNCH_AFTER_PUBLISHED = 20;

const BATCH_SPECS: Record<Phase, string> = {
  launch:
    "3 Threads posts (each with a square image), 1 Instagram story ad, " +
    "1 Instagram feed post (feed image + caption + hashtags), 1 Instagram carousel " +
    "(3 feed slides + caption + hashtags), 1 Facebook post (square image), " +
    "1 TikTok photo carousel (3 story slides + caption + hashtags), " +
    "1 TikTok explainer video (5 story slides + a ~30 second voiceover script)",
  steady:
    "2 Threads posts (each with a square image), 1 Instagram feed post " +
    "(feed image + caption + hashtags), 1 Facebook post (square image), " +
    "1 TikTok explainer video (4 story slides + a short voiceover script)",
};

const PHASE_NOTES: Record<Phase, string> = {
  launch:
    "PHASE: LAUNCH. TapMart is brand new — most people seeing these posts have never heard of it. " +
    "Weight the batch toward explaining what it is and how the mechanics work, from first principles, with launch energy.",
  steady:
    "PHASE: STEADY. The audience knows what TapMart is. Weight toward what's live right now, momentum, " +
    "and reasons to come put a link up today. Don't re-explain the basics from zero.",
};

function systemPrompt(phase: Phase): string {
  return [
    "You are the content marketing agent for TapMart. You write social posts and design ad graphics.",
    "",
    PHASE_NOTES[phase],
    "",
    brandPromptBlock(),
    "",
    "IMAGES: every single item MUST include a rendered graphic — ad_params for single-image items, slides (an array of ad_params) for carousels and videos. Text-only content is not accepted.",
    "ad_params: { template: 'ink'|'paper'|'signal'|'phone'|'browser', format: 'story'|'feed'|'square', eyebrow: <=40 chars, headline: <=70 chars, sub: <=140 chars (optional, ignored by phone/browser), cta: <=24 chars }",
    "TEMPLATES — mix them for variety, never use one more than twice per batch:",
    "- 'phone': a REAL screenshot of the live site inside a tilted phone. The most eye-catching — use for at least one item per batch.",
    "- 'browser': the real desktop site inside a browser window. Use for at least one item per batch.",
    "- 'ink' (dark), 'paper' (light), 'signal' (full orange): big-type poster looks for pure statements.",
    "Headlines are set in huge uppercase display type: short and hard-hitting. No emojis in graphics.",
    "",
    "PLATFORM RULES:",
    "- threads/post: copy max 480 chars, lowercase-casual, at most 1 hashtag (usually none). ad_params with format 'square'.",
    "- instagram/story_ad: ad_params with format 'story'; copy is the one-line caption.",
    "- instagram/feed_ad: ad_params with format 'feed'; copy is the caption (max 2200 chars), hashtags 3-8 tags (no # prefix).",
    "- instagram/carousel: slides = 3 ad_params all with format 'feed', telling one story across slides (hook → how it works → CTA); copy is the caption; hashtags 3-8.",
    "- facebook/post: ad_params with format 'square'; copy can run a bit longer than Threads, still direct, no corporate filler.",
    "- tiktok/carousel: slides = 3 ad_params all with format 'story' (photo-mode slideshow, hook → mechanics → CTA); copy is the caption, hashtags 3-6.",
    "- tiktok/video (or instagram/video): an explainer video storyboard. slides = 4-6 ad_params with format 'story' that walk the viewer through it (hook → what it is → how it works → the payoff → CTA), plus script: a 25-40 second voiceover in the brand voice, one short sentence per slide, spoken casually. copy is the caption; hashtags 3-6.",
    "",
    "OUTPUT CONTRACT: Return ONLY a JSON array, no prose, no code fences. Each element:",
    `{ "platform": "threads"|"instagram"|"facebook"|"tiktok", "format": "post"|"caption"|"story_ad"|"feed_ad"|"carousel"|"video", "copy": string, "ad_params"?: {...}, "slides"?: [{...}], "script"?: string, "hashtags"?: string[] }`,
    "",
    "Vary angles across the batch: how the board works, the Spot countdown, sharers earning on opens, the live-right-now energy. Never repeat a headline.",
  ].join("\n");
}

/** Deterministic on-brand fallback so the pipeline works before the key does. */
function sampleBatch(): GeneratedItem[] {
  const sq = (template: AdParams["template"], eyebrow: string, headline: string, sub: string | undefined, cta: string): AdParams =>
    ({ template, format: "square", eyebrow, headline, sub, cta });
  const feed = (template: AdParams["template"], eyebrow: string, headline: string, sub: string | undefined, cta: string): AdParams =>
    ({ template, format: "feed", eyebrow, headline, sub, cta });
  const story = (template: AdParams["template"], eyebrow: string, headline: string, sub: string | undefined, cta: string): AdParams =>
    ({ template, format: "story", eyebrow, headline, sub, cta });

  return [
    {
      platform: "threads", format: "post",
      copy: "your link, a live board, and everyone watching what gets clicked. post it, back it, climb. tapmart.live",
      ad_params: sq("phone", "live right now", "your link. on the board.", undefined, "put it up"),
    },
    {
      platform: "threads", format: "post",
      copy: "the spot rotates every minute. one link, sixty seconds, everybody sees it. take a minute → tapmart.live",
      ad_params: sq("signal", "the spot", "sixty seconds of everyone.", "one link at a time, on a countdown.", "take it"),
    },
    {
      platform: "threads", format: "post",
      copy: "views pay nothing here. when someone you sent actually opens a live link — that's when you earn. tapmart.live",
      ad_params: sq("paper", "sharers", "opens pay. views don't.", "send people. earn when they open.", "start sharing"),
    },
    {
      platform: "instagram", format: "story_ad",
      copy: "one slot. sixty seconds. yours. tapmart.live",
      ad_params: story("ink", "the spot", "one slot. sixty seconds. yours.", "the top slot rotates on a countdown.", "take it"),
    },
    {
      platform: "instagram", format: "feed_ad",
      copy: "a live board of links, ranked by what people back today. post yours, add credit, watch it climb. what's getting clicked right now? tapmart.live",
      ad_params: feed("signal", "live now", "climb the board.", "post your link, add credit, watch it rise.", "put yours up"),
      hashtags: ["tapmart", "links", "creators", "traffic", "marketing"],
    },
    {
      platform: "instagram", format: "carousel",
      copy: "how tapmart works, in three slides. tapmart.live",
      slides: [
        feed("ink", "step one", "post your link.", "anyone can put a link up. it goes live.", "start"),
        feed("paper", "step two", "back it. climb.", "the board ranks links by credit added today.", "climb"),
        feed("signal", "step three", "get clicked.", "top of the board is where the taps are.", "put yours up"),
      ],
      hashtags: ["tapmart", "howitworks", "links", "creators"],
    },
    {
      platform: "facebook", format: "post",
      copy: "TapMart is a live board of links. Post yours, back it with credit, and climb — the top of the board is what everyone sees and clicks. Sharers earn when someone they sent opens a live link. See what's getting clicked right now at tapmart.live",
      ad_params: sq("browser", "the board", "what's getting clicked?", undefined, "see the board"),
    },
    {
      platform: "tiktok", format: "video",
      copy: "what is tapmart? 30 seconds. tapmart.live",
      script:
        "ever seen a website where links fight for the top spot? this is tapmart. " +
        "you post a link — any link — and it goes live on a public board. " +
        "back it with credit and it climbs. top of the board is what everyone sees. " +
        "and if you share links, you earn when someone you sent actually opens one. views pay nothing. " +
        "tapmart dot live. go watch the board move.",
      slides: [
        story("phone", "tapmart", "links fight for #1 here.", undefined, "watch"),
        story("ink", "step one", "post any link.", "it goes live on a public board.", "start"),
        story("paper", "step two", "back it. it climbs.", "the board ranks by credit added today.", "climb"),
        story("signal", "step three", "top = seen + clicked.", "the spot rotates every sixty seconds.", "take it"),
        story("browser", "get paid", "opens pay. views don't.", undefined, "tapmart.live"),
      ],
      hashtags: ["tapmart", "howitworks", "sidehustle", "fyp"],
    },
    {
      platform: "tiktok", format: "carousel",
      copy: "a website where your link fights for the top slot. tapmart.live",
      slides: [
        story("signal", "tapmart", "your link fights for #1.", "a live board, ranked by backing.", "watch"),
        story("ink", "the spot", "sixty seconds of fame.", "the top slot rotates on a countdown.", "take it"),
        story("paper", "get paid", "opens pay. views don't.", "share links. earn when people open.", "start"),
      ],
      hashtags: ["tapmart", "sidehustle", "links", "fyp"],
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

const PLATFORMS = ["threads", "instagram", "facebook", "tiktok"] as const;
const FORMATS = ["post", "caption", "story_ad", "feed_ad", "carousel", "video"] as const;

function validateItem(raw: unknown): GeneratedItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const platform = PLATFORMS.find((p) => p === r.platform);
  const format = FORMATS.find((f) => f === r.format);
  const copy = typeof r.copy === "string" ? r.copy.trim() : "";
  if (!platform || !format || !copy || copy.length > 2200) return null;

  const item: GeneratedItem = { platform, format, copy };

  if (format === "carousel" || format === "video") {
    if (!Array.isArray(r.slides)) return null;
    const slides: AdParams[] = [];
    for (const slide of r.slides.slice(0, 6)) {
      const params = parseAdParams((slide ?? {}) as Record<string, unknown>);
      if ("error" in params) return null;
      params.format = format === "video" || platform === "tiktok" ? "story" : "feed";
      slides.push(params);
    }
    if (slides.length < 2) return null;
    item.slides = slides;
    if (format === "video" && typeof r.script === "string" && r.script.trim()) {
      item.script = r.script.trim().slice(0, 900);
    }
  } else {
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

async function renderToUrl(params: AdParams): Promise<string> {
  const png = await (await renderAd(params)).arrayBuffer();
  try {
    const stored = await uploadAdPng(png);
    if (stored) return stored;
  } catch (error) {
    console.error("ad upload failed, using render URL:", error);
  }
  return renderUrlFor(params);
}

export async function runGeneration(): Promise<GenerationResult> {
  const started = await sqlOne<{ id: string }>(
    `insert into agent_runs (agent, model) values ('content', $1) returning id`,
    [MODEL],
  );
  const runId = started!.id;

  try {
    // Which phase are we in, and clear the deck: unreviewed drafts from
    // earlier runs are superseded so the queue always shows one fresh batch.
    // Approved, ready, and published items are never touched.
    const published = await sqlOne<{ n: string }>(
      `select count(*)::text as n from content_queue where status = 'published'`,
    );
    const phase: Phase = Number(published?.n ?? 0) < LAUNCH_AFTER_PUBLISHED ? "launch" : "steady";
    await sql(
      `update content_queue
          set status = 'rejected',
              publish_result = jsonb_build_object('superseded', true)
        where status = 'draft'`,
    );

    let items: GeneratedItem[];
    let mode: "claude" | "sample";
    let inputTokens = 0;
    let outputTokens = 0;

    if (process.env.ANTHROPIC_API_KEY) {
      const client = new Anthropic();
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system: systemPrompt(phase),
        messages: [
          {
            role: "user",
            content: `Generate ${BATCH_SPECS[phase]} for ${SITE.url}. Remember: JSON array only, and every item needs its graphic.`,
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

    let created = 0;
    for (const item of items) {
      const assetUrls: string[] = [];
      for (const params of item.slides ?? (item.ad_params ? [item.ad_params] : [])) {
        assetUrls.push(await renderToUrl(params));
      }
      await sql(
        `insert into content_queue
           (run_id, platform, format, copy, asset_url, asset_urls, ad_params, hashtags)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          runId, item.platform, item.format, item.copy,
          assetUrls[0] ?? null, assetUrls.length ? assetUrls : null,
          item.ad_params || item.slides
            ? JSON.stringify(item.ad_params ?? { slides: item.slides, ...(item.script ? { script: item.script } : {}) })
            : null,
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
          ? `generated ${created} drafts (${phase} phase)`
          : `generated ${created} SAMPLE drafts (${phase} phase) — ANTHROPIC_API_KEY not set`,
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
