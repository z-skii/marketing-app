import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { sql, sqlOne } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";

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
      await handleCompletedCheckout(event);
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

  for (const type of ["board", "spot", "bar"] as const) {
    const cents = Number(session.metadata?.[`${type}_cents`] ?? 0);
    if (cents > 0) {
      await sql(`select allocate_to_placement($1,$2,$3::placement_type,$4)`,
        [userId, linkId, type, cents]);
    }
  }
}
