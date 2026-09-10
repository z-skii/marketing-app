"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { sqlOne } from "@/lib/db";
import { notify } from "@/lib/v2/core";
import {
  assignShootTo, getShoot, setShootStatus, type ContentShoot, type ShootStatus,
} from "@/lib/business/shoots";
import { addDeliverable, finishDelivery } from "@/lib/business/deliverables";

/**
 * Content shoot fulfilment is admin-assigned: an admin decides who goes
 * (a verified creator, or a label for someone outside the platform), marks
 * progress, and can attach delivered files on the creator's behalf. The
 * same admin check as the rest of /admin/market (profiles.role = 'admin').
 */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Admin only.");
  return user;
}

function message(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

async function businessOwnerOf(shoot: ContentShoot): Promise<{ owner_id: string; name: string } | null> {
  return sqlOne<{ owner_id: string; name: string }>(
    `select owner_id, name from businesses where id = $1`,
    [shoot.business_id],
  );
}

/**
 * Who is going. A platform assignee must be a verified creator (the library
 * refuses anyone else). `assigneeId` may be null with a label for someone
 * outside the platform.
 */
export async function assignShoot(
  shootId: string,
  assigneeId: string | null,
  label: string,
): Promise<Result<ContentShoot>> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, error: "Admin only." };
  try {
    const shoot = await assignShootTo(shootId, assigneeId, label);
    const business = await businessOwnerOf(shoot);
    if (business && (assigneeId || label.trim())) {
      await notify(business.owner_id, "system", `Your content shoot is booked`, {
        body: shoot.scheduled_for ? `Planned for ${shoot.scheduled_for}.` : undefined,
        href: "/business/content",
      });
    }
    if (assigneeId) {
      await notify(assigneeId, "system", `You are assigned to a content shoot`, {
        body: business ? `${business.name}${shoot.scheduled_for ? `, ${shoot.scheduled_for}` : ""}` : undefined,
        href: `/me/shoots/${shoot.id}`,
      });
    }
    revalidatePath("/admin/market");
    revalidatePath("/business/content");
    return { ok: true, data: shoot };
  } catch (e) {
    return { ok: false, error: message(e, "Could not assign the shoot.") };
  }
}

const STATUSES: ShootStatus[] = ["planned", "scheduled", "done", "cancelled"];

export async function setShootStatusAction(shootId: string, status: string): Promise<Result<ContentShoot>> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, error: "Admin only." };
  const next = STATUSES.find((s) => s === status);
  if (!next) return { ok: false, error: "Bad status." };
  try {
    const shoot = await setShootStatus(shootId, next, { userId: admin.id, isAdmin: true });
    revalidatePath("/admin/market");
    revalidatePath("/business/content");
    return { ok: true, data: shoot };
  } catch (e) {
    return { ok: false, error: message(e, "Could not update the shoot.") };
  }
}

/**
 * Attach delivered files as content_deliverables rows (uploaded by the
 * admin) and, when asked, mark the shoot delivered, which notifies the
 * business owner.
 */
export async function addShootDeliverables(
  shootId: string,
  businessId: string,
  urls: string[],
  markDone = false,
): Promise<Result<ContentShoot>> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, error: "Admin only." };
  try {
    let shoot = await getShoot(shootId, businessId);
    if (!shoot) return { ok: false, error: "Shoot not found." };
    const clean = Array.from(new Set(urls.map((u) => u.trim()).filter(Boolean))).slice(0, 200);
    for (const url of clean) {
      await addDeliverable({ shootId, uploadedBy: { id: admin.id, role: "admin" }, url });
    }
    if (markDone) shoot = await finishDelivery(shootId, { id: admin.id, role: "admin" });
    else shoot = (await getShoot(shootId, businessId)) ?? shoot;
    revalidatePath("/admin/market");
    revalidatePath("/business/content");
    return { ok: true, data: shoot };
  } catch (e) {
    return { ok: false, error: message(e, "Could not add the files.") };
  }
}
