import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCredit } from "@/lib/money";
import { Money } from "@/components/v2/ui";
import { TopUpForm } from "./TopUpForm";

export const metadata = { title: "Add credit" };
export const dynamic = "force-dynamic";

/** In-app Stripe top-up — the wallet never bounces you to another screen. */
export default async function AddCreditPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

  const [wallet, settings] = await Promise.all([
    sqlOne<{ cents: string }>(
      `select available_credit_cents::text as cents from wallets where user_id = $1`,
      [ctx.user.id],
    ),
    getSettings(),
  ]);

  return (
    <main id="main" className="mx-auto w-full max-w-md px-4 py-5 md:py-8">
      <BackButton fallback="/wallet" label="Wallet" />
      <h1 className="mt-2 font-display text-2xl font-900 tracking-[-0.03em]">Add credit</h1>
      <p className="mt-1 text-sm text-ink-faint">
        Credit funds everything you spend on TapMart — campaign approvals, car
        ads, and the board. Current balance:{" "}
        <Money cents={Number(wallet?.cents ?? 0)} />
      </p>
      <TopUpForm
        minCents={Number(settings.minimum_topup_cents ?? "500")}
        maxCents={Number(settings.maximum_topup_cents ?? "100000")}
      />
      <p className="mt-3 font-mono text-[0.625rem] text-ink-faint">
        Checkout is handled by Stripe. Minimum {formatCredit(Number(settings.minimum_topup_cents ?? "500"))},
        maximum {formatCredit(Number(settings.maximum_topup_cents ?? "100000"))} per top-up.
      </p>
    </main>
  );
}
