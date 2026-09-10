import "server-only";
import { sql, sqlOne } from "@/lib/db";

/**
 * Growth analytics for a business. Two providers, one interface:
 *
 *   instagramApi     the Instagram Graph API with the business's own token
 *                    (connected_accounts, provider instagram, status
 *                    connected, source oauth). Real calls, with a timeout.
 *   manualSnapshots  numbers the business typed in itself (social_snapshots
 *                    with source "manual") or that an API run stored (source
 *                    "api").
 *
 * getGrowthSummary always says where the numbers came from; without data it
 * returns source "unavailable" and no metrics. Nothing is estimated.
 */

export type InsightsSource = "api" | "manual" | "unavailable";

export type GrowthMetrics = {
  reach: number | null;
  followers_delta: number | null;
  views: number | null;
  engagement_pct: number | null;
};

export type TopPost = {
  title: string;
  thumbnail_url: string | null;
  views: number | null;
  href: string | null;
};

export type GrowthPeriod = { start: string; end: string };

export type GrowthSummary = {
  source: InsightsSource;
  provider: SnapshotProvider | null;
  period: GrowthPeriod | null;
  metrics: GrowthMetrics;
  top_post: TopPost | null;
  next_action: { label: string; href: string } | null;
};

export type SnapshotProvider = "instagram" | "facebook" | "tiktok" | "google_business";

export type Snapshot = {
  provider: SnapshotProvider;
  source: "manual" | "api";
  period: GrowthPeriod;
  metrics: GrowthMetrics;
  top_post: TopPost | null;
};

export interface InsightsProvider {
  id: "instagram_api" | "manual";
  available(businessId: string): Promise<boolean>;
  /** The latest period's numbers, or null when there are none. */
  fetch(businessId: string, period?: GrowthPeriod): Promise<Snapshot | null>;
}

const EMPTY_METRICS: GrowthMetrics = { reach: null, followers_delta: null, views: null, engagement_pct: null };

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The last 28 full days, ending yesterday. */
export function defaultPeriod(now = new Date()): GrowthPeriod {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const start = new Date(end.getTime() - 27 * 24 * 60 * 60 * 1000);
  return { start: isoDay(start), end: isoDay(end) };
}

// ------------------------------------------------------------ Instagram API

const IG_API = "https://graph.facebook.com/v19.0";
const FETCH_TIMEOUT_MS = 8000;

type BusinessToken = { token: string; userId: string };

/** The business's own Instagram token, only while the connection is real. */
async function businessToken(businessId: string): Promise<BusinessToken | null> {
  const row = await sqlOne<{ access_token: string | null; external_id: string | null; token_expires_at: string | null }>(
    `select access_token, external_id, token_expires_at from connected_accounts
      where business_id = $1 and provider = 'instagram' and status = 'connected' and source = 'oauth'`,
    [businessId],
  );
  if (!row?.access_token || !row.external_id) return null;
  if (row.token_expires_at && new Date(row.token_expires_at).getTime() < Date.now()) return null;
  return { token: row.access_token, userId: row.external_id };
}

async function graphGet(token: string, path: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = new URL(`${IG_API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) {
      const message = (json.error as { message?: string } | undefined)?.message ?? `HTTP ${response.status}`;
      throw new Error(`Instagram Graph API: ${message}`);
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

type InsightValue = { value?: unknown; end_time?: string };
type InsightRow = { name?: string; values?: InsightValue[]; total_value?: { value?: unknown } };

function sumValues(rows: InsightRow[], name: string): number | null {
  const row = rows.find((r) => r.name === name);
  if (!row) return null;
  if (row.total_value && num(row.total_value.value) !== null) return num(row.total_value.value);
  if (!Array.isArray(row.values)) return null;
  let total = 0;
  let seen = false;
  for (const v of row.values) {
    const n = num(v.value);
    if (n !== null) { total += n; seen = true; }
  }
  return seen ? total : null;
}

function followerDelta(rows: InsightRow[]): number | null {
  const row = rows.find((r) => r.name === "follower_count");
  if (!row || !Array.isArray(row.values)) return null;
  let total = 0;
  let seen = false;
  for (const v of row.values) {
    const n = num(v.value);
    if (n !== null) { total += n; seen = true; }
  }
  return seen ? total : null;
}

type MediaItem = {
  id?: string; caption?: string; media_type?: string; media_url?: string; thumbnail_url?: string;
  permalink?: string; like_count?: number; comments_count?: number; timestamp?: string;
};

/** Reach, views and follower change over the period, plus the best post. Real calls only. */
export const instagramApi: InsightsProvider = {
  id: "instagram_api",
  async available(businessId) {
    return Boolean(await businessToken(businessId));
  },
  async fetch(businessId, period = defaultPeriod()) {
    const auth = await businessToken(businessId);
    if (!auth) return null;
    const { token, userId } = auth;
    const since = String(Math.floor(Date.parse(`${period.start}T00:00:00Z`) / 1000));
    const until = String(Math.floor(Date.parse(`${period.end}T23:59:59Z`) / 1000));

    const daily = await graphGet(token, `${userId}/insights`, {
      metric: "reach,follower_count", period: "day", since, until,
    });
    const dailyRows = (daily.data as InsightRow[] | undefined) ?? [];

    // "views" replaced "impressions" in newer API versions; try both, keep whichever answers.
    let views: number | null = null;
    for (const metric of ["views", "impressions"]) {
      try {
        const res = await graphGet(token, `${userId}/insights`, {
          metric, period: "day", metric_type: "total_value", since, until,
        });
        views = sumValues((res.data as InsightRow[] | undefined) ?? [], metric);
        if (views !== null) break;
      } catch {
        // metric not available on this account or API version; leave null
      }
    }

    const mediaRes = await graphGet(token, `${userId}/media`, {
      fields: "id,caption,media_type,media_url,thumbnail_url,permalink,like_count,comments_count,timestamp",
      limit: "25",
    });
    const media = ((mediaRes.data as MediaItem[] | undefined) ?? []).filter((m) => {
      const t = m.timestamp ? Date.parse(m.timestamp) : NaN;
      return Number.isFinite(t) && t >= Number(since) * 1000 && t <= Number(until) * 1000;
    });
    const reach = sumValues(dailyRows, "reach");
    const interactions = media.reduce((s, m) => s + (m.like_count ?? 0) + (m.comments_count ?? 0), 0);
    const engagement_pct = reach && reach > 0 ? Math.round((interactions / reach) * 1000) / 10 : null;

    const best = media
      .slice()
      .sort((a, b) => ((b.like_count ?? 0) + (b.comments_count ?? 0)) - ((a.like_count ?? 0) + (a.comments_count ?? 0)))[0];
    const top_post: TopPost | null = best
      ? {
          title: (best.caption ?? "").split("\n")[0].slice(0, 120) || "Untitled post",
          thumbnail_url: best.thumbnail_url ?? best.media_url ?? null,
          views: null,
          href: best.permalink ?? null,
        }
      : null;

    const snapshot: Snapshot = {
      provider: "instagram",
      source: "api",
      period,
      metrics: { reach, followers_delta: followerDelta(dailyRows), views, engagement_pct },
      top_post,
    };
    await storeSnapshot(businessId, snapshot);
    return snapshot;
  },
};

// ---------------------------------------------------------------- snapshots

export async function storeSnapshot(businessId: string, s: Snapshot): Promise<void> {
  await sql(
    `insert into social_snapshots (business_id, provider, period_start, period_end, source, metrics, top_post)
     values ($1, $2, $3::date, $4::date, $5, $6::jsonb, $7::jsonb)`,
    [businessId, s.provider, s.period.start, s.period.end, s.source, JSON.stringify(s.metrics),
     s.top_post ? JSON.stringify(s.top_post) : null],
  );
}

function rowToSnapshot(row: {
  provider: SnapshotProvider; source: "manual" | "api"; period_start: string; period_end: string;
  metrics: Record<string, unknown> | null; top_post: Record<string, unknown> | null;
}): Snapshot {
  const m = row.metrics ?? {};
  const t = row.top_post;
  return {
    provider: row.provider,
    source: row.source,
    period: { start: row.period_start, end: row.period_end },
    metrics: {
      reach: num(m.reach), followers_delta: num(m.followers_delta), views: num(m.views), engagement_pct: num(m.engagement_pct),
    },
    top_post: t && typeof t.title === "string"
      ? {
          title: t.title,
          thumbnail_url: typeof t.thumbnail_url === "string" ? t.thumbnail_url : null,
          views: num(t.views),
          href: typeof t.href === "string" ? t.href : null,
        }
      : null,
  };
}

const SNAPSHOT_COLUMNS =
  `provider, source, period_start::text as period_start, period_end::text as period_end, metrics, top_post`;

/** Whatever the business or an earlier API run stored. Latest period wins. */
export const manualSnapshots: InsightsProvider = {
  id: "manual",
  async available(businessId) {
    const row = await sqlOne(`select 1 as ok from social_snapshots where business_id = $1 limit 1`, [businessId]);
    return Boolean(row);
  },
  async fetch(businessId) {
    const row = await sqlOne<Parameters<typeof rowToSnapshot>[0]>(
      `select ${SNAPSHOT_COLUMNS} from social_snapshots
        where business_id = $1 order by period_end desc, created_at desc limit 1`,
      [businessId],
    );
    return row ? rowToSnapshot(row) : null;
  },
};

export async function listSnapshots(businessId: string, limit = 12): Promise<Snapshot[]> {
  const rows = await sql<Parameters<typeof rowToSnapshot>[0]>(
    `select ${SNAPSHOT_COLUMNS} from social_snapshots
      where business_id = $1 order by period_end desc, created_at desc limit $2`,
    [businessId, Math.min(Math.max(limit, 1), 100)],
  );
  return rows.map(rowToSnapshot);
}

export type ManualSnapshotInput = {
  provider: SnapshotProvider;
  periodStart: string;
  periodEnd: string;
  reach?: number | null;
  followersDelta?: number | null;
  views?: number | null;
  engagementPct?: number | null;
  topPost?: { title: string; thumbnailUrl?: string | null; views?: number | null; href?: string | null } | null;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The business types its own numbers. Stored and shown as "manual", never as API data. */
export async function addManualSnapshot(businessId: string, input: ManualSnapshotInput): Promise<Snapshot> {
  if (!DAY.test(input.periodStart) || !DAY.test(input.periodEnd)) throw new Error("Dates must look like YYYY-MM-DD.");
  if (input.periodEnd < input.periodStart) throw new Error("The period ends before it starts.");
  const metrics: GrowthMetrics = {
    reach: num(input.reach), followers_delta: num(input.followersDelta), views: num(input.views), engagement_pct: num(input.engagementPct),
  };
  if (Object.values(metrics).every((v) => v === null)) throw new Error("Enter at least one number.");
  const top_post: TopPost | null = input.topPost?.title?.trim()
    ? {
        title: input.topPost.title.trim().slice(0, 120),
        thumbnail_url: input.topPost.thumbnailUrl?.trim().slice(0, 500) || null,
        views: num(input.topPost.views),
        href: input.topPost.href?.trim().slice(0, 500) || null,
      }
    : null;
  const snapshot: Snapshot = {
    provider: input.provider, source: "manual",
    period: { start: input.periodStart, end: input.periodEnd }, metrics, top_post,
  };
  await storeSnapshot(businessId, snapshot);
  return snapshot;
}

// ------------------------------------------------------------------ summary

async function nextAction(businessId: string): Promise<{ label: string; href: string }> {
  const trend = await sqlOne(
    `select 1 as ok from marketing_recommendations
      where business_id = $1 and kind = 'trend' and status = 'new' limit 1`,
    [businessId],
  );
  return trend
    ? { label: "See what is trending for you", href: "/business/trends" }
    : { label: "Run a campaign", href: "/business/create" };
}

export async function getGrowthSummary(businessId: string): Promise<GrowthSummary> {
  const next = await nextAction(businessId);
  let snapshot: Snapshot | null = null;

  if (await instagramApi.available(businessId)) {
    try {
      snapshot = await instagramApi.fetch(businessId);
    } catch (error) {
      console.error("growth summary: Instagram API failed, using stored snapshots:", error);
    }
  }
  if (!snapshot) snapshot = await manualSnapshots.fetch(businessId);

  if (!snapshot) {
    return { source: "unavailable", provider: null, period: null, metrics: EMPTY_METRICS, top_post: null, next_action: next };
  }
  return {
    source: snapshot.source,
    provider: snapshot.provider,
    period: snapshot.period,
    metrics: snapshot.metrics,
    top_post: snapshot.top_post,
    next_action: next,
  };
}
