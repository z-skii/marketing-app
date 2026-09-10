import Link from "next/link";
import { CaretRight, FacebookLogo, GoogleLogo, InstagramLogo, TiktokLogo } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { NoPhoto } from "@/components/v2/EarnCards";
import { Chip } from "@/components/v2/ui";
import { requireBusinessContext } from "@/lib/v2/core";
import { providerConfigured } from "@/lib/business/publishing";
import { defaultPeriod, getGrowthSummary, type SnapshotProvider } from "@/lib/social/insights";
import { listConnections, type ConnectionProvider, type ConnectionRow } from "@/lib/social/summary";
import { ConnectButton } from "./ConnectButton";
import { ManualGrowthForm } from "./ManualGrowthForm";

export const metadata = { title: "Social" };
export const dynamic = "force-dynamic";

const PLATFORMS: { key: ConnectionProvider; name: string; Logo: typeof InstagramLogo }[] = [
  { key: "instagram", name: "Instagram", Logo: InstagramLogo },
  { key: "facebook", name: "Facebook", Logo: FacebookLogo },
  { key: "tiktok", name: "TikTok", Logo: TiktokLogo },
  { key: "google_business", name: "Google Business", Logo: GoogleLogo },
];

const PROVIDER_NAMES: Record<SnapshotProvider, string> = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", google_business: "Google Business",
};

/** 84,213 reads as 84K; 1,240 as 1.2K; below 1,000 the number itself. Formatting only, never rounding a stored value away. */
function compact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${trimZero(abs / 1_000_000)}M`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 1000)}K`;
  if (abs >= 1_000) return `${sign}${trimZero(abs / 1000)}K`;
  return n.toLocaleString("en-US");
}
function trimZero(v: number): string {
  return v.toFixed(1).replace(/\.0$/, "");
}

function periodLabel(start: string, end: string): string {
  const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${fmt(start)} to ${fmt(end)}`;
}

/**
 * Social in one place: which accounts are connected (connections live here
 * now), this period's real numbers, and the post that did best. Every figure
 * was measured by the platform or typed in by the business; nothing is
 * estimated.
 */
export default async function SocialPage() {
  const ctx = await requireBusinessContext("/business/social");
  const business = ctx.activeBusiness;

  const [rows, growth] = await Promise.all([listConnections(business.id), getGrowthSummary(business.id)]);
  const rowFor = (key: ConnectionProvider): ConnectionRow | undefined => rows.find((r) => r.provider === key);
  const anyConfigured = (["instagram", "facebook", "tiktok"] as const).some((p) => providerConfigured(p));

  const period = growth.period ?? defaultPeriod();
  const m = growth.metrics;
  const providerName = growth.provider ? PROVIDER_NAMES[growth.provider] : "Instagram";
  const sourceLabel = growth.source === "manual"
    ? `Entered by you · ${periodLabel(period.start, period.end)}`
    : `From ${providerName}`;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Social</h1>

      {/* ---------------------------------------------------------- ACCOUNTS */}
      <section className="mt-7" aria-labelledby="accounts-title">
        <h2 id="accounts-title" className="eyebrow">Accounts</h2>
        <ul className="mt-1 divide-y divide-rule">
          {PLATFORMS.map((p, i) => {
            const row = rowFor(p.key);
            const status = row?.status ?? "disconnected";
            const handle = row?.external_name?.trim() || null;
            return (
              <li key={p.key} className="reveal flex min-h-16 items-center gap-3 py-3" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                <p.Logo size={30} weight="fill" className="shrink-0 text-ink" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[1.0625rem] leading-tight font-700">{p.name}</p>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="whitespace-nowrap">
                      {status === "connected" && <Chip tone="rise">Connected</Chip>}
                      {status === "error" && <Chip tone="alert">Needs reconnect</Chip>}
                      {status === "pending" && <Chip tone="ink">Requested</Chip>}
                      {status === "disconnected" && <Chip tone="faint">Not connected</Chip>}
                    </span>
                    {handle && <span className="min-w-0 truncate text-sm text-ink-faint">{handle}</span>}
                  </div>
                </div>
                {status === "disconnected" && <ConnectButton businessId={business.id} provider={p.key} label="Connect" />}
                {status === "error" && <ConnectButton businessId={business.id} provider={p.key} label="Reconnect" />}
              </li>
            );
          })}
        </ul>
        {!anyConfigured && (
          <p className="mt-3 text-sm text-ink-soft">Connecting needs TapMart&apos;s Meta and TikTok app keys. Ask support to enable it.</p>
        )}
      </section>

      {/* ------------------------------------------------------- PERFORMANCE */}
      <section className="mt-10" aria-labelledby="growth-title">
        <h2 id="growth-title" className="eyebrow">{providerName}</h2>

        {growth.source === "unavailable" ? (
          <>
            <p className="mt-3 text-sm text-ink-soft">No connected account yet. Add this month&apos;s numbers yourself or connect Instagram.</p>
            <ManualGrowthForm periodStart={period.start} periodEnd={period.end} />
          </>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-5">
              <Figure value={m.reach === null ? null : compact(m.reach)} label="Reach" />
              <Figure
                value={m.followers_delta === null ? null : `${m.followers_delta > 0 ? "+" : ""}${compact(m.followers_delta)}`}
                label="Followers"
                tone={m.followers_delta !== null && m.followers_delta > 0 ? "signal" : "ink"}
              />
              <Figure value={m.views === null ? null : compact(m.views)} label="Views" />
            </div>
            <p className="mt-4 text-sm text-ink-faint">{sourceLabel}</p>
          </>
        )}
      </section>

      {/* ------------------------------------------------------ BEST CONTENT */}
      {growth.top_post && (
        <section className="mt-10" aria-labelledby="best-title">
          <h2 id="best-title" className="eyebrow">Best content</h2>
          <div className="mt-3 lg:flex lg:items-end lg:gap-8">
            <TopPostTile
              title={growth.top_post.title} thumb={growth.top_post.thumbnail_url}
              views={growth.top_post.views} href={growth.top_post.href} businessName={business.name} logo={business.logo_url ?? null}
            />
            <div className="mt-4 lg:mt-0 lg:flex-1 lg:pb-1">
              <p className="hidden text-sm text-ink-soft lg:block">Your best post this period. Make the next one from what is trending.</p>
              <Link href="/business/trends" className="btn btn-signal btn-lg mt-0 w-full lg:mt-4">Do another</Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function Figure({ value, label, tone = "ink" }: { value: string | null; label: string; tone?: "ink" | "signal" }) {
  return (
    <div className="min-w-0">
      {value !== null ? (
        <p className={`tnum settle truncate font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] md:text-[2.25rem] ${tone === "signal" ? "text-signal" : "text-ink"}`}>{value}</p>
      ) : (
        <p className="truncate font-display text-[1.125rem] leading-none font-700 text-ink-faint md:text-[1.25rem]">No data</p>
      )}
      <p className="mt-1.5 text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function TopPostTile({
  title, thumb, views, href, businessName, logo,
}: { title: string; thumb: string | null; views: number | null; href: string | null; businessName: string; logo: string | null }) {
  const body = (
    <>
      {thumb ? (
        <MediaPreview src={thumb} alt="" className="h-full w-full object-cover" sizes="(min-width: 1024px) 18rem, 100vw" />
      ) : (
        <NoPhoto name={businessName} logo={logo} />
      )}
      <span className="media-scrim absolute inset-0 flex flex-col justify-end p-4">
        <span className="line-clamp-2 font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em] text-white">{title}</span>
        {views !== null && <span className="tnum mt-1 text-sm text-white/80">{views.toLocaleString("en-US")} views</span>}
      </span>
      {href && (
        <span className="glass-tag absolute top-3 right-3 flex h-9 w-9 items-center justify-center text-white">
          <CaretRight size={18} aria-hidden />
        </span>
      )}
    </>
  );
  const cls = "relative block aspect-[4/5] w-full max-w-[22rem] overflow-hidden rounded-[var(--radius-card)] bg-surface-2 lg:w-72 lg:shrink-0";
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls} aria-label={`${title} (opens in a new tab)`}>{body}</a>
  ) : (
    <div className={cls}>{body}</div>
  );
}
