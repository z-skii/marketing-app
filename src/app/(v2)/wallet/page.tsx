import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCredit } from "@/lib/money";
import { Money, SectionTitle, StatusChip } from "@/components/v2/ui";
import { PayoutButton } from "./PayoutButton";

export const metadata = { title: "Wallet" };
export const dynamic = "force-dynamic";

/**
 * One wallet, two sides of the marketplace: money you can spend on marketing
 * (credit) and money you've earned doing work (earnings → payouts). All
 * numbers come from the ledger — nothing is computed client-side.
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
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <h1 className="font-display text-2xl font-900 tracking-[-0.03em]">Wallet</h1>

      {params.topup === "success" && (
        <p role="alert" className="mt-3 border border-rise p-3 font-mono text-xs text-rise">
          Payment received — the credit lands in a few seconds. Refresh if you don&apos;t see it yet.
        </p>
      )}
      {params.topup === "cancelled" && (
        <p role="alert" className="mt-3 border border-rule p-3 font-mono text-xs text-ink-faint">
          Checkout cancelled — nothing was charged.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="border border-rule p-4">
          <p className="eyebrow">Earnings available</p>
          <p className="mt-1"><Money cents={available} /></p>
          {requested > 0 && (
            <p className="mt-0.5 font-mono text-[0.625rem] text-ink-faint">
              + {formatCredit(requested)} requested
            </p>
          )}
        </div>
        <div className="border border-rule p-4">
          <p className="eyebrow">Lifetime earned</p>
          <p className="mt-1"><Money cents={lifetime} /></p>
        </div>
        <div className="col-span-2 flex items-center justify-between border border-rule p-4">
          <div>
            <p className="eyebrow">Marketing credit</p>
            <p className="mt-1"><Money cents={creditCents} /></p>
            <p className="mt-0.5 font-mono text-[0.625rem] text-ink-faint">
              Funds campaign approvals and car ads.
            </p>
          </div>
          <Link href="/wallet/add" className="btn !px-4 !py-2 text-xs">Add credit</Link>
        </div>
      </div>

      <div className="mt-4">
        <PayoutButton availableCents={available} minCents={minPayout} />
        <p className="mt-1.5 font-mono text-[0.625rem] text-ink-faint">
          Minimum payout {formatCredit(minPayout)}. TapMart&apos;s platform fee ({feePct}%)
          is already taken out of the amounts shown.
        </p>
      </div>

      <section className="rule mt-6 pt-5">
        <SectionTitle count={earningsRows.length}>Earnings</SectionTitle>
        {earningsRows.length === 0 && (
          <p className="mt-2 font-mono text-xs text-ink-faint">
            Approved work and car ad payments land here.{" "}
            <Link href="/jobs" className="text-signal underline underline-offset-2">Find a job</Link>
          </p>
        )}
        <ul className="mt-2 flex flex-col gap-1.5">
          {earningsRows.map((e, i) => (
            <li key={i} className="flex items-center gap-3 border-b border-rule pb-1.5 text-sm last:border-b-0">
              <span className="min-w-0 flex-1">
                {SOURCE_LABEL[e.source] ?? e.source}
                <span className="ml-2 font-mono text-[0.625rem] text-ink-faint">
                  {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </span>
              <StatusChip status={e.status} />
              <Money cents={e.amount_cents} />
            </li>
          ))}
        </ul>
      </section>

      {payouts.length > 0 && (
        <section className="rule mt-6 pt-5">
          <SectionTitle count={payouts.length}>Payouts</SectionTitle>
          <ul className="mt-2 flex flex-col gap-1.5">
            {payouts.map((p, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-rule pb-1.5 text-sm last:border-b-0">
                <span className="flex-1 font-mono text-[0.6875rem] text-ink-faint">
                  {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <StatusChip status={p.status} />
                <Money cents={p.amount_cents} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
