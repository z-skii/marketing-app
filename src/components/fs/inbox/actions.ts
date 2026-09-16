"use server";

import { sql } from "@/lib/db";
import { requireOnboarded } from "@/lib/v2/core";

/**
 * Marks every notification read without re-rendering the open screen, so
 * what was new stays marked until the person leaves. The shell's unread
 * count catches up on the next navigation.
 */
export async function markNotificationsSeen(): Promise<{ ok: boolean }> {
  const ctx = await requireOnboarded();
  await sql(`update notifications set read_at = now() where profile_id = $1 and read_at is null`, [ctx.user.id]);
  return { ok: true };
}
