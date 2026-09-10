import "server-only";
import { sql, sqlOne } from "@/lib/db";
import { completeInstagramLogin, metaConfigured, type InstagramMedia } from "@/lib/social/meta";

/**
 * A person's own Instagram (social_accounts, provider 'instagram'). Two ways in:
 *
 *   manual  the person types a handle. It sits at status 'pending' with no
 *           follower count shown anywhere until an admin confirms it, which
 *           sets status 'connected', verified_by 'manual'.
 *   oauth   Facebook Login for Business: the row gets external_id, avatar,
 *           follower_count and recent media from the Graph API, status
 *           'connected', verified_by 'api'.
 *
 * Follower counts are only ever reported for status 'connected'.
 */

export function isInstagramApiConfigured(): boolean {
  return metaConfigured();
}

export type InstagramForProfile = {
  status: "disconnected" | "pending" | "connected" | "error";
  handle: string | null;
  /** Null unless status is 'connected'. */
  followers: number | null;
  avatarUrl: string | null;
  verifiedBy: "none" | "manual" | "api";
  /** Recent posts, only when the connection came through the API. */
  media: InstagramMedia[];
  lastSyncedAt: string | null;
  lastError: string | null;
  apiConfigured: boolean;
};

export type StoryVerification =
  | { mode: "manual"; note: string }
  | { mode: "api"; verified: boolean; note: string };

export async function getInstagramForProfile(profileId: string): Promise<InstagramForProfile> {
  const row = await sqlOne<{
    status: InstagramForProfile["status"]; handle: string | null; follower_count: number | null;
    verified_by: InstagramForProfile["verifiedBy"]; avatar_url: string | null; meta: { media?: unknown } | null;
    last_synced_at: string | null; last_error: string | null;
  }>(
    `select status::text as status, handle, follower_count, verified_by, avatar_url, meta, last_synced_at, last_error
       from social_accounts where profile_id = $1 and provider = 'instagram'`,
    [profileId],
  );
  const apiConfigured = isInstagramApiConfigured();
  if (!row) {
    return { status: "disconnected", handle: null, followers: null, avatarUrl: null, verifiedBy: "none", media: [], lastSyncedAt: null, lastError: null, apiConfigured };
  }
  const connected = row.status === "connected";
  const media = connected && row.verified_by === "api" && Array.isArray(row.meta?.media) ? (row.meta!.media as InstagramMedia[]) : [];
  return {
    status: row.status,
    handle: row.handle,
    followers: connected ? row.follower_count : null,
    avatarUrl: connected ? row.avatar_url : null,
    verifiedBy: row.verified_by,
    media,
    lastSyncedAt: row.last_synced_at,
    lastError: row.last_error,
    apiConfigured,
  };
}

/** Record a handle for a person. Pending until an admin confirms it. */
export async function connectInstagramManually(profileId: string, handle: string, followers: number | null) {
  const clean = handle.replace(/^@/, "").trim().slice(0, 60);
  if (!/^[a-zA-Z0-9._]{1,60}$/.test(clean)) throw new Error("That doesn't look like an Instagram handle.");
  await sql(
    `insert into social_accounts (profile_id, provider, handle, follower_count, status, verified_by, connected_at, updated_at)
     values ($1, 'instagram', $2, $3, 'pending', 'manual', now(), now())
     on conflict (profile_id, provider) do update
       set handle = excluded.handle, follower_count = excluded.follower_count,
           status = 'pending', verified_by = 'manual', external_id = null, avatar_url = null, access_token = null,
           token_expires_at = null, meta = '{}'::jsonb, last_error = null, last_synced_at = null,
           connected_at = now(), updated_at = now()`,
    [profileId, clean, followers],
  );
}

/** The OAuth callback lands here: complete the login and store the real account. */
export async function connectInstagramViaApi(profileId: string, code: string, redirectUri: string, now = new Date()) {
  const result = await completeInstagramLogin(code, redirectUri, now);
  await upsertInstagramFromApi(profileId, {
    externalId: result.profile.id,
    handle: result.profile.username,
    avatarUrl: result.profile.profile_picture_url,
    followers: result.profile.followers_count,
    accessToken: result.tokens.access_token,
    tokenExpiresAt: result.tokens.expires_at,
    media: result.media,
  });
  return result.profile;
}

export async function upsertInstagramFromApi(profileId: string, input: {
  externalId: string; handle: string; avatarUrl: string | null; followers: number | null;
  accessToken: string | null; tokenExpiresAt: string | null; media: InstagramMedia[];
}) {
  const handle = input.handle.replace(/^@/, "").trim().slice(0, 60);
  await sql(
    `insert into social_accounts
       (profile_id, provider, handle, follower_count, status, verified_by, external_id, avatar_url, access_token,
        token_expires_at, meta, last_error, last_synced_at, connected_at, updated_at)
     values ($1, 'instagram', $2, $3, 'connected', 'api', $4, $5, $6, $7, $8::jsonb, null, now(), now(), now())
     on conflict (profile_id, provider) do update
       set handle = excluded.handle, follower_count = excluded.follower_count, status = 'connected', verified_by = 'api',
           external_id = excluded.external_id, avatar_url = excluded.avatar_url,
           access_token = coalesce(excluded.access_token, social_accounts.access_token),
           token_expires_at = coalesce(excluded.token_expires_at, social_accounts.token_expires_at),
           meta = excluded.meta, last_error = null, last_synced_at = now(),
           connected_at = coalesce(social_accounts.connected_at, now()), updated_at = now()`,
    [profileId, handle, input.followers, input.externalId, input.avatarUrl, input.accessToken, input.tokenExpiresAt,
     JSON.stringify({ media: input.media.slice(0, 12) })],
  );
}

export async function setInstagramUserError(profileId: string, message: string) {
  await sql(
    `insert into social_accounts (profile_id, provider, status, verified_by, last_error, updated_at)
     values ($1, 'instagram', 'error', 'none', $2, now())
     on conflict (profile_id, provider) do update
       set status = 'error', last_error = excluded.last_error, updated_at = now()`,
    [profileId, message.slice(0, 500)],
  );
}

export async function disconnectInstagram(profileId: string) {
  await sql(
    `update social_accounts
        set status = 'disconnected', follower_count = null, external_id = null, avatar_url = null, access_token = null,
            token_expires_at = null, meta = '{}'::jsonb, last_error = null, last_synced_at = null, updated_at = now()
      where profile_id = $1 and provider = 'instagram'`,
    [profileId],
  );
}

/** Admin: mark a manually reviewed handle as connected. */
export async function confirmInstagramManually(profileId: string) {
  await sql(
    `update social_accounts set status = 'connected', verified_by = 'manual', last_error = null, updated_at = now()
      where profile_id = $1 and provider = 'instagram'`,
    [profileId],
  );
}

/**
 * How a Story proof gets checked. Today: a person reviews it. The return
 * value tells the screen what to say instead of claiming automation.
 */
export async function storyVerification(): Promise<StoryVerification> {
  if (!isInstagramApiConfigured()) {
    return {
      mode: "manual",
      note: "The business checks your screenshot and story link, then approves. Automatic checking comes with the Instagram connection.",
    };
  }
  return { mode: "api", verified: false, note: "Checked against Instagram when the story ends." };
}

/** Only a connected account (API or admin-confirmed) has a follower count that counts. */
export async function meetsFollowerRequirement(profileId: string, minFollowers: number | null): Promise<{ ok: boolean; followers: number | null }> {
  if (!minFollowers) return { ok: true, followers: null };
  const row = await sqlOne<{ follower_count: number | null; status: string }>(
    `select follower_count, status::text as status from social_accounts
      where profile_id = $1 and provider = 'instagram'`,
    [profileId],
  );
  if (!row || row.status !== "connected") return { ok: false, followers: null };
  const followers = row.follower_count ?? null;
  return { ok: (followers ?? 0) >= minFollowers, followers };
}
