import Link from "next/link";
import { Check } from "@phosphor-icons/react/dist/ssr";
import type { Plan, PlanKey } from "@/config/plans";
import { shootsLine } from "@/config/plans";
import { money } from "@/v3/examples";

/** The real business plans with the live monthly price; campaign pay is never inside a subscription. */
export function Plans({ plans, prices, feePct }: { plans: Plan[]; prices: Record<PlanKey, number>; feePct: number }) {
  return (
    <section id="plans" className="lp-section env-white" aria-labelledby="plans-h">
      <div className="lp-wrap">
        <div className="lp-chapter-head">
          <p className="eyebrow">Plans</p>
          <h2 id="plans-h" className="t-h1">Two plans. One system.</h2>
          <p className="t-lead">A subscription pays for content and tools. Campaign credit funds campaigns and goes to the people who do the work.</p>
        </div>
        <div className="lp-plans">
          {plans.map((p, i) => (
            <div key={p.key} className={`lp-plan ${i === 1 ? "is-featured" : ""}`}>
              <span className="t-h3">{p.name}</span>
              <span className="t-meta">{p.tagline}</span>
              <span className="lp-plan-price"><span className="t-money" style={{ fontSize: 40, lineHeight: 1 }}>{money(prices[p.key])}</span><span className="t-meta">a month</span></span>
              <span className="t-body">{shootsLine(p.shoots)}</span>
              <ul className="lp-plan-features">{p.features.filter((f) => !f.soon).map((f) => <li key={f.label}><Check size={16} weight="bold" aria-hidden />{f.label}</li>)}</ul>
              {p.features.some((f) => f.soon) && (<><span className="t-meta" style={{ marginTop: 8 }}>Planned, not available today</span><ul className="lp-plan-features is-soon" style={{ marginTop: 0 }}>{p.features.filter((f) => f.soon).map((f) => <li key={f.label}>{f.label}</li>)}</ul></>)}
              <Link href="/sign-up" className={`btn ${i === 1 ? "btn-signal" : "btn-dark"} btn-lg`}>{p.cta}</Link>
            </div>
          ))}
          <div className="lp-plans-note">
            <span className="t-h3">Three kinds of money, kept apart.</span>
            <p className="t-body" style={{ marginTop: 8, maxWidth: "62ch", color: "var(--tm-text2)" }}>A business subscription pays for content and tools. Campaign credit funds campaigns and goes to the people who do the work. Earnings for a person come from approved work, with the {feePct}% fee already deducted, and are paid out on request.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
