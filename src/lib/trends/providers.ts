import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import { sql } from "@/lib/db";
import { devAuthEnabled } from "@/lib/supabase";
import type { TrendContext, TrendItem, TrendProvider } from "./types";

/**
 * The four places a trend can come from. Each provider says whether it can
 * return anything in this environment and never invents a number: `views`
 * is null unless a real figure came with the row.
 */

type TrendRow = Omit<TrendItem, "views" | "created_at"> & { views: string | number | null; created_at: string | Date };

function rowToItem(r: TrendRow): TrendItem {
  return {
    id: r.id,
    source: r.source,
    business_id: r.business_id,
    category: r.category,
    title: r.title,
    platform: r.platform,
    reference_url: r.reference_url,
    media_url: r.media_url,
    thumbnail_url: r.thumbnail_url,
    views: r.views === null || r.views === undefined ? null : Number(r.views),
    growth_note: r.growth_note,
    fit_note: r.fit_note,
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  };
}

const COLUMNS = `id, source, business_id, category, title, platform, reference_url, media_url, thumbnail_url,
                 views, growth_note, fit_note, created_at`;

/** Links a business pasted itself. Always available. */
export const manualProvider: TrendProvider = {
  id: "manual",
  label: "Added by you",
  available: () => true,
  async fetch(ctx: TrendContext) {
    const rows = await sql<TrendRow>(
      `select ${COLUMNS} from trend_items
        where source = 'manual' and business_id = $1 and status = 'active'
        order by created_at desc limit 20`,
      [ctx.businessId],
    );
    return rows.map(rowToItem);
  },
};

/** Rows TapMart staff curated for a category (or for everyone: null category). */
export const curatedProvider: TrendProvider = {
  id: "curated",
  label: "Curated by TapMart",
  available: () => true,
  async fetch(ctx: TrendContext) {
    const rows = await sql<TrendRow>(
      `select ${COLUMNS} from trend_items
        where source = 'curated' and status = 'active'
          and business_id is null
          and (category is null or ($1::text is not null and lower(category) = lower($1)))
        order by (category is not null) desc, created_at desc limit 20`,
      [ctx.category],
    );
    return rows.map(rowToItem);
  },
};

const SEED_DIR = path.join(process.cwd(), "public", "uploads", "seed");

function seedMedia(file: string): string | null {
  return existsSync(path.join(SEED_DIR, file)) ? `/uploads/seed/${file}` : null;
}

/**
 * Development fixtures. Served only when dev auth is on, never persisted,
 * ids prefixed `fixture-` so nothing downstream mistakes them for rows.
 */
export const fixtureProvider: TrendProvider = {
  id: "fixture",
  label: "Development fixtures",
  available: () => devAuthEnabled(),
  async fetch(ctx: TrendContext) {
    if (!devAuthEnabled()) return [];
    const latte = seedMedia("demo-latte.webp");
    const story = seedMedia("demo-story.jpg");
    const now = new Date().toISOString();
    const base = { source: "fixture" as const, business_id: null, category: ctx.category, views: null, growth_note: "Development fixture", created_at: now };
    return [
      {
        ...base,
        id: "fixture-pov-opening",
        title: "Employee POV: opening the shop",
        platform: "instagram",
        reference_url: "https://www.instagram.com/reel/fixture-pov-opening",
        media_url: latte,
        thumbnail_url: latte,
        fit_note: "Works for any place with a counter and a morning routine.",
      },
      {
        ...base,
        id: "fixture-first-sip",
        title: "First sip reaction, one take",
        platform: "tiktok",
        reference_url: "https://www.tiktok.com/@fixture/video/first-sip",
        media_url: latte,
        thumbnail_url: latte,
        fit_note: "A single honest reaction to the product, filmed by a customer.",
      },
      {
        ...base,
        id: "fixture-story-walkthrough",
        title: "Walk in with me: 20 second visit",
        platform: "youtube",
        reference_url: "https://www.youtube.com/shorts/fixture-walkthrough",
        media_url: story,
        thumbnail_url: story,
        fit_note: "Entrance to counter to product in one continuous move.",
      },
    ];
  },
};

/**
 * Placeholder for a real platform integration. Reports unavailable until
 * one exists. A real provider needs one of:
 *   TikTok Research API (application-only access, keyword and hashtag
 *     video queries with real view counts),
 *   Instagram Graph API hashtag search plus media insights (needs a
 *     Business account, app review, and the hashtag rate limits),
 *   or a third-party trend provider with a commercial licence.
 * Configure with env TREND_API_KEY (plus the provider's own settings) and
 * implement fetch() to map results to TrendItem with `views` set only from
 * the provider's real figure.
 */
export const apiProvider: TrendProvider = {
  id: "api",
  label: "Platform data",
  available: () => false,
  async fetch() {
    return [];
  },
};

export const PROVIDERS: TrendProvider[] = [manualProvider, curatedProvider, fixtureProvider, apiProvider];
