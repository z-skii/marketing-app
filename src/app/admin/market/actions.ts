"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { sql, sqlOne, transaction } from "@/lib/db";
import { notify } from "@/lib/v2/core";
import { confirmInstagramManually } from "@/lib/v2/instagram";
import { clearSettingsCache } from "@/lib/settings";

/** Marketplace admin: verifications, Instagram handles, reports, payouts, platform fee. */

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
    { body: approve ? "The verified mark shows on your profile." : note.trim().slice(0, 200) || undefined, href: "/me/creator" });
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
      { body: approve ? "Businesses see the mark when you apply." : note.trim().slice(0, 200) || undefined, href: `/me/vehicles/${vehicleId}` });
  }
  revalidatePath("/admin/market");
  revalidatePath(`/me/vehicles/${vehicleId}`);
  return { ok: true };
}

/** A person checked the business is real. Sets the state and tells the owner. */
export async function decideBusinessVerification(
  businessId: string,
  approve: boolean,
  note: string,
): Promise<Result> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, error: "Admin only." };
  const business = await sqlOne<{ owner_id: string; name: string }>(
    `update businesses set verification = $2::verification_state, updated_at = now()
      where id = $1 returning owner_id, name`,
    [businessId, approve ? "verified" : "rejected"],
  );
  if (!business) return { ok: false, error: "Business not found." };
  await notify(business.owner_id, "system",
    approve ? `${business.name} is a verified business` : `${business.name} wasn't verified`,
    { body: approve ? "The mark shows on your campaigns and your public page." : note.trim().slice(0, 200) || "Check the details on your business page and ask again.", href: "/business" });
  revalidatePath("/admin/market");
  revalidatePath("/business");
  return { ok: true };
}

/** A person looked at the handle. Confirm marks it connected; reject marks it error. */
export async function decideInstagramHandle(profileId: string, confirm: boolean): Promise<Result> {
  const admin = await requireAdmin().catch(() => null);
  if (!admin) return { ok: false, error: "Admin only." };
  const row = await sqlOne<{ handle: string | null; status: string }>(
    `select handle, status::text as status from social_accounts where profile_id = $1 and provider = 'instagram'`,
    [profileId],
  );
  if (!row || row.status !== "pending") return { ok: false, error: "Nothing pending for this person." };
  if (confirm) {
    await confirmInstagramManually(profileId);
  } else {
    await sql(
      `update social_accounts set status = 'error', updated_at = now()
        where profile_id = $1 and provider = 'instagram'`,
      [profileId],
    );
  }
  await notify(profileId, "system",
    confirm ? `Instagram @${row.handle} is confirmed` : `Instagram @${row.handle} could not be confirmed`,
    { body: confirm ? "Story campaigns are open to you." : "Check the handle and add it again.", href: "/me/instagram" });
  revalidatePath("/admin/market");
  revalidatePath("/me/instagram");
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
      { href: "/earnings" });
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
