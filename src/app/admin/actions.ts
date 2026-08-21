"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { clearSettingsCache, SETTING_KEYS } from "@/lib/settings";

export type AdminResult = { ok: true } | { ok: false; error: string };

async function admin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

async function audit(adminId: string, action: string, targetType: string, targetId: string | null, meta: object = {}) {
  await sql(
    `insert into admin_audit_log (admin_user_id, action, target_type, target_id, metadata)
     values ($1,$2,$3,$4,$5)`,
    [adminId, action, targetType, targetId, JSON.stringify(meta)],
  );
}

/** Approve, reject or suspend a link. Placements activate only on approval. */
export async function moderateLink(
  linkId: string,
  status: "approved" | "rejected" | "suspended",
  note?: string,
): Promise<AdminResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };

  await sql(
    `update links set moderation_status = $2::moderation_status, moderation_note = $3, updated_at = now()
      where id = $1`,
    [linkId, status, note ?? null],
  );

  if (status === "approved") {
    // Funded placements go live the moment moderation clears.
    await sql(
      `update placements set status = 'active',
                             activated_at = coalesce(activated_at, now()),
                             updated_at = now()
        where link_id = $1 and remaining_credit_cents > 0 and status = 'pending'`,
      [linkId],
    );
  } else {
    await sql(
      `update placements set status = 'paused', updated_at = now()
        where link_id = $1 and status = 'active'`,
      [linkId],
    );
  }

  await sql(`select bar_sync()`);
  await audit(user.id, `link_${status}`, "link", linkId, { note });
  revalidatePath("/admin");
  return { ok: true };
}

export async function blockDomain(domain: string, reason: string): Promise<AdminResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };
  const clean = domain.trim().toLowerCase().replace(/^www\./, "");
  if (!clean.includes(".")) return { ok: false, error: "That isn't a domain." };

  await sql(
    `insert into blocked_domains (domain, reason) values ($1,$2) on conflict (domain) do nothing`,
    [clean, reason],
  );
  await sql(
    `update links set moderation_status = 'suspended', updated_at = now() where domain = $1`, [clean],
  );
  await sql(`select bar_sync()`);
  await audit(user.id, "block_domain", "domain", null, { domain: clean, reason });
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateSetting(key: string, value: string): Promise<AdminResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };
  if (!SETTING_KEYS.includes(key)) return { ok: false, error: "Unknown setting." };

  const isBool = value === "true" || value === "false";
  if (!isBool && !/^\d+$/.test(value)) return { ok: false, error: "Value must be a number or true/false." };

  await sql(
    `insert into app_settings (key, value, updated_at) values ($1, $2::jsonb, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [key, JSON.stringify(isBool ? value === "true" : Number(value))],
  );
  clearSettingsCache();
  await audit(user.id, "update_setting", "setting", null, { key, value });
  revalidatePath("/admin");
  return { ok: true };
}

/** Manual credit correction. The reason is mandatory and is recorded twice. */
export async function adjustCredit(email: string, amountCents: number, reason: string): Promise<AdminResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };
  if (!reason.trim()) return { ok: false, error: "A reason is required." };
  if (!Number.isSafeInteger(amountCents) || amountCents === 0) {
    return { ok: false, error: "Enter a non-zero amount." };
  }

  const target = await sql<{ id: string }>(`select id from auth.users where email = $1`, [email.trim().toLowerCase()]);
  if (target.length === 0) return { ok: false, error: "No account with that email." };

  try {
    await sql(`select admin_adjust_credit($1,$2,$3,$4)`, [user.id, target[0].id, amountCents, reason]);
  } catch {
    return { ok: false, error: "That adjustment was refused." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function resolvePayout(id: string, status: "paid" | "rejected"): Promise<AdminResult> {
  const user = await admin();
  if (!user) return { ok: false, error: "Not allowed." };

  await sql(`update payout_requests set status = $2::payout_status, processed_at = now() where id = $1`, [id, status]);
  if (status === "paid") {
    await sql(
      `update creator_earnings set status = 'paid'
        where creator_user_id = (select creator_user_id from payout_requests where id = $1)
          and status = 'available'`,
      [id],
    );
  }
  await audit(user.id, `payout_${status}`, "payout", id);
  revalidatePath("/admin");
  return { ok: true };
}
