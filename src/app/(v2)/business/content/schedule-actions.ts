"use server";

import { revalidatePath } from "next/cache";
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
