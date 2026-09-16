import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { isStripeConfigured } from "@/lib/stripe";
import { getSubscription } from "@/lib/v2/subscriptions";
import { PLAN_BY_KEY } from "@/config/plans";
import { fmtDay } from "@/components/fs/business/campaign/parts";
import { Money, formatMoney } from "@/components/fs/parts";
import { UtilityHead } from "@/components/fs/settings/Rows";
import { TopUpForm } from "@/components/fs/settings/TopUp";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Campaign credit" };
export const dynamic = "force-dynamic";

/**
 * Campaign credit: the money that pays people. It leaves the balance only
 * when work is approved or a car goes live. Nothing is held when a
 * campaign is published. The subscription is a different amount on a
 * different page and is named here only so the two are never confused.
 */
export default async function BillingPage() {
  const ctx = await requireBusinessContext("/business/billing");
  const business = ctx.activeBusiness;
  const [wallet, spend, settings, subscription] = await Promise.all([
    sqlOne<{ cents: string; owner_id: string }>(`select coalesce(w.available_credit_cents, 0)::text as cents, b.owner_id from businesses b left join wallets w on w.user_id = b.owner_id where b.id = $1`, [business.id]),
    sql<{ id: string; amount_cents: number; reason: string | null; created_at: string }>(
      `select l.id, l.amount_cents::int as amount_cents, l.reason, l.created_at from credit_ledger l join businesses b on b.owner_id = l.user_id
        where b.id = $1 and l.transaction_type = 'campaign_payment' and l.amount_cents < 0 and l.created_at >= date_trunc('month', now())
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
    <main className="fs-phone-main fs-utility" id="main">
      <UtilityHead title="Campaign credit" back={<BackLink fallback="/business/plan" label="Plan and billing" />} />
      <section className="fs-plane" style={{ marginTop: 16 }} aria-label="Campaign credit">
        <p className="fs-t-label">Available to pay people</p>
        <Money cents={credit} className="fs-money-balance" per="Leaves only when you approve work or a car goes live. Publishing needs credit for one payment; nothing is held." />
      </section>

      <section aria-labelledby="add-title" style={{ marginTop: 32 }}>
        <h2 id="add-title" className="fs-t-section">Add credit</h2>
        {!isOwner ? <p className="fs-t-body" style={{ marginTop: 8 }}>Only the business owner can add credit.</p>
          : stripeLive ? <TopUpForm minCents={minCents} maxCents={maxCents} />
          : <p className="fs-t-body" style={{ marginTop: 8, color: "var(--fs-muted)" }}>Card payments are not connected in this environment. Credit cannot be added here until Stripe is configured.</p>}
      </section>

      <section aria-labelledby="spend-title" style={{ marginTop: 32 }}>
        <h2 id="spend-title" className="fs-t-section">{month} spend</h2>
        {spend.length === 0 ? <p className="fs-t-body" style={{ marginTop: 8, color: "var(--fs-muted)" }}>Nothing paid to people yet this month. You only pay when you approve.</p> : (
          <>
            <p className="fs-t-body" style={{ marginTop: 8 }}><span style={{ fontWeight: 500 }}>{formatMoney(spent)}</span> paid to people across {spend.length} payment{spend.length === 1 ? "" : "s"}</p>
            <ul className="fs-tx-list" style={{ marginTop: 8 }}>
              {spend.map((r) => (
                <li key={r.id}>
                  <div className="fs-tx-row" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
                    <span style={{ minWidth: 0 }}><span className="fs-t-body" style={{ display: "block" }}>{r.reason ?? "Campaign payment"}</span><span className="fs-t-meta" style={{ display: "block" }}>{fmtDay(r.created_at)}</span></span>
                    <span className="fs-t-body fs-tnum" style={{ fontWeight: 500 }}>{formatMoney(-r.amount_cents)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="sub-title" style={{ marginTop: 32 }}>
        <h2 id="sub-title" className="fs-t-section">Subscription, kept separate</h2>
        <p className="fs-t-body" style={{ marginTop: 8 }}>{active ? `${PLAN_BY_KEY[active.plan].name} plan${active.status !== "active" ? `, ${active.status.replace("_", " ")}` : ""}` : "No plan"}<span className="fs-t-meta"> · Billed to your card, never taken from campaign credit</span></p>
        <Link href="/business/plan" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: 4 }}>{active ? "Manage the plan" : "See the plans"} <ArrowRight size={18} aria-hidden /></Link>
      </section>
    </main>
  );
}
