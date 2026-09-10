"use server";

import { revalidatePath } from "next/cache";
import { sqlOne } from "@/lib/db";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import { approveAll, moveCalendarPost, proposeMonth, type ProposeMonthResult } from "@/lib/ai/schedule";

/** Month proposals for the content calendar of the active business. */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function message(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

export async function proposeMonthAction(month: string): Promise<Result<ProposeMonthResult>> {
  const ctx = await requireBusinessContext("/business/content");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager", "member"]);
    const data = await proposeMonth(ctx.activeBusiness.id, month.trim());
    revalidatePath("/business/content");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: message(e, "Could not plan the month.") };
  }
}

export async function approveAllAction(month: string): Promise<Result<{ approved: number }>> {
  const ctx = await requireBusinessContext("/business/content");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
    const approved = await approveAll(ctx.activeBusiness.id, month.trim());
    revalidatePath("/business/content");
    return { ok: true, data: { approved } };
  } catch (e) {
    return { ok: false, error: message(e, "Could not approve the month.") };
  }
}

export async function movePostAction(postId: string, when: string): Promise<Result> {
  const ctx = await requireBusinessContext("/business/content");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager", "member"]);
    const moved = await moveCalendarPost(postId, ctx.activeBusiness.id, when);
    if (!moved) return { ok: false, error: "Post not found, or it is already published." };
    revalidatePath("/business/content");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Could not move the post.") };
  }
}

const MEDIA_URL_MAX = 500;

/**
 * Swap the media on a post: the uploaded file becomes media_urls[0] and the
 * thumbnail. Published posts keep what went out.
 */
export async function replacePostMediaAction(postId: string, url: string): Promise<Result> {
  const ctx = await requireBusinessContext("/business/content");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager", "member"]);
    const clean = url.trim();
    if (!clean || clean.length > MEDIA_URL_MAX) return { ok: false, error: "That upload did not come back with a usable link." };
    const row = await sqlOne<{ id: string }>(
      `update calendar_posts
          set media_urls = array[$3::text] || media_urls[2:], thumbnail_url = $3
        where id = $1 and business_id = $2 and status <> 'published' returning id`,
      [postId, ctx.activeBusiness.id, clean],
    );
    if (!row) return { ok: false, error: "Post not found, or it is already published." };
    revalidatePath("/business/content");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Could not replace the media.") };
  }
}

/** Title and caption edits from the post row. `copy` follows the caption so older screens agree. */
export async function editPostAction(postId: string, input: { title: string; caption: string }): Promise<Result> {
  const ctx = await requireBusinessContext("/business/content");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager", "member"]);
    const title = input.title.trim().slice(0, 200);
    if (!title) return { ok: false, error: "Give the post a short title." };
    const caption = input.caption.trim().slice(0, 4000);
    const row = await sqlOne<{ id: string }>(
      `update calendar_posts set title = $3, caption = nullif($4, ''), copy = nullif($4, '')
        where id = $1 and business_id = $2 returning id`,
      [postId, ctx.activeBusiness.id, title, caption],
    );
    if (!row) return { ok: false, error: "Post not found." };
    revalidatePath("/business/content");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Could not save the post.") };
  }
}

/**
 * Put an approved post on the schedule at `when` (or its planned time when
 * `when` is empty). Only approved posts can be scheduled.
 */
export async function schedulePostAction(postId: string, when: string): Promise<Result> {
  const ctx = await requireBusinessContext("/business/content");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager", "member"]);
    const at = when.trim() ? new Date(when) : null;
    if (at && Number.isNaN(at.getTime())) return { ok: false, error: "That is not a valid date." };
    const row = await sqlOne<{ id: string }>(
      `update calendar_posts
          set scheduled_for = coalesce($3::timestamptz, scheduled_for, recommended_time), status = 'scheduled'
        where id = $1 and business_id = $2 and status = 'approved'
          and coalesce($3::timestamptz, scheduled_for, recommended_time) is not null
        returning id`,
      [postId, ctx.activeBusiness.id, at],
    );
    if (!row) return { ok: false, error: "Approve the post and give it a date first." };
    revalidatePath("/business/content");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Could not schedule the post.") };
  }
}
