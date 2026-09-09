"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { sql, sqlOne, transaction } from "@/lib/db";
import { notify } from "@/lib/v2/core";
import { clearSettingsCache } from "@/lib/settings";

/** Marketplace admin: verifications, reports, payouts, platform fee. */

type Result = { ok: boolean; error?: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Admin only.");
  return user;
}

export async function decideCreatorVerification(
  profileId: string,
  approve: boolean,
  note: string,
): Promise<Result> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, error: "Admin only." };
  await sql(
    `update creator_profiles
        set verification = $2::verification_state, verification_note = nullif($3, ''),
            verified_at = case when $2 = 'verified' then now() end
      where profile_id = $1`,
    [profileId, approve ? "verified" : "rejected", note.trim().slice(0, 500)],
  );
  await notify(profileId, "system",
    approve ? "You're a verified creator now" : "Creator verification wasn't approved",
    { body: approve ? "Verified-only jobs are open to you." : note.trim().slice(0, 200) || undefined, href: "/me/creator" });
  revalidatePath("/admin/market");
  return { ok: true };
}

export async function decideVehicleVerification(
  vehicleId: string,
  approve: boolean,
  note: string,
): Promise<Result> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, error: "Admin only." };
  const vehicle = await sqlOne<{ owner_id: string }>(
    `update vehicles
        set verification = $2::verification_state, verification_note = nullif($3, '')
      where id = $1 returning owner_id`,
    [vehicleId, approve ? "verified" : "rejected", note.trim().slice(0, 500)],
  );
  if (vehicle) {
    await notify(vehicle.owner_id, "system",
      approve ? "Your vehicle is verified" : "Vehicle verification wasn't approved",
      { href: `/cars/${vehicleId}` });
  }
  revalidatePath("/admin/market");
  return { ok: true };
}

export async function resolveReport(reportId: string, dismiss: boolean): Promise<Result> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, error: "Admin only." };
  await sql(
    `update reports set status = $2::report_status, resolved_by = $3, resolved_at = now()
      where id = $1`,
    [reportId, dismiss ? "dismissed" : "resolved", admin.id],
  );
  revalidatePath("/admin/market");
  return { ok: true };
}

export async function decidePayout(payoutId: string, approve: boolean): Promise<Result> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, error: "Admin only." };

  await transaction(async (client) => {
    const payout = await client.query(
      `select creator_user_id, status from payout_requests where id = $1 for update`,
      [payoutId],
    );
    if (payout.rows.length === 0 || payout.rows[0].status !== "requested") {
      throw new Error("Already handled.");
    }
    const userId = payout.rows[0].creator_user_id as string;
    await client.query(
      `update payout_requests set status = $2::payout_status, processed_at = now() where id = $1`,
      [payoutId, approve ? "paid" : "rejected"],
    );
    // V2 earnings ride along: requested rows settle or go back to available.
    await client.query(
      `update earnings set status = $2::earning_status
        where profile_id = $1 and status = 'requested'`,
      [userId, approve ? "paid" : "available"],
    );
  }).catch((e) => {
    return Promise.reject(e);
  });

  const payout = await sqlOne<{ creator_user_id: string; amount_cents: string }>(
    `select creator_user_id, amount_cents::text as amount_cents from payout_requests where id = $1`,
    [payoutId],
  );
  if (payout) {
    await notify(payout.creator_user_id, "payout",
      approve ? "Payout sent" : "Payout request rejected",
      { href: "/wallet" });
  }
  revalidatePath("/admin/market");
  return { ok: true };
}

export async function setPlatformFee(pct: number): Promise<Result> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, error: "Admin only." };
  const clean = Math.min(Math.max(Math.round(pct), 0), 50);
  await sql(
    `insert into app_settings (key, value, updated_at) values ('platform_fee_pct', $1::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [JSON.stringify(clean)],
  );
  clearSettingsCache();
  revalidatePath("/admin/market");
  return { ok: true };
}
