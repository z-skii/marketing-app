import "server-only";
import { sql, sqlOne } from "@/lib/db";
import {
  completeInstagramLogin, fetchInstagramMedia, fetchInstagramProfile, MetaApiError, metaConfigured,
  type InstagramMedia, type InstagramProfile,
} from "@/lib/social/meta";
import { defaultPeriod, storeSnapshot, type Snapshot } from "@/lib/social/insights";

/**
 * A business's Instagram, stored in connected_accounts (provider
 * 'instagram', source 'oauth'). The row holds the IG user id, username,
 * avatar, token and a `meta` snapshot { followers, media_count, media: [...] }
 * refreshed by syncInstagramBusiness, which also writes the 'api' rows in
 * social_snapshots so growth numbers are measured, never estimated.
 */

export type InstagramBusinessMeta = {
  followers?: number | null;
  media_count?: number | null;
  media?: InstagramMedia[];
  page?: { id: string; name: string };
  /** Follower counts by day, so growth is a real difference. */
  history?: { day: string; followers: number }[];
};

export type InstagramBusinessRow = {
  status: "disconnected" | "pending" | "connected" | "error";
  source: "oauth" | "manual";
  external_id: string | null;
  external_name: string | null;
  avatar_url: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  meta: InstagramBusinessMeta;
  last_error: string | null;
  last_synced_at: string | null;
  connected_at: string | null;
};

export const NEEDS_RECONNECT = "Needs reconnect";

export function instagramBusinessConfigured(): boolean {
  return metaConfigured();
}

export async function getInstagramBusiness(businessId: string): Promise<InstagramBusinessRow | null> {
  return sqlOne<InstagramBusinessRow>(
    `select status::text as status, source, external_id, external_name, avatar_url, access_token, token_expires_at,
            meta, last_error, last_synced_at, connected_at
       from connected_accounts where business_id = $1 and provider = 'instagram'`,
    [businessId],
  );
}

function isoDay(iso: string | Date): string {
  return (iso instanceof Date ? iso : new Date(iso)).toISOString().slice(0, 10);
}

function historyWith(history: InstagramBusinessMeta["history"], followers: number | null, now: Date) {
  const list = Array.isArray(history) ? history.filter((h) => h && typeof h.day === "string" && typeof h.followers === "number") : [];
  if (followers === null) return list.slice(-120);
  const day = isoDay(now);
  const rest = list.filter((h) => h.day !== day);
  return [...rest, { day, followers }].sort((a, b) => a.day.localeCompare(b.day)).slice(-120);
}

async function writeProfile(businessId: string, profile: InstagramProfile, media: InstagramMedia[], extra: {
  token?: string | null; expiresAt?: string | null; page?: { id: string; name: string } | null; now: Date;
}): Promise<void> {
  const existing = await getInstagramBusiness(businessId);
  const meta: InstagramBusinessMeta = {
    ...(existing?.meta ?? {}),
    followers: profile.followers_count,
    media_count: profile.media_count,
    media,
    ...(extra.page ? { page: extra.page } : {}),
    history: historyWith(existing?.meta.history, profile.followers_count, extra.now),
  };
  await sql(
    `insert into connected_accounts
       (business_id, provider, status, source, external_id, external_name, avatar_url, access_token, token_expires_at,
        meta, last_error, last_synced_at, connected_at, updated_at)
     values ($1, 'instagram', 'connected', 'oauth', $2, $3, $4, $5, $6, $7::jsonb, null, now(), now(), now())
     on conflict (business_id, provider) do update
       set status = 'connected', source = 'oauth', external_id = excluded.external_id, external_name = excluded.external_name,
           avatar_url = excluded.avatar_url,
           access_token = coalesce(excluded.access_token, connected_accounts.access_token),
           token_expires_at = coalesce(excluded.token_expires_at, connected_accounts.token_expires_at),
           meta = excluded.meta, last_error = null, last_synced_at = now(),
           connected_at = coalesce(connected_accounts.connected_at, now()), updated_at = now()`,
    [businessId, profile.id, profile.username, profile.profile_picture_url, extra.token ?? null, extra.expiresAt ?? null, JSON.stringify(meta)],
  );
}

/** Growth for the default period from the stored follower history and media. Real differences only. */
export function snapshotFrom(meta: InstagramBusinessMeta, now = new Date()): Snapshot | null {
  const period = defaultPeriod(now);
  const history = meta.history ?? [];
  const inPeriod = history.filter((h) => h.day >= period.start && h.day <= isoDay(now));
  const first = inPeriod[0];
  const last = inPeriod[inPeriod.length - 1];
  const followers_delta = first && last && first.day !== last.day ? last.followers - first.followers : null;
  const media = (meta.media ?? []).filter((m) => m.timestamp && m.timestamp.slice(0, 10) >= period.start);
  const best = media.slice().sort((a, b) => ((b.like_count ?? 0) + (b.comments_count ?? 0)) - ((a.like_count ?? 0) + (a.comments_count ?? 0)))[0];
  if (followers_delta === null && !best) return null;
  return {
    provider: "instagram",
    source: "api",
    period,
    metrics: { reach: null, followers_delta, views: null, engagement_pct: null },
    top_post: best
      ? { title: (best.caption ?? "").split("\n")[0].slice(0, 120) || "Untitled post", thumbnail_url: best.thumbnail_url ?? best.media_url ?? null, views: null, href: best.permalink }
      : null,
  };
}

/** The OAuth callback lands here: complete the login and store everything. */
export async function connectInstagramBusiness(businessId: string, code: string, redirectUri: string, now = new Date()): Promise<InstagramProfile> {
  const result = await completeInstagramLogin(code, redirectUri, now);
  await writeProfile(businessId, result.profile, result.media, {
    token: result.tokens.access_token, expiresAt: result.tokens.expires_at, page: { id: result.page.id, name: result.page.name }, now,
  });
  await syncSnapshot(businessId, now);
  return result.profile;
}

async function syncSnapshot(businessId: string, now: Date): Promise<void> {
  const row = await getInstagramBusiness(businessId);
  if (!row) return;
  const snapshot = snapshotFrom(row.meta, now);
  if (!snapshot) return;
  await sql(
    `delete from social_snapshots where business_id = $1 and provider = 'instagram' and source = 'api'
        and period_start = $2::date and period_end = $3::date`,
    [businessId, snapshot.period.start, snapshot.period.end],
  );
  await storeSnapshot(businessId, snapshot);
}

/** Refresh profile, media and the growth snapshot with the stored token. */
export async function syncInstagramBusiness(businessId: string, now = new Date()): Promise<InstagramProfile> {
  const row = await getInstagramBusiness(businessId);
  if (!row || row.status === "disconnected" || !row.access_token || !row.external_id) throw new Error("Instagram is not connected.");
  if (row.token_expires_at && new Date(row.token_expires_at).getTime() < now.getTime()) {
    await setInstagramError(businessId, NEEDS_RECONNECT);
    throw new Error(NEEDS_RECONNECT);
  }
  try {
    const [profile, media] = await Promise.all([
      fetchInstagramProfile(row.external_id, row.access_token),
      fetchInstagramMedia(row.external_id, row.access_token, 12),
    ]);
    await writeProfile(businessId, profile, media, { now });
    await syncSnapshot(businessId, now);
    return profile;
  } catch (error) {
    if (error instanceof MetaApiError && (error.status === 401 || error.code === 190)) {
      await setInstagramError(businessId, NEEDS_RECONNECT);
      throw new Error(NEEDS_RECONNECT);
    }
    const message = error instanceof Error ? error.message : "Instagram sync failed.";
    await sql(
      `update connected_accounts set last_error = $2, updated_at = now() where business_id = $1 and provider = 'instagram'`,
      [businessId, message.slice(0, 500)],
    );
    throw error;
  }
}

export async function setInstagramError(businessId: string, message: string): Promise<void> {
  await sql(
    `insert into connected_accounts (business_id, provider, status, source, last_error, updated_at)
     values ($1, 'instagram', 'error', 'oauth', $2, now())
     on conflict (business_id, provider) do update
       set status = 'error', last_error = excluded.last_error, updated_at = now()`,
    [businessId, message.slice(0, 500)],
  );
}

export async function disconnectInstagramBusiness(businessId: string): Promise<void> {
  await sql(
    `update connected_accounts
        set status = 'disconnected', access_token = null, refresh_token = null, token_expires_at = null, scope = null,
            external_id = null, external_name = null, avatar_url = null, meta = '{}'::jsonb,
            last_error = null, last_synced_at = null, connected_at = null, updated_at = now()
      where business_id = $1 and provider = 'instagram'`,
    [businessId],
  );
}
