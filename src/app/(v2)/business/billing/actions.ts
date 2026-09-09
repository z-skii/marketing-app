"use server";

import { getCurrentUser } from "@/lib/auth";
import { settingInt } from "@/lib/settings";
import { createTopUpSession, isStripeConfigured } from "@/lib/stripe";

/**
 * Campaign credit top-up through Stripe Checkout. Same rules as the wallet
 * top-up it replaces: server-side limits from settings, credit is only ever
 * granted by the verified webhook, never here.
 */

export type TopUpResult = { ok: true; redirect: string } | { ok: false; error: string };

export async function topUpCampaignCredit(amountCents: number): Promise<TopUpResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const [min, max] = await Promise.all([
    settingInt("minimum_topup_cents"), settingInt("maximum_topup_cents"),
  ]);
  if (!Number.isInteger(amountCents)) return { ok: false, error: "Enter a whole dollar amount." };
  if (amountCents < min) return { ok: false, error: `The minimum top-up is $${(min / 100).toFixed(0)}.` };
  if (amountCents > max) return { ok: false, error: `The maximum top-up is $${(max / 100).toFixed(0)}.` };

  if (!isStripeConfigured()) {
    return { ok: false, error: "Payments aren't configured yet." };
  }

  const session = await createTopUpSession({ userId: user.id, amountCents });
  return { ok: true, redirect: session.url };
}
