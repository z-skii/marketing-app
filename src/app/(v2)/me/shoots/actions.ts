"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { addDeliverable, finishDelivery, type Deliverable } from "@/lib/business/deliverables";
import type { ContentShoot } from "@/lib/business/shoots";

/**
 * What the assigned creator does with a shoot: upload the files, then say
 * it is delivered. The library refuses anyone who is not the assigned
 * verified creator or an admin; these actions only translate that into a
 * plain message.
 */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const UUID = /^[0-9a-f-]{36}$/i;

function message(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message === "FORBIDDEN") return "You are not assigned to this shoot.";
  return e instanceof Error ? e.message : fallback;
}

export async function uploadDeliverableAction(
  shootId: string,
  input: { url: string; kind?: "photo" | "video"; thumbnailUrl?: string | null; caption?: string | null },
): Promise<Result<Deliverable>> {
  const user = await getCurrentUser();
  if (!user || user.suspended) return { ok: false, error: "Sign in first." };
  if (!UUID.test(shootId)) return { ok: false, error: "Shoot not found." };
  try {
    const data = await addDeliverable({
      shootId, uploadedBy: { id: user.id, role: user.role },
      kind: input.kind, url: input.url, thumbnailUrl: input.thumbnailUrl ?? null, caption: input.caption ?? null,
    });
    revalidatePath(`/me/shoots/${shootId}`);
    revalidatePath("/me/shoots");
    revalidatePath("/business/content");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: message(e, "Could not save that file.") };
  }
}

export async function finishDeliveryAction(shootId: string): Promise<Result<ContentShoot>> {
  const user = await getCurrentUser();
  if (!user || user.suspended) return { ok: false, error: "Sign in first." };
  if (!UUID.test(shootId)) return { ok: false, error: "Shoot not found." };
  try {
    const data = await finishDelivery(shootId, { id: user.id, role: user.role });
    revalidatePath(`/me/shoots/${shootId}`);
    revalidatePath("/me/shoots");
    revalidatePath("/business/content");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: message(e, "Could not mark the shoot delivered.") };
  }
}
