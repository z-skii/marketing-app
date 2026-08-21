import "server-only";
import Stripe from "stripe";
import { SITE_NAME, SITE_URL } from "@/config/site";

/**
 * Stripe Checkout in test mode.
 *
 * Checkout is used rather than a bespoke Payment Element flow: it is hosted,
 * PCI-scoped by Stripe, and handles 3D Secure and wallets without us owning any
 * card surface. Credit is only ever granted by the verified webhook.
 */

let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  if (!client) client = new Stripe(key, { apiVersion: "2025-10-29.clover" });
  return client;
}

export const TOP_UP_PRESETS_CENTS = [1000, 2500, 5000, 10000];

export async function createTopUpSession(input: {
  userId: string;
  amountCents: number;
  metadata?: Record<string, string>;
}): Promise<{ url: string; id: string }> {
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    // Stripe's own idempotency plus our unique session id keeps replays safe.
    client_reference_id: input.userId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: input.amountCents,
          product_data: {
            name: `${SITE_NAME} credit`,
            description: "Prepaid credit for placements on the board.",
          },
        },
      },
    ],
    success_url: `${SITE_URL}/dashboard?topup=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/dashboard?topup=cancelled`,
    metadata: { user_id: input.userId, ...input.metadata },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { url: session.url, id: session.id };
}
