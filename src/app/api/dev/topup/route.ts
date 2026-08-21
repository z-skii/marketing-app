import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { sqlOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { devAuthEnabled } from "@/lib/supabase";

/**
 * DEVELOPMENT ONLY.
 *
 * Grants credit through the same ledgered function Stripe uses, so the funded
 * flows can be exercised without a payment provider. It is unreachable unless
 * AUTH_DEV_MODE=true and the build is not production.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!devAuthEnabled()) {
    return NextResponse.json({ error: "not available" }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "sign in first" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const amount = Math.trunc(Number(body.amountCents ?? 2500));
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100_000) {
    return NextResponse.json({ error: "invalid amount" }, { status: 400 });
  }

  await sqlOne(`select apply_stripe_topup($1,$2,$3,$4)`, [
    user.id, `cs_dev_${randomUUID()}`, "pi_dev", amount,
  ]);

  return NextResponse.json({ ok: true, amountCents: amount });
}
