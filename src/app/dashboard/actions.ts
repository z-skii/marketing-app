"use server";

import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { usernameSchema } from "@/lib/validation";
import { createTopUpSession, isStripeConfigured } from "@/lib/stripe";
import { settingInt } from "@/lib/settings";

export type ActionResult = { ok: true; redirect?: string } | { ok: false; error: string };

/** Move available credit into one of a link's placements. */
export async function addCredit(
  linkId: string,
  type: "board" | "spot" | "bar",
  amountCents: number,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    return { ok: false, error: "Enter an amount." };
  }

  const owned = await sqlOne(`select 1 from links where id = $1 and owner_id = $2`, [linkId, user.id]);
  if (!owned) return { ok: false, error: "That isn't your link." };

  const wallet = await sqlOne<{ available_credit_cents: string }>(
    `select available_credit_cents from wallets where user_id = $1`, [user.id],
  );
  const available = Number(wallet?.available_credit_cents ?? 0);

  if (available < amountCents) {
    if (!isStripeConfigured()) {
      return { ok: false, error: "Not enough available credit, and payments aren't configured yet." };
    }
    const session = await createTopUpSession({
      userId: user.id,
      amountCents: amountCents - available,
      metadata: {
        link_id: linkId,
        board_cents: type === "board" ? String(amountCents) : "0",
        spot_cents:  type === "spot"  ? String(amountCents) : "0",
        bar_cents:   type === "bar"   ? String(amountCents) : "0",
      },
    });
    return { ok: true, redirect: session.url };
  }

  try {
    await sql(`select allocate_to_placement($1,$2,$3::placement_type,$4)`,
      [user.id, linkId, type, amountCents]);
  } catch {
    return { ok: false, error: "That allocation didn't go through." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Buy credit without assigning it anywhere yet. */
export async function topUpWallet(amountCents: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const [min, max] = await Promise.all([
    settingInt("minimum_topup_cents"), settingInt("maximum_topup_cents"),
  ]);
  if (amountCents < min) return { ok: false, error: `The minimum top-up is $${(min / 100).toFixed(0)}.` };
  if (amountCents > max) return { ok: false, error: `The maximum top-up is $${(max / 100).toFixed(0)}.` };

  if (!isStripeConfigured()) {
    return { ok: false, error: "Payments aren't configured yet." };
  }

  const session = await createTopUpSession({ userId: user.id, amountCents });
  return { ok: true, redirect: session.url };
}

/** Pull unspent credit back out of a placement. */
export async function releaseCredit(placementId: string, amountCents: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };
  try {
    await sql(`select release_placement_credit($1,$2,$3)`, [user.id, placementId, amountCents]);
  } catch {
    return { ok: false, error: "That release didn't go through." };
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

export type UsernameResult = { ok: true; username: string } | { ok: false; error: string };

/**
 * Renames the signed-in member. Format and reserved names are validated here,
 * case-insensitive uniqueness is enforced by the database, and the update is
 * scoped to the authenticated user's own row — nobody can rename anyone else.
 */
export async function updateUsername(newUsername: string): Promise<UsernameResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const parsed = usernameSchema.safeParse(newUsername);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Pick a different username." };
  }
  if (parsed.data.toLowerCase() === user.username.toLowerCase() && parsed.data === user.username) {
    return { ok: true, username: parsed.data };
  }

  try {
    await sql(`update profiles set username = $2 where id = $1`, [user.id, parsed.data]);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "23505") return { ok: false, error: "That username is taken. Try another." };
    return { ok: false, error: "Username changes aren't ready yet. Try again in a few minutes." };
  }
  revalidatePath("/dashboard");
  return { ok: true, username: parsed.data };
}
