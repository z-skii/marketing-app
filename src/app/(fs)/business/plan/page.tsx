import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { getSubscription, isSubscriptionBillingConfigured, planPrices } from "@/lib/v2/subscriptions";
import { PLANS, shootsLine } from "@/config/plans";
import { devAuthEnabled } from "@/lib/supabase";
import { fmtDate } from "@/lib/fs/business-identity";
import { Money, formatMoney } from "@/components/fs/parts";
import { UtilityHead } from "@/components/fs/settings/Rows";
import { Facts } from "@/components/fs/work/DetailParts";
import { CancelPlanButton, ChoosePlanButton } from "@/components/fs/settings/PlanControls";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Plan and billing" };
export const dynamic = "force-dynamic";

/**
 * Plan and billing. Three kinds of money are kept apart on purpose and
 * never shown as one figure: the subscription (this page), campaign
 * credit that pays people (its own page), and what creators receive
 * (theirs). Two plans, the current one named in words, one button on the
 * other.
 */
export default async function PlanPage({ searchParams }: { searchParams: Promise<{ checkout?: string; activated?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/plan"), searchParams]);
  const business = ctx.activeBusiness;
  const [subscription, prices, wallet] = await Promise.all([
    getSubscription(business.id),
    planPrices(),
    sqlOne<{ cents: string }>(`select coalesce(w.available_credit_cents, 0)::text as cents from businesses b left join wallets w on w.user_id = b.owner_id where b.id = $1`, [business.id]),
  ]);
  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  const billingLive = isSubscriptionBillingConfigured();
  const isOwner = business.member_role === "owner" || ctx.user.role === "admin";
  const plans = PLANS.slice(0, 2);
  const current = active ? plans.find((p) => p.key === active.plan) ?? null : null;
  const credit = Number(wallet?.cents ?? 0);
  const notice = params.checkout === "success" ? "Thanks. Your plan turns on as soon as Stripe confirms the payment, usually within a minute."
    : params.checkout === "cancelled" ? "Checkout was cancelled. Nothing was charged."
    : params.activated === "dev" ? "Development billing: no card was charged." : null;
  const stateWord = !active ? { label: "No plan", tone: "neutral" as const } : active.status === "active" ? { label: "Active", tone: "confirmed" as const } : active.status === "trialing" ? { label: "Trial", tone: "waiting" as const } : { label: "Past due", tone: "problem" as const };

  return (
    <main className="fs-phone-main" id="main" style={{ maxWidth: 816 + 64 }}>
      <UtilityHead title="Plan and billing" back={<BackLink fallback="/business/settings" label="Settings" />} />
      {notice && <p role="status" className="fs-note fs-t-body" style={{ marginTop: 12 }}>{notice}</p>}

      <section aria-labelledby="current-title" className="fs-plane" style={{ marginTop: 16, maxWidth: 640 }}>
        <p className="fs-t-label">Subscription <span className={`fs-status is-${stateWord.tone}`}>· {stateWord.label}</span></p>
        {current && active ? (
          <>
            <h2 id="current-title" className="fs-t-section" style={{ marginTop: 4 }}>{current.name}</h2>
            <div style={{ marginTop: 8 }}><Money cents={prices[current.key]} per="a month, billed to your card" className="fs-money-detail" /></div>
            <Facts rows={[
              ["Billing", active.status === "past_due" ? "Past due. The last payment did not go through." : active.billing === "dev" ? "Development billing, no card on file" : active.billing === "stripe" ? "Card on file with Stripe" : "Billed manually"],
              [active.status === "trialing" ? "Trial ends" : "Renews", active.current_period_end ? fmtDate(active.current_period_end) : "Renewal date not recorded"],
              ["Shoots", shootsLine(current.shoots)],
              ["Cancelling", "Stops the plan and its shoots at the end of the period. Campaigns and campaign credit stay."],
            ]} />
          </>
        ) : (
          <>
            <h2 id="current-title" className="fs-t-section" style={{ marginTop: 4 }}>No plan yet</h2>
            <p className="fs-t-body" style={{ marginTop: 8, color: "var(--fs-muted)" }}>Without a plan there are no content shoots and no delivered photos or videos. Campaigns work without one; they are paid from campaign credit, never from a plan.</p>
          </>
        )}
      </section>

      <section aria-labelledby="plans-title" style={{ marginTop: 32 }}>
        <h2 id="plans-title" className="fs-t-section">{active ? "The two plans" : "Choose a plan"}</h2>
        <p className="fs-t-meta" style={{ marginTop: 4 }}>Plans never include campaign spend. Campaign budgets go to the people who do the work.</p>
        <div className="fs-plan-grid">
          {plans.map((plan) => {
            const isCurrent = active?.plan === plan.key;
            const primary = !isCurrent && (active ? true : plan.key === "growth");
            const features = plan.features.filter((f) => !/content shoot/i.test(f.label));
            return (
              <section key={plan.key} className={`fs-plan${isCurrent ? " is-current" : ""}`} aria-label={plan.name}>
                <div>
                  <p className="fs-t-label">{plan.name}{isCurrent && <span className="fs-status is-confirmed"> · Your plan</span>}</p>
                  <Money cents={prices[plan.key]} per="a month" className="fs-money" />
                </div>
                <p className="fs-t-body" style={{ fontWeight: 500 }}>{shootsLine(plan.shoots)}</p>
                <ul className="fs-plan-features">
                  {features.map((f) => <li key={f.label} className={f.soon ? "is-soon" : undefined}><span>{f.label}</span>{f.soon && <span className="fs-status is-neutral">Later</span>}</li>)}
                </ul>
                <div style={{ marginTop: "auto" }}>
                  {isCurrent ? <p className="fs-t-meta">This is the plan you are on.</p>
                    : isOwner ? <ChoosePlanButton businessId={business.id} plan={plan.key} primary={primary} label={active ? `Move to ${plan.name}` : plan.cta} />
                    : <p className="fs-t-meta">Only the owner can change the plan.</p>}
                </div>
              </section>
            );
          })}
        </div>
        {!billingLive && <p className="fs-t-meta" style={{ marginTop: 12 }}>{devAuthEnabled() ? "Card billing is not connected in this environment. Choosing a plan here turns it on without a charge." : "Billing is not connected yet. Plans go live when Stripe subscription prices are configured."}</p>}
        {active && isOwner && <div style={{ marginTop: 16 }}><CancelPlanButton businessId={business.id} /></div>}
      </section>

      <section aria-labelledby="credit-title" style={{ marginTop: 32, maxWidth: 640 }}>
        <h2 id="credit-title" className="fs-t-section">Campaign credit, kept separate</h2>
        <p className="fs-t-meta" style={{ marginTop: 4 }}>Pays creators and drivers when you approve work. Not part of the subscription.</p>
        <p className="fs-t-body" style={{ marginTop: 8 }}><span style={{ fontWeight: 500 }}>{formatMoney(credit)}</span> available now</p>
        <Link href="/business/billing" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: 4 }}>Campaign credit and spend <ArrowRight size={18} aria-hidden /></Link>
      </section>
    </main>
  );
}
