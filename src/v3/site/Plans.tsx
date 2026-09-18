import Link from "next/link";
import { Check } from "@phosphor-icons/react/dist/ssr";
import type { Plan, PlanKey } from "@/config/plans";
import { shootsLine } from "@/config/plans";
import { money } from "../examples";
import { Chapter } from "./Shell";

/**
 * The real business plans, in the V3 chapter language: two opaque paper
 * sheets on the canvas with the live monthly price from production
 * settings, the plan's included shoots, its features and what is planned
 * but not available today. Campaign pay is never inside a subscription;
 * the note says so with the live fee.
 */
export function Plans({ plans, prices, feePct }: { plans: Plan[]; prices: Record<PlanKey, number>; feePct: number }) {
  return (
    <Chapter id="plans" verb="Plans">
      <div className="x-plans">
        {plans.map((p) => (
          <div key={p.key} className="x-plan paper">
            <span className="t-object">{p.name}</span>
            <span className="t-fact">{p.tagline}</span>
            <span className="x-plan-price"><span className="x-money-hero">{money(prices[p.key])}</span><span className="t-fact-ink">a month</span></span>
            <span className="t-fact-ink">{shootsLine(p.shoots)}</span>
            <ul className="x-plan-features">
              {p.features.filter((f) => !f.soon).map((f) => <li key={f.label}><Check size={16} weight="bold" aria-hidden />{f.label}</li>)}
            </ul>
            {p.features.some((f) => f.soon) && (
              <>
                <span className="t-fact">Planned, not available today</span>
                <ul className="x-plan-features is-soon">{p.features.filter((f) => f.soon).map((f) => <li key={f.label}>{f.label}</li>)}</ul>
              </>
            )}
            <Link href="/sign-up" className="btn btn-primary">{p.cta}</Link>
          </div>
        ))}
        <div className="x-plans-note">
          <span className="t-object">Three kinds of money, kept apart.</span>
          <span className="t-body">A business subscription pays for content and tools. Campaign credit funds campaigns and goes to the people who do the work. Earnings for a person come from approved work, with the {feePct}% fee already deducted, and are paid out on request.</span>
        </div>
      </div>
    </Chapter>
  );
}
