import Link from "next/link";
import { CaretRight, InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { NoPhoto } from "@/components/v2/EarnCards";
import { Avatar, Chip } from "@/components/v2/ui";
import { requireBusinessContext } from "@/lib/v2/core";
import { defaultPeriod, getGrowthSummary } from "@/lib/social/insights";
import { getInstagramBusiness } from "@/lib/social/instagram-business";
import { connectionState, STATE_LABEL } from "@/lib/social/summary";
import { ManualGrowthForm } from "./ManualGrowthForm";

export const metadata = { title: "Instagram insights" };
export const dynamic = "force-dynamic";

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

function synced(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `Synced ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/**
 * Instagram insights: the account as Instagram reports it, this period's
 * growth, the post that did best and the latest posts. Every figure was
 * measured by Instagram or typed in by the business and is labelled as
 * such. Connecting happens under Settings, Connections.
 */
export default async function SocialPage() {
  const ctx = await requireBusinessContext("/business/social");
  const business = ctx.activeBusiness;

  const [ig, growth] = await Promise.all([getInstagramBusiness(business.id), getGrowthSummary(business.id)]);
  const state = connectionState(ig);
  const connected = state === "connected" && ig?.source === "oauth";
  const followers = connected ? ig?.meta.followers ?? null : null;
  const media = connected ? (ig?.meta.media ?? []).slice(0, 12) : [];

  const period = growth.period ?? defaultPeriod();
  const m = growth.metrics;
  const sourceLabel = growth.source === "manual"
    ? `Entered by you · ${periodLabel(period.start, period.end)}`
    : `From Instagram · ${periodLabel(period.start, period.end)}`;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h2 className="eyebrow mt-3">Instagram</h2>
      <h1 className="mt-2 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Insights</h1>

      {/* ----------------------------------------------------------- ACCOUNT */}
      <section className="mt-5 flex items-center gap-3" aria-label="Account">
        {connected && ig?.avatar_url
          ? <Avatar src={ig.avatar_url} name={ig.external_name ?? "Instagram"} size={48} />
          : <InstagramLogo size={40} weight="fill" className="shrink-0 text-ink" aria-hidden />}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[1.0625rem] leading-tight font-700">
            {connected && ig?.external_name ? `@${ig.external_name}` : "No account connected"}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-faint">
            <Chip tone={connected ? "rise" : state === "needs_reconnect" || state === "error" ? "alert" : "faint"}>{STATE_LABEL[state]}</Chip>
            {connected && followers !== null && <span className="tnum">{followers.toLocaleString("en-US")} followers</span>}
            {connected && <span>{synced(ig?.last_synced_at ?? null) ?? "Not synced yet"}</span>}
          </p>
        </div>
        <Link href="/business/settings/connections" className="btn btn-sm shrink-0">
          {connected ? "Manage" : "Connect"}<CaretRight size={16} weight="bold" aria-hidden />
        </Link>
      </section>
      {!connected && (
        <p className="mt-3 text-sm text-ink-soft">Connect Instagram under Settings, Connections to see measured numbers here. Until then you can enter this month&apos;s numbers yourself.</p>
      )}

      {/* ------------------------------------------------------------ GROWTH */}
      <section className="mt-10" aria-labelledby="growth-title">
        <h2 id="growth-title" className="eyebrow">Growth</h2>
        {growth.source === "unavailable" ? (
          <p className="mt-3 text-sm text-ink-soft">No numbers for this period yet.</p>
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
        <ManualGrowthForm periodStart={period.start} periodEnd={period.end} />
      </section>

      {/* ------------------------------------------------------ BEST CONTENT */}
      {growth.top_post && (
        <section className="mt-10" aria-labelledby="best-title">
          <h2 id="best-title" className="eyebrow">Best content</h2>
          <p className="mt-1 text-sm text-ink-faint">{growth.source === "manual" ? "Entered by you" : "From Instagram"}</p>
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

      {/* ------------------------------------------------------ LATEST POSTS */}
      {media.length > 0 && (
        <section className="mt-10" aria-labelledby="posts-title">
          <h2 id="posts-title" className="eyebrow">Latest posts</h2>
          <p className="mt-1 text-sm text-ink-faint">From Instagram</p>
          <ul className="mt-3 grid grid-cols-3 gap-1.5" aria-label="Latest posts">
            {media.map((item, i) => {
              const thumb = item.thumbnail_url ?? item.media_url;
              const body = thumb
                ? <MediaPreview src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />
                : <NoPhoto name={business.name} logo={business.logo_url ?? null} />;
              return (
                <li key={item.id} className="reveal relative aspect-square overflow-hidden rounded-[8px] bg-surface-2" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                  {item.permalink
                    ? <a href={item.permalink} target="_blank" rel="noreferrer" className="absolute inset-0" aria-label={item.caption?.slice(0, 80) || "Instagram post"}>{body}</a>
                    : body}
                </li>
              );
            })}
          </ul>
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
