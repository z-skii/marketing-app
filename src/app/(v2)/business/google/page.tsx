import Link from "next/link";
import { CaretRight, CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { getBusinessHealth } from "@/lib/v2/health";
import { getLastGoogleHealth, runGoogleHealth } from "@/lib/google/business";
import { googleIssueLine } from "@/lib/google/summary";
import { RunCheckButton } from "./RunCheckButton";

export const metadata = { title: "Google Business" };
export const dynamic = "force-dynamic";

function checkedOn(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Google Business as one actionable screen: the listing state in a line, what
 * is off, and the fixes. Every line comes from a real check; when Google is
 * not connected the screen says the check ran against the TapMart profile.
 */
export default async function GooglePage() {
  const ctx = await requireBusinessContext("/business/google");
  const business = ctx.activeBusiness;

  const [google, health] = await Promise.all([
    getLastGoogleHealth(business.id).then((last) => last ?? runGoogleHealth(business.id)),
    getBusinessHealth(business.id),
  ]);

  // Missing first, then warnings, so the worst news leads.
  const failing = google.checks
    .filter((c) => c.status !== "ok")
    .sort((a, b) => (a.status === "missing" ? 0 : 1) - (b.status === "missing" ? 0 : 1));
  const passing = google.checks.length - failing.length;
  const good = failing.length === 0;
  // Fix rows in the same order as the issue lines above them.
  const fixes = failing.flatMap((c) => google.fixes.filter((f) => f.key === c.key));
  const firstFix = fixes[0] ?? null;
  const healthFailing = health.signals.filter((s) => !s.ok);
  const when = checkedOn(google.ran_at);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Google Business</h1>

      {/* ------------------------------------------------------------ STATUS */}
      <section className="mt-7" aria-labelledby="google-title">
        <h2 id="google-title" className="eyebrow">Listing</h2>
        <p className={`mt-3 font-display text-[2.25rem] leading-none font-800 tracking-[-0.03em] md:text-[2.75rem] ${good ? "text-signal" : "text-ink"}`}>
          {good ? "Looking good" : "Needs attention"}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          <span className="tnum font-display font-700 text-ink">{google.score}</span> out of 100
          {when && <span className="text-ink-faint"> · Checked {when}</span>}
        </p>

        <ul className="mt-5 flex flex-col gap-2" aria-label="Checks">
          {failing.map((c, i) => (
            <li key={c.key} className="reveal flex items-center gap-2 text-[0.9375rem] text-ink" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
              <WarningCircle size={18} weight="fill" className="shrink-0 text-alert" aria-hidden />
              {googleIssueLine(c)}
            </li>
          ))}
          {passing > 0 && (
            <li className="flex items-center gap-2 text-[0.9375rem] text-ink-soft">
              <CheckCircle size={18} weight="fill" className="shrink-0 text-rise" aria-hidden />
              {good ? "Every check passes." : `${passing} of ${google.checks.length} checks pass.`}
            </li>
          )}
        </ul>

        {firstFix && <Link href={firstFix.href} className="btn btn-signal btn-lg mt-5 w-full">Fix Google</Link>}
      </section>

      {/* ------------------------------------------------------------- FIXES */}
      {fixes.length > 0 && (
        <section className="mt-8" aria-labelledby="fixes-title">
          <h2 id="fixes-title" className="eyebrow">Fixes</h2>
          <ul className="mt-1 divide-y divide-rule">
            {fixes.map((f, i) => (
              <li key={f.key} className="reveal" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                <Link href={f.href} className="flex min-h-14 items-center justify-between gap-3 py-3">
                  <span className="font-display text-[1.0625rem] font-700">{f.label}</span>
                  <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------------------ SOURCE */}
      <section className="mt-8">
        {google.source === "profile" && (
          <p className="text-sm text-ink-soft">
            Checked from your TapMart profile. Connect Google to check the live listing.
          </p>
        )}
        {google.source === "profile" && (
          <Link href="/business/social" className="link-row text-sm">Connect Google<CaretRight size={14} aria-hidden /></Link>
        )}
        <div className="mt-3">
          <RunCheckButton />
        </div>
      </section>

      {/* ------------------------------------------------------- TAPMART SCORE */}
      <section className="mt-10" aria-labelledby="tapmart-title">
        <h2 id="tapmart-title" className="eyebrow">TapMart health</h2>
        <div className="mt-3 flex items-end gap-4">
          <p className="tnum font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em]">
            <span className={health.score >= 80 ? "text-signal" : "text-ink"}>{health.score}</span>
            <span className="text-[1rem] text-ink-faint"> / {health.max}</span>
          </p>
          <p className="pb-0.5 text-sm text-ink-soft">{health.label}</p>
        </div>
        {healthFailing.length > 0 && (
          <ul className="mt-2 divide-y divide-rule" aria-label="Worth fixing">
            {healthFailing.slice(0, 4).map((s) => (
              <li key={s.key}>
                <Link href={s.fix.href} className="flex min-h-14 items-center justify-between gap-3 py-3">
                  <span className="min-w-0 truncate font-display text-[1rem] font-700">{s.fix.label}</span>
                  <span className="flex shrink-0 items-center gap-2 text-ink-faint">
                    <span className="tnum font-display text-sm font-700 text-ink-soft">+{s.points}</span>
                    <CaretRight size={18} aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {healthFailing.length > 4 && (
          <p className="mt-2 text-sm text-ink-faint">{healthFailing.length - 4} more after these.</p>
        )}
      </section>
    </main>
  );
}
