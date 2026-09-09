"use server";

import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { requireOnboarded } from "@/lib/v2/core";

/** Shared social actions: save, follow, block, report, notification state. */

type Result = { ok: boolean; error?: string; saved?: boolean; following?: boolean };

const SAVE_TYPES = ["campaign", "vehicle", "profile", "business"];

export async function toggleSave(itemType: string, itemId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  if (!SAVE_TYPES.includes(itemType)) return { ok: false, error: "Bad item." };
  const removed = await sqlOne(
    `delete from saved_items where profile_id = $1 and item_type = $2 and item_id = $3 returning 1 as x`,
    [ctx.user.id, itemType, itemId],
  );
  if (removed) return { ok: true, saved: false };
  await sql(
    `insert into saved_items (profile_id, item_type, item_id) values ($1, $2, $3)
     on conflict do nothing`,
    [ctx.user.id, itemType, itemId],
  );
  return { ok: true, saved: true };
}

export async function toggleFollow(profileId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  if (profileId === ctx.user.id) return { ok: false, error: "That's you." };
  const removed = await sqlOne(
    `delete from follows where follower_id = $1 and followed_id = $2 returning 1 as x`,
    [ctx.user.id, profileId],
  );
  if (removed) return { ok: true, following: false };
  await sql(
    `insert into follows (follower_id, followed_id) values ($1, $2) on conflict do nothing`,
    [ctx.user.id, profileId],
  );
  return { ok: true, following: true };
}

export async function blockUser(profileId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  if (profileId === ctx.user.id) return { ok: false, error: "That's you." };
  await sql(
    `insert into blocks (blocker_id, blocked_id) values ($1, $2) on conflict do nothing`,
    [ctx.user.id, profileId],
  );
  revalidatePath("/home");
  return { ok: true };
}

const REPORT_TYPES = ["profile", "business", "campaign", "vehicle", "submission", "message"];

export async function reportTarget(
  targetType: string,
  targetId: string,
  reason: string,
  detail?: string,
): Promise<Result> {
  const ctx = await requireOnboarded();
  if (!REPORT_TYPES.includes(targetType)) return { ok: false, error: "Bad target." };
  const cleanReason = reason.trim().slice(0, 120);
  if (!cleanReason) return { ok: false, error: "Say what's wrong." };
  await sql(
    `insert into reports (reporter_id, target_type, target_id, reason, detail)
     values ($1, $2, $3, $4, $5)`,
    [ctx.user.id, targetType, targetId, cleanReason, detail?.trim().slice(0, 2000) ?? null],
  );
  return { ok: true };
}

/**
 * Reviews are earned: only the two sides of a genuinely completed piece of
 * work (a paid submission, a completed booking) can review each other.
 */
export async function leaveReview(input: {
  contextType: "submission" | "booking";
  contextId: string;
  rating: number;
  body?: string;
}): Promise<Result> {
  const ctx = await requireOnboarded();
  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) return { ok: false, error: "Pick 1 to 5." };

  let subject: { type: "profile" | "business"; id: string; profileToRate?: string } | null = null;
  if (input.contextType === "submission") {
    const s = await sqlOne<{ creator_id: string; owner_id: string; business_id: string; status: string }>(
      `select s.creator_id, b.owner_id, b.id as business_id, s.status::text as status
         from submissions s
         join campaigns c on c.id = s.campaign_id
         join businesses b on b.id = c.business_id
        where s.id = $1`,
      [input.contextId],
    );
    if (!s || s.status !== "paid") return { ok: false, error: "Only completed work can be reviewed." };
    if (ctx.user.id === s.creator_id) subject = { type: "business", id: s.business_id };
    else if (ctx.user.id === s.owner_id) subject = { type: "profile", id: s.creator_id, profileToRate: s.creator_id };
  } else {
    const bk = await sqlOne<{ driver_id: string; owner_id: string; business_id: string; status: string }>(
      `select v.owner_id as driver_id, b.owner_id, b.id as business_id, k.status::text as status
         from car_bookings k
         join vehicles v on v.id = k.vehicle_id
         join businesses b on b.id = k.business_id
        where k.id = $1`,
      [input.contextId],
    );
    if (!bk || bk.status !== "completed") return { ok: false, error: "Only completed bookings can be reviewed." };
    if (ctx.user.id === bk.driver_id) subject = { type: "business", id: bk.business_id };
    else if (ctx.user.id === bk.owner_id) subject = { type: "profile", id: bk.driver_id, profileToRate: bk.driver_id };
  }
  if (!subject) return { ok: false, error: "You weren't part of this work." };

  const inserted = await sqlOne(
    `insert into reviews (reviewer_id, subject_type, subject_id, context_type, context_id, rating, body)
     values ($1, $2, $3, $4, $5, $6, nullif($7, ''))
     on conflict (reviewer_id, context_type, context_id) do nothing
     returning id`,
    [ctx.user.id, subject.type, subject.id, input.contextType, input.contextId, rating,
     input.body?.trim().slice(0, 1000) ?? ""],
  );
  if (!inserted) return { ok: false, error: "You already reviewed this." };

  if (subject.profileToRate) {
    await sql(
      `update creator_profiles cp
          set rating_avg = sub.avg, rating_count = sub.n
         from (select round(avg(rating)::numeric, 2) as avg, count(*)::int as n
                 from reviews where subject_type = 'profile' and subject_id = $1) sub
        where cp.profile_id = $1`,
      [subject.profileToRate],
    );
  }
  return { ok: true };
}

export async function markNotificationsRead(): Promise<Result> {
  const ctx = await requireOnboarded();
  await sql(
    `update notifications set read_at = now() where profile_id = $1 and read_at is null`,
    [ctx.user.id],
  );
  revalidatePath("/alerts");
  return { ok: true };
}
