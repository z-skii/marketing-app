import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCredit } from "@/lib/money";
import { isStripeConfigured } from "@/lib/stripe";
import { getSubscription } from "@/lib/v2/subscriptions";
import { PLAN_BY_KEY } from "@/config/plans";
import { fmtDate } from "@/lib/v2/opportunities";
import { Money, SectionTitle } from "@/components/v2/ui";
import { TopUpForm } from "./TopUpForm";

export const metadata = { title: "Billing" };
export const dynamic = "force-dynamic";

/**
 * Campaign credit: the money that pays people. It is the business owner's
 * wallet, topped up through Stripe, spent only when work is approved. The
 * plan is separate and lives on its own page.
 */
export default async function BillingPage() {
  const ctx = await requireBusinessContext("/business/billing");
  const business = ctx.activeBusiness;

  const [wallet, spend, settings, subscription] = await Promise.all([
    sqlOne<{ cents: string; owner_id: string }>(
      `select w.available_credit_cents::text as cents, b.owner_id from businesses b
         left join wallets w on w.user_id = b.owner_id where b.id = $1`,
      [business.id],
    ),
    sql<{ id: string; amount_cents: number; reason: string | null; created_at: string }>(
      `select l.id, l.amount_cents::int as amount_cents, l.reason, l.created_at
         from credit_ledger l join businesses b on b.owner_id = l.user_id
        where b.id = $1 and l.transaction_type = 'campaign_payment' and l.amount_cents < 0
          and l.created_at >= date_trunc('month', now())
        order by l.created_at desc limit 100`,
      [business.id],
    ),
    getSettings(),
    getSubscription(business.id),
  ]);

  const credit = Number(wallet?.cents ?? 0);
  const isOwner = wallet?.owner_id === ctx.user.id || ctx.user.role === "admin";
  const spent = spend.reduce((sum, r) => sum + -r.amount_cents, 0);
  const minCents = Number(settings.minimum_topup_cents ?? "500");
  const maxCents = Number(settings.maximum_topup_cents ?? "100000");
  const stripeLive = isStripeConfigured();
  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  const month = new Date().toLocaleDateString("en-US", { month: "long" });

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h1 className="mt-3 font-display text-[1.5rem] font-700 tracking-[-0.02em] md:text-[1.5rem]">Billing</h1>
      <p className="mt-1.5 text-[0.9375rem] text-ink-soft">Campaign credit pays the people who do the work. Your plan is billed separately.</p>

      <section className="card mt-5 p-5 md:p-6" aria-label="Campaign credit">
        <p className="text-sm text-ink-soft">Campaign credit</p>
        <p className="mt-2"><Money cents={credit} size="hero" /></p>
        <p className="mt-2 text-sm text-ink-faint">
          Leaves this balance only when you approve work or a car goes live. Publishing a campaign needs credit for at least one payment.
        </p>
      </section>

      <section className="mt-8" aria-label="Add credit">
        <SectionTitle>Add credit</SectionTitle>
        {!isOwner ? (
          <p className="card mt-3 p-4 text-sm text-ink-soft">Only the business owner can add credit.</p>
        ) : stripeLive ? (
          <>
            <TopUpForm minCents={minCents} maxCents={maxCents} />
            <p className="mt-3 text-sm text-ink-faint">
              Checkout is handled by Stripe. Minimum {formatCredit(minCents)}, maximum {formatCredit(maxCents)} per top-up. Credit appears once Stripe confirms the payment.
            </p>
          </>
        ) : (
          <p className="card mt-3 p-4 text-sm text-ink-soft">
            Card payments aren&apos;t connected in this environment. Credit can&apos;t be added here until Stripe is configured.
          </p>
        )}
      </section>

      <section className="mt-8" aria-label="Campaign spend this month">
        <SectionTitle count={spend.length}>{month} spend</SectionTitle>
        {spend.length === 0 ? (
          <p className="card mt-3 p-4 text-sm text-ink-soft">Nothing paid out yet this month. You only pay when you approve.</p>
        ) : (
          <>
            <div className="card mt-3 flex items-center justify-between gap-4 p-4">
              <span className="text-sm text-ink-soft">Paid to people</span>
              <Money cents={spent} size="lg" />
            </div>
            <ul className="row-list mt-2">
              {spend.map((r) => (
                <li key={r.id} className="card flex items-center justify-between gap-4 px-4 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[0.9375rem]">{r.reason ?? "Campaign payment"}</span>
                    <span className="block text-xs text-ink-faint">{fmtDate(r.created_at)}</span>
                  </span>
                  <Money cents={-r.amount_cents} size="sm" tone="ink" />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card mt-8 flex items-center justify-between gap-4 p-4" aria-label="Plan">
        <span>
          <span className="block text-sm text-ink-soft">Plan</span>
          <span className="mt-0.5 block font-display text-[1.125rem] font-700 tracking-[-0.02em]">
            {active ? `${PLAN_BY_KEY[active.plan].name}${active.status !== "active" ? `, ${active.status.replace("_", " ")}` : ""}` : "No plan yet"}
          </span>
          {active?.billing === "dev" && <span className="block text-xs text-ink-faint">Development billing, no card on file</span>}
        </span>
        <Link href="/business/plan" className="btn btn-sm shrink-0">{active ? "Manage" : "See plans"}</Link>
      </section>
    </main>
  );
}
