"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBusinessMember, requireOnboarded } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { devAuthEnabled } from "@/lib/supabase";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import {
  activateSubscription, cancelSubscription, createSubscriptionCheckout, isSubscriptionBillingConfigured,
} from "@/lib/v2/subscriptions";
import { PLAN_BY_KEY, type PlanKey } from "@/config/plans";

/**
 * Picking a plan. With Stripe subscription prices configured the owner goes
 * to Checkout and the webhook activates the row. In development (the same
 * flag that enables password sign-in) the plan activates without a card and
 * the page says so. Otherwise the button explains that billing is not
 * connected yet, nothing is faked.
 */

type Result = { ok: boolean; error?: string };
const fail = (error: string): Result => ({ ok: false, error });

export async function choosePlan(businessId: string, plan: PlanKey): Promise<Result> {
  const ctx = await requireOnboarded();
  if (!PLAN_BY_KEY[plan]) return fail("Pick Essential or Growth.");
  try {
    await requireBusinessMember(ctx.user.id, businessId, ["owner"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Only the owner can change the plan.");
  }

  if (isSubscriptionBillingConfigured()) {
    let url: string;
    try {
      ({ url } = await createSubscriptionCheckout({ businessId, userId: ctx.user.id, plan }));
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Checkout could not start.");
    }
    redirect(url);
  }

  if (devAuthEnabled()) {
    await activateSubscription({ businessId, plan, billing: "dev", periodEnd: new Date(Date.now() + 30 * 86400_000) });
    revalidatePath("/business");
    revalidatePath("/business/plan");
    redirect("/business/plan?activated=dev");
  }

  return fail("Billing isn't connected yet. Plans go live when Stripe subscription prices are configured.");
}

export async function cancelPlan(businessId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, businessId, ["owner"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Only the owner can change the plan.");
  }
  // A Stripe-billed plan is cancelled at Stripe too; the webhook echoes the status back.
  const row = await sqlOne<{ billing: string; stripe_subscription_id: string | null }>(
    `select billing, stripe_subscription_id from business_subscriptions where business_id = $1`,
    [businessId],
  );
  if (row?.billing === "stripe" && row.stripe_subscription_id && isStripeConfigured()) {
    try {
      await stripe().subscriptions.cancel(row.stripe_subscription_id);
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Stripe could not cancel the subscription.");
    }
  }
  await cancelSubscription(businessId);
  revalidatePath("/business");
  revalidatePath("/business/plan");
  return { ok: true };
}
