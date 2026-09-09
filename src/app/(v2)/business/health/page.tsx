import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { getBusinessHealth } from "@/lib/v2/health";
import { SectionTitle } from "@/components/v2/ui";

export const metadata = { title: "Business health" };
export const dynamic = "force-dynamic";

/** One number, built in the open from ten things you can see and fix. */
export default async function HealthPage() {
  const ctx = await requireBusinessContext("/business/health");
  const business = ctx.activeBusiness;
  const health = await getBusinessHealth(business.id);
  const failing = health.signals.filter((s) => !s.ok);
  const passing = health.signals.filter((s) => s.ok);
  const pct = Math.round((health.score / health.max) * 100);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Business health</h1>

      <section className="card mt-5 p-5 md:p-6" aria-label="Score">
        <p className="tnum font-display text-[3.25rem] leading-none font-800 tracking-[-0.03em]">
          <span className={health.score >= 80 ? "text-signal" : "text-ink"}>{health.score}</span>
          <span className="text-[1.5rem] text-ink-faint"> / {health.max}</span>
        </p>
        <p className="mt-2 font-display text-[1.125rem] font-800 tracking-[-0.02em]">{health.label}</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div className="h-full rounded-full bg-signal" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          How this is built: ten signals from your profile, connections, calendar and campaigns, each worth the points shown below.
          They add up to {health.max}. Nothing is estimated. Strong is 80 or more, Needs attention is 50 to 79.
        </p>
      </section>

      {failing.length > 0 && (
        <section className="mt-8" aria-label="What to fix">
          <SectionTitle count={failing.length}>Worth fixing</SectionTitle>
          <ul className="row-list mt-3">
            {failing.map((s) => (
              <li key={s.key} className="card flex items-center gap-4 p-4">
                <span className="tnum w-12 shrink-0 font-display text-[1.75rem] leading-none font-800 text-signal">+{s.points}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[1.0625rem] leading-tight font-800 tracking-[-0.02em]">{s.label}</span>
                  <span className="mt-0.5 block text-sm text-ink-faint">{s.why}</span>
                </span>
                <Link href={s.fix.href} className="btn btn-sm shrink-0">Fix</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8" aria-label="In place">
        <SectionTitle count={passing.length}>In place</SectionTitle>
        {passing.length === 0 ? (
          <p className="card mt-3 p-4 text-sm text-ink-soft">Nothing yet. Start with the profile basics above.</p>
        ) : (
          <ul className="row-list mt-3">
            {passing.map((s) => (
              <li key={s.key} className="card-2 flex items-center gap-4 px-4 py-3">
                <span className="tnum w-12 shrink-0 font-display text-lg font-800 text-ink-faint">{s.points}</span>
                <span className="min-w-0 flex-1 font-display text-[0.9375rem] font-700">{s.label}</span>
                <span className="text-signal" aria-label="Done">✓</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
