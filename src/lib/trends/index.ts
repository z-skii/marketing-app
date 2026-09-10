import "server-only";
import { sql, sqlOne } from "@/lib/db";
import type { TrendContext, TrendItem, TrendPlatform, TrendSource } from "./types";
import { PROVIDERS, apiProvider, curatedProvider, fixtureProvider, manualProvider } from "./providers";

export type { TrendContext, TrendItem, TrendPlatform, TrendProvider, TrendSource } from "./types";
export { apiProvider, curatedProvider, fixtureProvider, manualProvider };

/**
 * Viral content discovery for a business: every available provider merged,
 * the business's own links first, duplicates by link removed, capped at 12.
 */

export const MAX_TRENDS = 12;

const ORDER: TrendSource[] = ["manual", "curated", "api", "fixture"];

function normalizeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    u.hash = "";
    u.search = "";
    const host = u.host.toLowerCase().replace(/^www\./, "");
    const p = u.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${p}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

/** Merge provider results: manual first, then curated, api, fixtures. */
export function mergeTrends(lists: TrendItem[][], max = MAX_TRENDS): TrendItem[] {
  const all = lists.flat().sort((a, b) => ORDER.indexOf(a.source) - ORDER.indexOf(b.source));
  const seenUrl = new Set<string>();
  const seenId = new Set<string>();
  const out: TrendItem[] = [];
  for (const t of all) {
    if (seenId.has(t.id)) continue;
    const key = normalizeUrl(t.reference_url);
    if (key && seenUrl.has(key)) continue;
    if (key) seenUrl.add(key);
    seenId.add(t.id);
    out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

async function contextFor(businessId: string): Promise<TrendContext | null> {
  const b = await sqlOne<{ category: string | null; city: string | null }>(
    `select category, city from businesses where id = $1`, [businessId],
  );
  return b ? { businessId, category: b.category, city: b.city } : null;
}

export async function getTrendsForBusiness(businessId: string): Promise<TrendItem[]> {
  const ctx = await contextFor(businessId);
  if (!ctx) return [];
  const lists = await Promise.all(
    PROVIDERS.filter((p) => p.available()).map(async (p) => {
      try {
        return await p.fetch(ctx);
      } catch (error) {
        console.error(`trend provider ${p.id} failed:`, error);
        return [] as TrendItem[];
      }
    }),
  );
  return mergeTrends(lists);
}

/** One trend by id for this business: a stored row it may see, or a fixture. */
export async function getTrendForBusiness(id: string, businessId: string): Promise<TrendItem | null> {
  if (id.startsWith("fixture-")) {
    if (!fixtureProvider.available()) return null;
    const ctx = await contextFor(businessId);
    if (!ctx) return null;
    return (await fixtureProvider.fetch(ctx)).find((t) => t.id === id) ?? null;
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const trends = await getTrendsForBusiness(businessId);
  return trends.find((t) => t.id === id) ?? null;
}

export function platformFromUrl(url: string): TrendPlatform {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  } catch {
    // not a URL
  }
  return "other";
}

export async function addManualTrend(
  businessId: string,
  userId: string,
  input: { url: string; title?: string | null; platform?: TrendPlatform | null },
): Promise<TrendItem> {
  const url = input.url.trim().slice(0, 500);
  if (!/^https?:\/\/\S+$/i.test(url)) throw new Error("Paste the full link, starting with https://");
  const platform = input.platform ?? platformFromUrl(url);
  const title = (input.title?.trim() || defaultTitle(url, platform)).slice(0, 200);

  // The same link pasted twice is one row: re-activate it instead of duplicating.
  const existing = await sqlOne<{ id: string }>(
    `select id from trend_items where source = 'manual' and business_id = $1 and reference_url = $2`,
    [businessId, url],
  );
  let id: string;
  if (existing) {
    await sql(`update trend_items set status = 'active' where id = $1`, [existing.id]);
    id = existing.id;
  } else {
    const row = await sqlOne<{ id: string }>(
      `insert into trend_items (source, business_id, title, platform, reference_url, created_by)
       values ('manual', $1, $2, $3, $4, $5) returning id`,
      [businessId, title, platform, url, userId],
    );
    id = row!.id;
  }
  const item = await sqlOne<TrendItem & { views: string | null }>(
    `select id, source, business_id, category, title, platform, reference_url, media_url, thumbnail_url,
            views, growth_note, fit_note, created_at from trend_items where id = $1`,
    [id],
  );
  return { ...item!, views: item!.views === null ? null : Number(item!.views), created_at: String(item!.created_at) };
}

function defaultTitle(url: string, platform: TrendPlatform): string {
  const label = platform === "other" ? "Link" : platform[0].toUpperCase() + platform.slice(1);
  try {
    const p = new URL(url).pathname.split("/").filter(Boolean);
    const last = p[p.length - 1];
    return last ? `${label}: ${last.slice(0, 60)}` : `${label} reference`;
  } catch {
    return `${label} reference`;
  }
}

/** Archive a manual trend the business added. Curated rows cannot be archived per business. */
export async function archiveTrend(id: string, businessId: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false;
  const rows = await sql<{ id: string }>(
    `update trend_items set status = 'archived'
      where id = $1 and business_id = $2 and source = 'manual' returning id`,
    [id, businessId],
  );
  return rows.length > 0;
}

export function listProviderStatus(): { id: TrendSource; label: string; available: boolean }[] {
  return PROVIDERS.map((p) => ({ id: p.id, label: p.label, available: p.available() }));
}
