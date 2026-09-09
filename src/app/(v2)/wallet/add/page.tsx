import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCredit } from "@/lib/money";
import { Money } from "@/components/v2/ui";
import { TopUpForm } from "./TopUpForm";

export const metadata = { title: "Add credit" };
export const dynamic = "force-dynamic";

/** In-app Stripe top-up: the wallet never bounces you to another screen. */
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

  const minCents = Number(settings.minimum_topup_cents ?? "500");
  const maxCents = Number(settings.maximum_topup_cents ?? "100000");

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/wallet" label="Wallet" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Add credit</h1>
      <p className="mt-1 text-[0.9375rem] text-ink-soft">
        Credit funds everything you spend on TapMart: campaign approvals, car
        ads, and the board.
      </p>
      <div className="card mt-5 flex items-center justify-between gap-4 p-4">
        <span className="text-sm text-ink-soft">Current balance</span>
        <Money cents={Number(wallet?.cents ?? 0)} size="lg" />
      </div>
      <TopUpForm minCents={minCents} maxCents={maxCents} />
      <p className="mt-4 text-sm text-ink-faint">
        Checkout is handled by Stripe. Minimum {formatCredit(minCents)},
        maximum {formatCredit(maxCents)} per top-up.
      </p>
    </main>
  );
}
