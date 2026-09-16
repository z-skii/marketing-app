import "server-only";
import { sqlOne } from "@/lib/db";
import { settingInt } from "@/lib/settings";
import { isStripeConfigured } from "@/lib/stripe";

/**
 * What a business needs to know before it commits money: its campaign
 * credit, the platform fee that comes out of each payout, and the real
 * top-up limits. Every number comes from the database or settings; nothing
 * here is a constant baked into a screen.
 */
export type Funding = {
  walletCents: number;
  feePct: number;
  minTopUpCents: number;
  maxTopUpCents: number;
  stripeConfigured: boolean;
};

export async function loadFunding(businessId: string): Promise<Funding> {
  const [wallet, feePct, minTopUpCents, maxTopUpCents] = await Promise.all([
    sqlOne<{ cents: string }>(
      `select coalesce(w.available_credit_cents, 0)::text as cents from businesses b
         left join wallets w on w.user_id = b.owner_id where b.id = $1`,
      [businessId],
    ),
    settingInt("platform_fee_pct"),
    settingInt("minimum_topup_cents"),
    settingInt("maximum_topup_cents"),
  ]);
  return {
    walletCents: Number(wallet?.cents ?? 0),
    feePct: Math.min(Math.max(feePct, 0), 50),
    minTopUpCents,
    maxTopUpCents,
    stripeConfigured: isStripeConfigured(),
  };
}
