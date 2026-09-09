import "server-only";
import { sql, sqlOne } from "@/lib/db";

/**
 * Instagram for Story campaigns: the integration boundary.
 *
 * There is no Meta Graph API connection yet, and this module never pretends
 * there is. What exists today:
 *   - a person adds their handle and follower count (status: pending,
 *     verified_by: manual)
 *   - Story proof is a screenshot plus the story link, checked by the
 *     business (or an admin) before pay
 * When a real connection ships, connectViaApi/verifyStoryViaApi get bodies
 * and the rest of the product does not change.
 */

export function isInstagramApiConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export type StoryVerification =
  | { mode: "manual"; note: string }
  | { mode: "api"; verified: boolean; note: string };

/** Record a handle for a person. Manual verification until the API exists. */
export async function connectInstagramManually(profileId: string, handle: string, followers: number | null) {
  const clean = handle.replace(/^@/, "").trim().slice(0, 60);
  if (!/^[a-zA-Z0-9._]{1,60}$/.test(clean)) throw new Error("That doesn't look like an Instagram handle.");
  await sql(
    `insert into social_accounts (profile_id, provider, handle, follower_count, status, verified_by, connected_at, updated_at)
     values ($1, 'instagram', $2, $3, 'pending', 'manual', now(), now())
     on conflict (profile_id, provider) do update
       set handle = excluded.handle, follower_count = excluded.follower_count,
           status = 'pending', verified_by = 'manual', connected_at = now(), updated_at = now()`,
    [profileId, clean, followers],
  );
}

export async function disconnectInstagram(profileId: string) {
  await sql(
    `update social_accounts set status = 'disconnected', updated_at = now()
      where profile_id = $1 and provider = 'instagram'`,
    [profileId],
  );
}

/** Admin: mark a manually reviewed handle as connected. */
export async function confirmInstagramManually(profileId: string) {
  await sql(
    `update social_accounts set status = 'connected', verified_by = 'manual', updated_at = now()
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

export async function meetsFollowerRequirement(profileId: string, minFollowers: number | null): Promise<{ ok: boolean; followers: number | null }> {
  if (!minFollowers) return { ok: true, followers: null };
  const row = await sqlOne<{ follower_count: number | null; status: string }>(
    `select follower_count, status::text as status from social_accounts
      where profile_id = $1 and provider = 'instagram'`,
    [profileId],
  );
  const followers = row?.follower_count ?? null;
  return { ok: Boolean(row && row.status !== "disconnected" && (followers ?? 0) >= minFollowers), followers };
}
