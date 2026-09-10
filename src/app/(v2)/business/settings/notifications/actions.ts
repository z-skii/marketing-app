"use server";

import { revalidatePath } from "next/cache";
import { requireV2 } from "@/lib/v2/core";
import { setNotificationPref } from "@/lib/v2/notification-prefs";

export async function toggleNotification(key: string, on: boolean): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireV2("/business/settings/notifications");
  try {
    await setNotificationPref(ctx.user.id, key, on);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/business/settings/notifications");
  revalidatePath("/business/settings");
  return { ok: true };
}
