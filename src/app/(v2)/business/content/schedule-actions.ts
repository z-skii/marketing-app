"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import {
  approveDeliverable, markPublished, rejectDeliverable, requestEdit, scheduleDeliverable,
  type Deliverable, type DeliverableFormat,
} from "@/lib/business/deliverables";

/**
 * What a business does with the files its shoot delivered: approve, ask
 * for an edit, put one on the calendar, mark it published. Every action
 * checks membership of the active business; the library checks the file
 * belongs to that business.
 */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const MANAGE = ["owner", "manager", "member"];

function message(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

async function member(roles = MANAGE) {
  const ctx = await requireBusinessContext("/business/content");
  await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, roles);
  return ctx.activeBusiness.id;
}

function done<T>(data: T): Result<T> {
  revalidatePath("/business/content");
  revalidatePath("/business/content/shoots");
  return { ok: true, data };
}

export async function approveDeliverableAction(id: string): Promise<Result<Deliverable>> {
  try {
    const businessId = await member();
    return done(await approveDeliverable(id, businessId));
  } catch (e) {
    return { ok: false, error: message(e, "Could not approve that file.") };
  }
}

export async function rejectDeliverableAction(id: string): Promise<Result<Deliverable>> {
  try {
    const businessId = await member();
    return done(await rejectDeliverable(id, businessId));
  } catch (e) {
    return { ok: false, error: message(e, "Could not set that file aside.") };
  }
}

export async function requestEditAction(id: string, note: string): Promise<Result<Deliverable>> {
  try {
    const businessId = await member();
    return done(await requestEdit(id, businessId, note));
  } catch (e) {
    return { ok: false, error: message(e, "Could not send the edit request.") };
  }
}

/** `when` is "YYYY-MM-DDTHH:MM" in the business time zone (or a full ISO instant). */
export async function scheduleDeliverableAction(
  id: string,
  when: string,
  platform: string,
  format: DeliverableFormat,
): Promise<Result<Deliverable>> {
  try {
    const businessId = await member();
    return done(await scheduleDeliverable(id, businessId, when, platform, format));
  } catch (e) {
    return { ok: false, error: message(e, "Could not schedule that file.") };
  }
}

export async function markPublishedAction(id: string): Promise<Result<Deliverable>> {
  try {
    const businessId = await member();
    return done(await markPublished(id, businessId));
  } catch (e) {
    return { ok: false, error: message(e, "Could not mark that post published.") };
  }
}
