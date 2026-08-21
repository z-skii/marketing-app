"use server";

import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { settingInt } from "@/lib/settings";

export type PayoutResult = { ok: true } | { ok: false; error: string };

/**
 * Requests a payout of cleared earnings. Nothing is sent automatically — a
 * request is queued for an admin, because no payout rail is connected yet.
 */
export async function requestPayout(): Promise<PayoutResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const minimum = await settingInt("minimum_payout_cents");

  const row = await sqlOne<{ available: string }>(
    `select coalesce(sum(amount_cents),0)::text as available
       from creator_earnings where creator_user_id = $1 and status = 'available'`,
    [user.id],
  );
  const available = Number(row?.available ?? 0);

  if (available < minimum) {
    return { ok: false, error: `You need at least $${(minimum / 100).toFixed(0)} available.` };
  }

  const open = await sqlOne(
    `select 1 from payout_requests where creator_user_id = $1 and status in ('requested','approved')`,
    [user.id],
  );
  if (open) return { ok: false, error: "You already have a payout in progress." };

  await sql(
    `insert into payout_requests (creator_user_id, amount_cents) values ($1, $2)`,
    [user.id, available],
  );

  revalidatePath("/earn");
  return { ok: true };
}
