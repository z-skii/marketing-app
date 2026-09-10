import Link from "next/link";
import { CaretRight, CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { requireBusinessContext } from "@/lib/v2/core";
import { getBusinessHealth } from "@/lib/v2/health";
import { getLastGoogleHealth, runGoogleHealth, type GoogleCheck } from "@/lib/google/business";
import { defaultPeriod, getGrowthSummary } from "@/lib/social/insights";
import { ManualGrowthForm } from "./ManualGrowthForm";

export const metadata = { title: "Google and growth" };
export const dynamic = "force-dynamic";

/** One short line per check that is not fine. Nothing here is estimated. */
const SHORT: Record<string, { warn: string; missing: string }> = {
  name: { warn: "Business name unclear.", missing: "No business name." },
  category: { warn: "Category unclear.", missing: "No category." },
  hours: { warn: "Hours incomplete.", missing: "Hours missing." },
  phone: { warn: "Phone number unclear.", missing: "No phone number." },
  website: { warn: "No website linked.", missing: "No website linked." },
  address: { warn: "Address incomplete.", missing: "No address." },
  photos: { warn: "Only one photo.", missing: "No photos." },
  description: { warn: "Description is short.", missing: "No description." },
};

function shortLine(c: GoogleCheck): string {
  const s = SHORT[c.key];
  if (!s) return c.detail;
  return c.status === "warn" ? s.warn : s.missing;
}

function count(n: number | null): string {
  return n === null ? "" : n.toLocaleString("en-US");
}

function periodLabel(start: string, end: string): string {
  const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(start)} to ${fmt(end)}`;
}

/**
 * Google and growth on one screen: the listing checks with their fixes, this
 * month's real numbers with the one next action, and the TapMart health
 * score underneath. Every number was measured or typed in by the business.
 */
export default async function HealthPage() {
  const ctx = await requireBusinessContext("/business/health");
  const business = ctx.activeBusiness;

  const [google, growth, health] = await Promise.all([
    getLastGoogleHealth(business.id).then((last) => last ?? runGoogleHealth(business.id)),
    getGrowthSummary(business.id),
    getBusinessHealth(business.id),
  ]);

  const failing = google.checks.filter((c) => c.status !== "ok");
  const googleGood = failing.length === 0;
  const firstFix = google.fixes[0] ?? null;
  const period = growth.period ?? defaultPeriod();
  const m = growth.metrics;
  const healthFailing = health.signals.filter((s) => !s.ok);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Google and growth</h1>

      {/* ------------------------------------------------------------ GOOGLE */}
      <section className="mt-7" aria-labelledby="google-title">
        <h2 id="google-title" className="eyebrow">Google</h2>
        <div className="mt-3 flex items-end gap-4">
          <p className={`tnum font-display text-[2.75rem] leading-none font-800 tracking-[-0.03em] ${googleGood ? "text-signal" : "text-ink"}`}>{google.score}</p>
          <div className="min-w-0 pb-0.5">
            <p className="font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{googleGood ? "Looking good" : "Needs attention"}</p>
            <p className="mt-0.5 text-sm text-ink-soft">Listing score out of 100</p>
          </div>
        </div>

        {failing.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1.5" aria-label="What is off">
            {failing.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-[0.9375rem] text-ink">
                <WarningCircle size={16} weight="fill" className={c.status === "missing" ? "text-alert" : "text-ink-faint"} aria-hidden />
                {shortLine(c)}
              </li>
            ))}
          </ul>
        )}

        {google.fixes.length > 0 ? (
          <ul className="mt-4 divide-y divide-rule" aria-label="Fixes">
            {google.fixes.map((f, i) => (
              <li key={f.key} className="reveal" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                <Link href={f.href} className="flex min-h-14 items-center justify-between gap-3 py-3">
                  <span className="font-display text-[1.0625rem] font-700">{f.label}</span>
                  <CaretRight size={18} className="text-ink-faint" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-signal"><CheckCircle size={16} weight="fill" aria-hidden />Every check passes.</p>
        )}

        {firstFix && <Link href={firstFix.href} className="btn btn-signal btn-lg mt-4 w-full">Fix Google</Link>}

        {google.source === "profile" && (
          <p className="mt-3 text-sm text-ink-soft">
            Checked from your TapMart profile. <Link href="/business/connections" className="link-row min-h-0 text-sm text-ink">Connect Google</Link> to check the live listing.
          </p>
        )}
      </section>

      {/* ------------------------------------------------------------ GROWTH */}
      <section className="mt-10" aria-labelledby="growth-title">
        <h2 id="growth-title" className="eyebrow">Growth</h2>

        {growth.source === "unavailable" ? (
          <>
            <p className="mt-3 text-sm text-ink-soft">
              No connected account yet. Add this month&apos;s numbers yourself or <Link href="/business/connections" className="link-row min-h-0 text-sm text-ink">connect Instagram</Link>.
            </p>
            <ManualGrowthForm periodStart={period.start} periodEnd={period.end} />
          </>
        ) : (
          <>
            <div className="mt-3 flex items-baseline justify-between gap-3">
              <h3 className="font-display text-[1.0625rem] font-700">This month</h3>
              <p className="truncate text-sm text-ink-faint">
                {growth.source === "manual" ? "Entered by you" : `From ${growth.provider === "instagram" ? "Instagram" : growth.provider}`}
                {" · "}{periodLabel(period.start, period.end)}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
              <Figure value={count(m.reach)} label="Reach" />
              <Figure
                value={m.followers_delta === null ? "" : `${m.followers_delta > 0 ? "+" : ""}${count(m.followers_delta)}`}
                label="Followers"
                tone={m.followers_delta !== null && m.followers_delta > 0 ? "signal" : "ink"}
              />
              <Figure value={count(m.views)} label="Views" />
              <Figure value={m.engagement_pct === null ? "" : `${m.engagement_pct}%`} label="Engagement" />
            </div>
          </>
        )}

        {growth.top_post && (
          <div className="mt-8">
            <h3 className="font-display text-[1.0625rem] font-700">What worked</h3>
            <TopPost title={growth.top_post.title} thumb={growth.top_post.thumbnail_url} views={growth.top_post.views} href={growth.top_post.href} />
          </div>
        )}

        {growth.next_action && (
          <div className="mt-8">
            <h3 className="font-display text-[1.0625rem] font-700">What to do next</h3>
            <div className="mt-2 flex min-h-14 items-center justify-between gap-3 border-t border-rule py-3">
              <p className="min-w-0 flex-1 text-[0.9375rem] text-ink">{growth.next_action.label}</p>
              <Link href={growth.next_action.href} className="btn btn-sm shrink-0">Go</Link>
            </div>
          </div>
        )}
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

function Figure({ value, label, tone = "ink" }: { value: string; label: string; tone?: "ink" | "signal" }) {
  return (
    <div className="min-w-0">
      {value ? (
        <p className={`tnum settle truncate font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] ${tone === "signal" ? "text-signal" : "text-ink"}`}>{value}</p>
      ) : (
        <p className="truncate font-display text-[1.125rem] leading-none font-700 text-ink-faint">No data</p>
      )}
      <p className="mt-1.5 text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function TopPost({ title, thumb, views, href }: { title: string; thumb: string | null; views: number | null; href: string | null }) {
  const body = (
    <>
      <span className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
        {thumb && <MediaPreview src={thumb} alt="" className="h-full w-full object-cover" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 font-display text-[1.0625rem] leading-tight font-700">{title}</span>
        {views !== null && <span className="tnum mt-1 block text-sm text-ink-soft">{views.toLocaleString("en-US")} views</span>}
      </span>
      {href && <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />}
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-3 py-2">{body}</a>
  ) : (
    <div className="mt-2 flex items-center gap-3 py-2">{body}</div>
  );
}
