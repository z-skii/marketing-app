import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { getSubscription, isSubscriptionBillingConfigured, planPrices } from "@/lib/v2/subscriptions";
import { PLANS, shootsLine } from "@/config/plans";
import { devAuthEnabled } from "@/lib/supabase";
import { Chip, Money } from "@/components/v2/ui";
import { CancelPlanButton, ChoosePlanButton } from "./PlanButtons";

export const metadata = { title: "Plan" };
export const dynamic = "force-dynamic";

const FEATURE_LINES = 6;

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
  const plans = PLANS.slice(0, 2);

  const notice =
    params.checkout === "success" ? "Thanks. Your plan turns on as soon as Stripe confirms the payment, usually within a minute."
    : params.checkout === "cancelled" ? "Checkout was cancelled. Nothing was charged."
    : params.activated === "dev" ? "Development billing: no card was charged."
    : null;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h1 className="mt-3 font-display text-[1.5rem] font-700 tracking-[-0.02em] md:text-[1.5rem]">Plan</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Plans never include campaign spend. Campaign budgets go to the people who do the work.</p>

      {notice && <p role="status" className="card-2 mt-4 px-4 py-3 text-sm text-ink">{notice}</p>}

      {active && (
        <p className="mt-4 text-sm text-ink-soft">
          You are on {plans.find((p) => p.key === active.plan)?.name}
          {active.status !== "active" && <>, {active.status.replace("_", " ")}</>}
          {active.current_period_end && <>, renews {new Date(active.current_period_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>}
          {active.billing === "dev" && <>. Development billing, no card on file</>}.
        </p>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {plans.map((plan) => {
          const current = active?.plan === plan.key;
          // The one lime button sits on the plan you are not on. With no plan yet, Growth carries it.
          const primary = !current && (active ? true : plan.key === "growth");
          const features = plan.features
            .filter((f) => !/content shoot/i.test(f.label))
            .slice(0, FEATURE_LINES);
          return (
            <section key={plan.key} className={`card flex flex-col p-5 md:p-6 ${current ? "card-signal" : ""}`} aria-label={plan.name}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-[1.5rem] leading-none font-700 tracking-[-0.02em]">{plan.name}</h2>
                {current && <Chip tone="signal">Current plan</Chip>}
              </div>
              <p className="mt-3"><Money cents={prices[plan.key]} size="xl" suffix="/ mo" tone={current ? "signal" : "ink"} /></p>
              <p className="mt-3 font-display text-[1rem] font-600 text-ink">{shootsLine(plan.shoots)}</p>
              <ul className="mt-3 divide-y divide-rule">
                {features.map((f) => (
                  <li key={f.label} className={`flex items-center justify-between gap-3 py-2 text-[0.9375rem] ${f.soon ? "text-ink-faint" : "text-ink"}`}>
                    <span>{f.label}</span>
                    {f.soon && <Chip tone="faint">Soon</Chip>}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                {current ? null : isOwner ? (
                  <ChoosePlanButton
                    businessId={business.id} plan={plan.key} current={current} primary={primary}
                    label={active ? (plan.key === "growth" ? "Move to Growth" : "Move to Essential") : plan.cta}
                  />
                ) : (
                  <p className="mt-5 text-sm text-ink-faint">Only the owner can change the plan.</p>
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
            : "Billing is not connected yet. Plans go live when Stripe subscription prices are configured."}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <Link href="/business/billing" className="link-row text-sm">Campaign credit and billing<CaretRight size={16} aria-hidden /></Link>
        {active && isOwner && <CancelPlanButton businessId={business.id} />}
      </div>
    </main>
  );
}
