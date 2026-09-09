import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCredit } from "@/lib/money";
import { Money, ScreenHeader, SectionTitle, Stat, StatusChip } from "@/components/v2/ui";
import { PayoutButton } from "./PayoutButton";

export const metadata = { title: "Wallet" };
export const dynamic = "force-dynamic";

/**
 * One wallet, two sides of the marketplace: money you can spend on marketing
 * (credit) and money you've earned doing work (earnings, then payouts). All
 * numbers come from the ledger; nothing is computed client-side.
 */
export default async function WalletPage({
  searchParams,
}: { searchParams: Promise<{ topup?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;

  const [credit, earningSums, earningsRows, payouts, settings] = await Promise.all([
    sqlOne<{ cents: string }>(
      `select available_credit_cents::text as cents from wallets where user_id = $1`,
      [ctx.user.id],
    ),
    sqlOne<{ available: string; requested: string; lifetime: string }>(
      `select
         coalesce(sum(amount_cents) filter (where status = 'available'), 0)::text as available,
         coalesce(sum(amount_cents) filter (where status = 'requested'), 0)::text as requested,
         coalesce(sum(amount_cents) filter (where status in ('available', 'requested', 'paid')), 0)::text as lifetime
       from earnings where profile_id = $1`,
      [ctx.user.id],
    ),
    sql<{ amount_cents: number; fee_cents: number; source: string; status: string; created_at: string }>(
      `select amount_cents::int as amount_cents, fee_cents::int as fee_cents, source,
              status::text as status, created_at
         from earnings where profile_id = $1 order by created_at desc limit 30`,
      [ctx.user.id],
    ),
    sql<{ amount_cents: number; status: string; created_at: string }>(
      `select amount_cents::int as amount_cents, status::text as status, created_at
         from payout_requests where creator_user_id = $1 order by created_at desc limit 10`,
      [ctx.user.id],
    ),
    getSettings(),
  ]);

  const available = Number(earningSums?.available ?? 0);
  const requested = Number(earningSums?.requested ?? 0);
  const lifetime = Number(earningSums?.lifetime ?? 0);
  const creditCents = Number(credit?.cents ?? 0);
  const minPayout = Number(settings.minimum_payout_cents ?? "2500");
  const feePct = Number(settings.platform_fee_pct ?? "15");

  const SOURCE_LABEL: Record<string, string> = {
    submission: "Approved work", booking: "Car ad", adjustment: "Adjustment",
  };

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader title="Wallet" kicker="Earnings, credit, payouts" unread={ctx.unreadNotifications} showSearch={false} />

      {params.topup === "success" && (
        <p role="alert" className="card-2 mt-5 p-4 text-sm text-ink-soft">
          <span className="font-display font-700 text-rise">Payment received.</span>{" "}
          The credit lands in a few seconds. Refresh if you don&apos;t see it yet.
        </p>
      )}
      {params.topup === "cancelled" && (
        <p role="alert" className="card-2 mt-5 p-4 text-sm text-ink-soft">
          Checkout cancelled. Nothing was charged.
        </p>
      )}

      <section className="card mt-5 p-5" aria-label="Earnings available to pay out">
        <p className="text-sm text-ink-soft">Available to pay out</p>
        <p className="mt-2"><Money cents={available} size="hero" /></p>
        {requested > 0 && (
          <p className="mt-2 text-sm text-ink-faint">Plus {formatCredit(requested)} already requested.</p>
        )}
        <div className="mt-5">
          <PayoutButton availableCents={available} minCents={minPayout} />
        </div>
        <p className="mt-3 text-sm text-ink-faint">
          Minimum payout {formatCredit(minPayout)}. TapMart&apos;s platform fee ({feePct}%)
          is already taken out of the amounts shown.
        </p>
      </section>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr]">
        <section className="card flex items-center justify-between gap-4 p-5" aria-label="Marketing credit">
          <div className="min-w-0">
            <p className="text-sm text-ink-soft">Marketing credit</p>
            <p className="mt-2"><Money cents={creditCents} size="lg" /></p>
            <p className="mt-2 text-sm text-ink-faint">Funds campaign approvals and car ads.</p>
          </div>
          <Link href="/wallet/add" className="btn shrink-0">Add credit</Link>
        </section>
        <section className="card p-5" aria-label="Lifetime earned">
          <Stat value={formatCredit(lifetime)} label="Lifetime earned" sub="Everything approved and paid so far" />
        </section>
      </div>

      <section className="mt-8">
        <SectionTitle count={earningsRows.length}>Earnings</SectionTitle>
        {earningsRows.length === 0 && (
          <div className="card-2 mt-3 p-4 text-sm text-ink-soft">
            Approved work and car ad payments land here.{" "}
            <Link href="/jobs" className="font-display font-600 text-signal">Find a job →</Link>
          </div>
        )}
        <ul className="row-list mt-3">
          {earningsRows.map((e, i) => (
            <li key={i} className="card-2 flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[0.9375rem] font-700">{SOURCE_LABEL[e.source] ?? e.source}</span>
                <span className="block text-sm text-ink-faint">
                  {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </span>
              <StatusChip status={e.status} />
              <Money cents={e.amount_cents} size="sm" />
            </li>
          ))}
        </ul>
      </section>

      {payouts.length > 0 && (
        <section className="mt-8">
          <SectionTitle count={payouts.length}>Payouts</SectionTitle>
          <ul className="row-list mt-3">
            {payouts.map((p, i) => (
              <li key={i} className="card-2 flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[0.9375rem] font-700">Payout</span>
                  <span className="block text-sm text-ink-faint">
                    {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </span>
                <StatusChip status={p.status} />
                <Money cents={p.amount_cents} size="sm" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
