import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { sql, sqlOne } from "@/lib/db";
import { refreshSurfaces } from "@/lib/surfaces";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { activateSubscription, setSubscriptionStatus } from "@/lib/v2/subscriptions";
import type { PlanKey } from "@/config/plans";

/**
 * Stripe webhook — the only place credit is ever granted.
 *
 * The signature is verified before anything is read, and the grant itself is
 * idempotent in the database: apply_stripe_topup claims the Checkout session id
 * with a unique constraint, so a replayed event returns false and adds nothing.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    // Never trust an unverified body.
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.metadata?.kind === "subscription") {
        await handleSubscriptionCheckout(session);
      } else {
        await handleCompletedCheckout(event);
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
    }
  } catch (error) {
    console.error("stripe webhook failed", event.id, error);
    // A 500 asks Stripe to retry; the operation is safe to repeat.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCompletedCheckout(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") return;

  const userId = session.metadata?.user_id ?? session.client_reference_id;
  const amount = session.amount_total;
  if (!userId || !amount || amount <= 0) return;

  const applied = await sqlOne<{ apply_stripe_topup: boolean }>(
    `select apply_stripe_topup($1, $2, $3, $4, $5)`,
    [
      userId,
      session.id,
      typeof session.payment_intent === "string" ? session.payment_intent : null,
      amount,
      event.id,
    ],
  );

  // A replay stops here: the credit already exists and the allocations already ran.
  if (!applied?.apply_stripe_topup) return;

  const linkId = session.metadata?.link_id;
  if (!linkId) return;

  const funded: string[] = [];
  for (const type of ["board", "spot", "bar"] as const) {
    const cents = Number(session.metadata?.[`${type}_cents`] ?? 0);
    if (cents > 0) {
      await sql(`select allocate_to_placement($1,$2,$3::placement_type,$4)`,
        [userId, linkId, type, cents]);
      funded.push(type);
    }
  }
  await refreshSurfaces(funded);
}

// ------------------------------------------------------------ subscriptions

/** Stripe API versions from 2025 keep the period on the subscription item. */
function periodEnd(subscription: Stripe.Subscription): Date | null {
  const legacy = (subscription as unknown as { current_period_end?: number }).current_period_end;
  const seconds = legacy ?? subscription.items?.data?.[0]?.current_period_end ?? null;
  return seconds ? new Date(seconds * 1000) : null;
}

function mapStatus(status: Stripe.Subscription.Status): "trialing" | "active" | "past_due" | "cancelled" {
  switch (status) {
    case "trialing": return "trialing";
    case "active": return "active";
    case "past_due": case "unpaid": case "incomplete": return "past_due";
    default: return "cancelled"; // canceled, incomplete_expired, paused
  }
}

/** A plan checkout finished: the business's plan row becomes active. */
async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
  const businessId = session.metadata?.business_id;
  const plan = session.metadata?.plan as PlanKey | undefined;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  if (!businessId || (plan !== "essential" && plan !== "growth") || !subscriptionId) return;

  const subscription = await stripe().subscriptions.retrieve(subscriptionId);
  await activateSubscription({
    businessId,
    plan,
    billing: "stripe",
    stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
    stripeSubscriptionId: subscription.id,
    periodEnd: periodEnd(subscription),
  });
}

/** Renewals, failed payments and cancellations flow into the same row. */
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  await setSubscriptionStatus(subscription.id, mapStatus(subscription.status), periodEnd(subscription));
}
