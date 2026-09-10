import Link from "next/link";
import { ArrowSquareOut, CaretRight, CheckCircle, FacebookLogo, GoogleLogo, InstagramLogo, TiktokLogo } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { getSubscription, planPrices } from "@/lib/v2/subscriptions";
import { getBrandKit } from "@/lib/business/brand";
import { listShoots } from "@/lib/business/shoots";
import { getGoogleSummary } from "@/lib/google/summary";
import { getSocialSummary, type PlatformStatus } from "@/lib/social/summary";
import { PLAN_BY_KEY } from "@/config/plans";
import { formatCredit } from "@/lib/money";
import { Avatar, ScreenHeader } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { SwitchToPersonalButton } from "./SwitchButton";

export const metadata = { title: "Business" };
export const dynamic = "force-dynamic";

const PLATFORM_LABEL: Record<PlatformStatus["provider"], string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };
const STATUS_LABEL: Record<PlatformStatus["status"], string> = { connected: "Connected", reconnect: "Needs reconnect", none: "Not connected" };

function compact(n: number | null) {
  if (n == null) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
function signed(n: number | null) {
  if (n == null) return null;
  return `${n > 0 ? "+" : ""}${compact(n)}`;
}
function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

/**
 * The Business tab: four things to look at (brand, social, Google, plan),
 * each a visual section with its own real state and one action, then the
 * quiet rows that manage the rest. Nothing here is estimated.
 */
export default async function BusinessSettingsPage() {
  const ctx = await requireBusinessContext("/business/settings");
  const business = ctx.activeBusiness;

  const [details, subscription, prices, brand, google, social, shoots] = await Promise.all([
    sqlOne<{ category: string | null; city: string | null; verification: string; credit: string }>(
      `select b.category, b.city, b.verification::text as verification,
              coalesce((select w.available_credit_cents from wallets w where w.user_id = b.owner_id), 0)::text as credit
         from businesses b where b.id = $1`,
      [business.id],
    ),
    getSubscription(business.id),
    planPrices(),
    getBrandKit(business.id).catch(() => null),
    getGoogleSummary(business.id).catch(() => null),
    getSocialSummary(business.id).catch(() => null),
    listShoots(business.id, 12).catch(() => []),
  ]);

  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  const plan = active ? PLAN_BY_KEY[active.plan] : null;
  const kit = brand?.kit ?? null;
  const hasKit = Boolean(kit && (kit.palette.length > 0 || kit.logo_url || kit.type.display));
  const improvements = brand?.proposed?.improvements?.length ?? 0;
  const images = (kit?.image_examples ?? []).slice(0, 3);
  const font = kit?.type.display ?? kit?.type.body ?? null;

  const growth = social?.growth ?? null;
  const ig = social?.platforms.find((p) => p.provider === "instagram") ?? null;
  const hasGrowth = growth != null && growth.source !== "unavailable";

  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const thisMonth = shoots.filter((s) => s.scheduled_for?.startsWith(monthKey) && s.status !== "cancelled");
  const remaining = thisMonth.filter((s) => s.status === "planned" || s.status === "scheduled").length;
  const monthName = now.toLocaleDateString("en-US", { month: "long" });

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader bell={false} kicker="Business" title={business.name} wrap unread={ctx.unreadNotifications} showSearch={false}
        right={<Avatar src={business.logo_url} name={business.name} size={48} />}
      />
      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
        {[details?.category, details?.city].filter(Boolean).join(" · ") || "Add a category and city"}
        {details?.verification === "verified" && <CheckCircle size={16} weight="fill" className="text-signal" aria-label="Verified business" />}
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* BRAND */}
        <section aria-label="Brand" className="rounded-[var(--radius-card)] bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow">Brand</h2>
            {hasKit && <Link href="/business/brand" className="link-row text-sm">Refine<CaretRight size={14} aria-hidden /></Link>}
          </div>
          {hasKit && kit ? (
            <>
              <div className="mt-3 flex items-center gap-4">
                {kit.logo_url ?? business.logo_url ? (
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-surface-2">
                    <MediaPreview src={(kit.logo_url ?? business.logo_url)!} className="absolute inset-0 h-full w-full object-cover" />
                  </span>
                ) : (
                  <Avatar src={null} name={business.name} size={64} />
                )}
                <div className="min-w-0">
                  <span className="flex gap-1.5" aria-label={`${kit.palette.length} brand colours`}>
                    {kit.palette.slice(0, 6).map((c, i) => <span key={`${c}${i}`} className="h-6 w-6 rounded-full ring-1 ring-white/10" style={{ background: c }} />)}
                  </span>
                  <p className="mt-1.5 truncate text-sm text-ink-soft">{font ?? "No typeface set"}</p>
                </div>
              </div>
              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {images.map((src, i) => (
                    <span key={i} className="relative aspect-square overflow-hidden rounded-[8px] bg-surface-2">
                      <MediaPreview src={src} className="absolute inset-0 h-full w-full object-cover" />
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm text-ink-soft">{improvements > 0 ? `${improvements} improvement${improvements === 1 ? "" : "s"} available` : brand?.status === "approved" ? "Approved" : "Draft"}</p>
                <Link href="/business/brand" className={`btn btn-sm ${improvements > 0 ? "btn-signal" : ""}`}>{improvements > 0 ? "Review" : "Open"}<CaretRight size={16} weight="bold" aria-hidden /></Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 font-display text-[1.125rem] font-800 tracking-[-0.02em]">No brand kit yet</p>
              <p className="mt-1 text-sm text-ink-soft">Logo, colours, type and the way your photos look.</p>
              <Link href="/business/brand" className="btn btn-signal btn-sm mt-3">Build my brand<CaretRight size={16} weight="bold" aria-hidden /></Link>
            </>
          )}
        </section>

        {/* SOCIAL */}
        <section aria-label="Social" className="rounded-[var(--radius-card)] bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow">Social</h2>
            <Link href="/business/social" className="link-row text-sm">Manage<CaretRight size={14} aria-hidden /></Link>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {(social?.platforms ?? []).map((p) => (
              <li key={p.provider} className="flex items-center gap-3">
                {p.provider === "instagram" ? <InstagramLogo size={22} aria-hidden /> : p.provider === "facebook" ? <FacebookLogo size={22} aria-hidden /> : <TiktokLogo size={22} aria-hidden />}
                <span className="min-w-0 flex-1 truncate text-[0.9375rem]">{PLATFORM_LABEL[p.provider]}{p.handle ? <span className="text-ink-faint"> {p.handle.startsWith("@") ? p.handle : `@${p.handle}`}</span> : null}</span>
                <span className={`shrink-0 text-sm ${p.status === "connected" ? "text-rise" : p.status === "reconnect" ? "alert-text" : "text-ink-faint"}`}>{STATUS_LABEL[p.status]}</span>
              </li>
            ))}
          </ul>
          {hasGrowth && growth ? (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat value={signed(growth.metrics.reach) ?? compact(growth.metrics.reach)} label="Reach" />
              <Stat value={signed(growth.metrics.followers_delta)} label="Followers" />
              <Stat value={compact(growth.metrics.views)} label="Views" />
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-faint">{ig?.status === "connected" ? "No numbers for this period yet." : "Connect Instagram or add this month's numbers to see growth."}</p>
          )}
          {growth?.top_post && (
            <Link href={growth.top_post.href ?? "/business/social"} className="mt-4 flex items-center gap-3">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[8px] bg-surface-2">
                {growth.top_post.thumbnail_url && <MediaPreview src={growth.top_post.thumbnail_url} className="absolute inset-0 h-full w-full object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="eyebrow block !text-[0.625rem]">Best content</span>
                <span className="line-clamp-1 font-display text-[0.9375rem] font-700">{growth.top_post.title}</span>
              </span>
              <span className="btn btn-sm shrink-0">Do another<CaretRight size={16} weight="bold" aria-hidden /></span>
            </Link>
          )}
        </section>

        {/* GOOGLE */}
        <section aria-label="Google" className="rounded-[var(--radius-card)] bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow">Google</h2>
            <Link href="/business/google" className="link-row text-sm">Open<CaretRight size={14} aria-hidden /></Link>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-surface-2"><GoogleLogo size={28} weight="bold" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1.125rem] font-800 tracking-[-0.02em]">
                {google?.status === "attention" ? "Google needs attention" : google?.status === "ok" ? "Google looks good" : "Not checked yet"}
              </p>
              <p className="mt-0.5 text-sm text-ink-soft">
                {google?.score != null ? `${google.score} / 100` : ""}{google?.source === "profile" ? `${google?.score != null ? " · " : ""}From your TapMart profile` : google?.source === "api" ? " · From Google" : ""}
              </p>
            </div>
          </div>
          {google?.issues && google.issues.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 text-sm">
              {google.issues.map((line) => <li key={line} className="flex items-center gap-2"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-alert" aria-hidden />{line}</li>)}
            </ul>
          )}
          <Link href={google?.fixHref ?? "/business/google"} className={`btn btn-sm mt-3 ${google?.status === "attention" ? "btn-signal" : ""}`}>
            {google?.status === "attention" ? "Fix Google" : google?.status === "ok" ? "See checks" : "Run a check"}<CaretRight size={16} weight="bold" aria-hidden />
          </Link>
        </section>

        {/* PLAN */}
        <section aria-label="Plan" className="rounded-[var(--radius-card)] bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="eyebrow">Plan</h2>
            <Link href="/business/billing" className="link-row text-sm">Billing<CaretRight size={14} aria-hidden /></Link>
          </div>
          {plan && active ? (
            <>
              <p className="mt-3 font-display text-[1.375rem] leading-none font-800 tracking-[-0.03em]">
                {plan.name} <span className="text-ink-soft">{formatCredit(prices[plan.key])}/month</span>
              </p>
              <p className="mt-1.5 text-sm text-ink-soft">
                {active.status === "active" ? (fmtDate(active.current_period_end) ? `Next billing ${fmtDate(active.current_period_end)}` : "Active") : active.status === "trialing" ? "Trial" : active.status.replace("_", " ")}
              </p>
              <p className="mt-3 text-sm text-ink">
                <span className="text-ink-faint">{monthName} content · </span>
                {thisMonth.length === 0 ? `${plan.shoots.perMonth} shoot${plan.shoots.perMonth === 1 ? "" : "s"} included` : `${remaining} of ${thisMonth.length} shoot${thisMonth.length === 1 ? "" : "s"} remaining`}
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 font-display text-[1.125rem] font-800 tracking-[-0.02em]">No plan yet</p>
              <p className="mt-1 text-sm text-ink-soft">Essential or Growth. Monthly shoots, calendar, brand and campaigns.</p>
            </>
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-ink-soft">Campaign credit <span className="tnum font-display font-700 text-ink">{formatCredit(Number(details?.credit ?? 0))}</span></span>
            <Link href="/business/plan" className={`btn btn-sm ${plan ? "" : "btn-signal"}`}>{plan ? "Manage plan" : "See plans"}<CaretRight size={16} weight="bold" aria-hidden /></Link>
          </div>
        </section>
      </div>

      {/* The quiet rows. */}
      <ul className="mt-8 divide-y divide-rule">
        <Row href="/business/edit" title="Profile" sub="Name, category, city, hours" />
        <Row href="/business/billing" title="Billing and credit" sub="Top up campaign credit, receipts" />
        <Row href="/business/cars" title="Cars" sub="Vehicles your ads can go on" />
        <Row href={`/b/${business.slug}`} title="Public page" sub={`/b/${business.slug}`} external />
      </ul>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <SwitchToPersonalButton />
        <Link href="/business/new" className="btn w-full sm:w-auto">Add a business</Link>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: string | null; label: string }) {
  return (
    <div className="min-w-0">
      <p className={`tnum truncate font-display leading-none font-800 tracking-[-0.03em] ${value == null ? "text-[1rem] text-ink-faint" : "text-[1.5rem]"}`}>{value ?? "No data"}</p>
      <p className="mt-1 text-xs text-ink-soft">{label}</p>
    </div>
  );
}

function Row({ href, title, sub, external = false }: { href: string; title: string; sub: string; external?: boolean }) {
  const inner = (
    <>
      <span className="min-w-0">
        <span className="block font-display text-[1rem] font-700">{title}</span>
        <span className="block truncate text-sm text-ink-soft">{sub}</span>
      </span>
      {external ? <ArrowSquareOut size={18} className="shrink-0 text-ink-faint" aria-hidden /> : <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />}
    </>
  );
  const cls = "flex min-h-14 items-center justify-between gap-3 py-3";
  return (
    <li>
      {external ? <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a> : <Link href={href} className={cls}>{inner}</Link>}
    </li>
  );
}
