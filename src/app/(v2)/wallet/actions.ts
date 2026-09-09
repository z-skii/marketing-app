"use server";

import { revalidatePath } from "next/cache";
import { transaction } from "@/lib/db";
import { requireOnboarded } from "@/lib/v2/core";
import { settingInt } from "@/lib/settings";
import { formatCredit } from "@/lib/money";

/**
 * Payout request over V2 earnings: locks the available earning rows, moves
 * them to 'requested', and opens a payout_requests row for the admin queue.
 * The database decides the amount — never the client.
 */
export async function requestPayout(): Promise<{ ok: boolean; error?: string; detail?: string }> {
  const ctx = await requireOnboarded();
  const minimum = await settingInt("minimum_payout_cents");

  try {
    const amount = await transaction(async (client) => {
      const rows = await client.query(
        `select id, amount_cents from earnings
          where profile_id = $1 and status = 'available' for update`,
        [ctx.user.id],
      );
      const total = rows.rows.reduce((sum, r) => sum + Number(r.amount_cents), 0);
      if (total < minimum) {
        throw new Error(`Minimum payout is ${formatCredit(minimum)}. You have ${formatCredit(total)} available.`);
      }
      await client.query(
        `update earnings set status = 'requested' where profile_id = $1 and status = 'available'`,
        [ctx.user.id],
      );
      await client.query(
        `insert into payout_requests (creator_user_id, amount_cents) values ($1, $2)`,
        [ctx.user.id, total],
      );
      return total;
    });
    revalidatePath("/wallet");
    return { ok: true, detail: `Payout of ${formatCredit(amount)} requested. An admin processes it shortly.` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Payout failed." };
  }
}
