import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { getSubscription, isSubscriptionBillingConfigured, planPrices } from "@/lib/v2/subscriptions";
import { PLANS, PLAN_COMPARE } from "@/config/plans";
import { devAuthEnabled } from "@/lib/supabase";
import { Money } from "@/components/v2/ui";
import { CancelPlanButton, ChoosePlanButton } from "./PlanButtons";

export const metadata = { title: "Plan" };
export const dynamic = "force-dynamic";

/**
 * Two plans, side by side. The current one is marked; the other has the one
 * button. Nothing here touches campaign credit.
 */
export default async function PlanPage({
  searchParams,
}: { searchParams: Promise<{ checkout?: string; activated?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/plan"), searchParams]);
  const business = ctx.activeBusiness;
  const [subscription, prices] = await Promise.all([getSubscription(business.id), planPrices()]);
  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  const billingLive = isSubscriptionBillingConfigured();
  const isOwner = business.member_role === "owner" || ctx.user.role === "admin";

  const notice =
    params.checkout === "success" ? "Thanks. Your plan turns on as soon as Stripe confirms the payment, usually within a minute."
    : params.checkout === "cancelled" ? "Checkout was cancelled. Nothing was charged."
    : params.activated === "dev" ? "Development billing: no card was charged."
    : null;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Plan</h1>
      <p className="mt-1.5 max-w-xl text-[0.9375rem] text-ink-soft">
        Plans never include campaign spend. Campaign budgets go to the people who do the work.
      </p>

      {notice && <p role="status" className="card-2 mt-4 px-4 py-3 text-sm text-ink">{notice}</p>}

      {active && (
        <p className="mt-4 text-sm text-ink-soft">
          You are on {PLANS.find((p) => p.key === active.plan)?.name}
          {active.status !== "active" && <>, {active.status.replace("_", " ")}</>}
          {active.current_period_end && <>, renews {new Date(active.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>}
          {active.billing === "dev" && <>. Development billing, no card on file</>}.
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {PLANS.map((plan) => {
          const current = active?.plan === plan.key;
          return (
            <section key={plan.key} className={`card flex flex-col p-5 md:p-6 ${current ? "card-signal" : ""}`} aria-label={plan.name}>
              <h2 className="font-display text-[1.5rem] leading-none font-800 tracking-[-0.03em]">{plan.name}</h2>
              <p className="mt-3"><Money cents={prices[plan.key]} size="xl" suffix="/ mo" /></p>
              <p className="mt-2 text-[0.9375rem] text-ink-soft">{plan.tagline}</p>
              <ul className="mt-4 flex flex-col gap-1.5 text-[0.9375rem]">
                {plan.features.map((f) => (
                  <li key={f.label} className={`flex items-baseline justify-between gap-3 ${f.soon ? "text-ink-faint" : "text-ink"}`}>
                    <span>{f.label}</span>
                    {f.soon && <span className="shrink-0 text-xs">Coming later</span>}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {isOwner ? (
                  <ChoosePlanButton businessId={business.id} plan={plan.key} label={active ? (plan.key === "growth" ? "Move to Growth" : "Move to Essential") : plan.cta} current={current} primary={plan.key === "growth" || !active} />
                ) : (
                  <p className="mt-5 text-sm text-ink-faint">{current ? "Current plan" : "Only the owner can change the plan."}</p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {!billingLive && (
        <p className="mt-4 text-sm text-ink-faint">
          {devAuthEnabled()
            ? "Card billing is not connected in this environment. Choosing a plan here turns it on without a charge."
            : "Billing isn't connected yet. Plans go live when Stripe subscription prices are configured."}
        </p>
      )}

      <section className="mt-8" aria-label="Compare plans">
        <h2 className="font-display text-lg font-800 tracking-[-0.02em]">Compare plans</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full min-w-[22rem] text-left text-[0.9375rem]">
            <thead>
              <tr className="text-sm text-ink-faint">
                <th className="px-4 py-3 font-600">Feature</th>
                <th className="px-4 py-3 font-600">Essential</th>
                <th className="px-4 py-3 font-600">Growth</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_COMPARE.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-2.5 text-ink-soft">{row.label}</td>
                  <td className="px-4 py-2.5">{row.essential}</td>
                  <td className="px-4 py-2.5">{row.growth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Link href="/business/billing" className="font-display text-sm font-600 text-ink-soft hover:text-ink">Campaign credit and billing →</Link>
        {active && isOwner && <CancelPlanButton businessId={business.id} />}
      </div>
    </main>
  );
}
