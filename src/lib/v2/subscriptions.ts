import "server-only";
import { sql, sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { PLANS, PLAN_BY_KEY, type PlanKey } from "@/config/plans";

/**
 * Business subscriptions: two plans, prices from settings, billing through
 * Stripe Checkout (subscription mode) when the price ids are configured.
 * Without them the product shows an honest "not connected to billing yet"
 * state; in development an admin-style dev activation exists so the rest of
 * the product can be exercised. Campaign spend is never part of the plan.
 */

export type Subscription = {
  plan: PlanKey;
  status: "trialing" | "active" | "past_due" | "cancelled";
  billing: "dev" | "stripe" | "manual";
  current_period_end: string | null;
};

export async function getSubscription(businessId: string): Promise<Subscription | null> {
  return sqlOne<Subscription>(
    `select plan, status, billing, current_period_end from business_subscriptions where business_id = $1`,
    [businessId],
  );
}

export async function planPrices(): Promise<Record<PlanKey, number>> {
  const s = await getSettings();
  return {
    essential: Number(s.plan_essential_cents ?? 9900),
    growth: Number(s.plan_growth_cents ?? 19900),
  };
}

export function stripePriceId(plan: PlanKey): string | null {
  return (plan === "essential" ? process.env.STRIPE_PRICE_ESSENTIAL : process.env.STRIPE_PRICE_GROWTH) ?? null;
}

/** Real billing exists only when Stripe and both price ids are configured. */
export function isSubscriptionBillingConfigured(): boolean {
  return isStripeConfigured() && PLANS.every((p) => Boolean(stripePriceId(p.key)));
}

export async function createSubscriptionCheckout(input: {
  businessId: string; userId: string; plan: PlanKey;
}): Promise<{ url: string }> {
  const price = stripePriceId(input.plan);
  if (!price) throw new Error("This plan isn't connected to billing yet.");
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    client_reference_id: input.userId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${SITE_URL}/business/plan?checkout=success`,
    cancel_url: `${SITE_URL}/business/plan?checkout=cancelled`,
    metadata: { kind: "subscription", business_id: input.businessId, plan: input.plan, user_id: input.userId },
    subscription_data: {
      metadata: { business_id: input.businessId, plan: input.plan },
      description: `${SITE_NAME} ${PLAN_BY_KEY[input.plan].name}`,
    },
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { url: session.url };
}

/** Webhook and dev paths both land here; the row is the single source of truth. */
export async function activateSubscription(input: {
  businessId: string; plan: PlanKey; billing: Subscription["billing"];
  stripeCustomerId?: string | null; stripeSubscriptionId?: string | null; periodEnd?: Date | null;
}) {
  await sql(
    `insert into business_subscriptions
       (business_id, plan, status, billing, stripe_customer_id, stripe_subscription_id, current_period_end)
     values ($1, $2, 'active', $3, $4, $5, $6)
     on conflict (business_id) do update
       set plan = excluded.plan, status = 'active', billing = excluded.billing,
           stripe_customer_id = coalesce(excluded.stripe_customer_id, business_subscriptions.stripe_customer_id),
           stripe_subscription_id = coalesce(excluded.stripe_subscription_id, business_subscriptions.stripe_subscription_id),
           current_period_end = excluded.current_period_end, updated_at = now()`,
    [input.businessId, input.plan, input.billing, input.stripeCustomerId ?? null,
     input.stripeSubscriptionId ?? null, input.periodEnd ?? null],
  );
}

export async function setSubscriptionStatus(stripeSubscriptionId: string, status: Subscription["status"], periodEnd: Date | null) {
  await sql(
    `update business_subscriptions set status = $2, current_period_end = $3, updated_at = now()
      where stripe_subscription_id = $1`,
    [stripeSubscriptionId, status, periodEnd],
  );
}

export async function cancelSubscription(businessId: string) {
  await sql(
    `update business_subscriptions set status = 'cancelled', updated_at = now() where business_id = $1`,
    [businessId],
  );
}
