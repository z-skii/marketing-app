import Link from "next/link";
import { CaretRight, CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { formatCredit } from "@/lib/money";
import { getSubscription } from "@/lib/v2/subscriptions";
import { getTrendsForBusiness } from "@/lib/trends";
import { getGrowthSummary } from "@/lib/social/insights";
import { getNextShoot } from "@/lib/business/shoots";
import { PLAN_BY_KEY } from "@/config/plans";
import { Money, ScreenHeader, StatusChip } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { TrendCard } from "./trends/TrendCard";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

function greeting(hour: number) {
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const KIND_SHORT: Record<string, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car ad" };

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}
function compact(n: number | null) {
  if (n == null) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/**
 * Business overview. What needs attention, shown with the media it is
 * about; the month in three numbers; the one trend worth recreating; the
 * next shoot. Every number is measured or absent.
 */
export default async function BusinessOverview() {
  const ctx = await requireBusinessContext();
  const business = ctx.activeBusiness;

  const [reels, stories, carApps, posts, campaigns, wallet, month, subscription, trends, growth, shoot] = await Promise.all([
    sql<{ id: string; campaign_id: string; media: string | null }>(
      `select s.id, s.campaign_id, s.media_urls[1] as media from submissions s join campaigns c on c.id = s.campaign_id
        where c.business_id = $1 and c.kind = 'recreate_reel' and s.status in ('submitted', 'under_review')
        order by s.created_at desc limit 6`,
      [business.id],
    ),
    sql<{ id: string; campaign_id: string; media: string | null }>(
      `select s.id, s.campaign_id, coalesce(s.media_urls[1], c.details->>'creative_url') as media
         from submissions s join campaigns c on c.id = s.campaign_id
        where c.business_id = $1 and c.kind = 'instagram_story' and s.status in ('submitted', 'under_review')
        order by s.created_at desc limit 6`,
      [business.id],
    ),
    sql<{ id: string; campaign_id: string; media: string | null; name: string }>(
      `select a.id, a.campaign_id, coalesce(v.poster_url, (select url from vehicle_photos p where p.vehicle_id = v.id order by created_at limit 1)) as media,
              concat(v.year, ' ', v.make, ' ', v.model) as name
         from applications a join campaigns c on c.id = a.campaign_id left join vehicles v on v.id = a.vehicle_id
        where c.business_id = $1 and c.kind = 'car_ads' and a.status = 'applied'
        order by a.created_at desc limit 6`,
      [business.id],
    ),
    sql<{ id: string; media: string | null }>(
      `select id, coalesce(thumbnail_url, media_urls[1]) as media from calendar_posts
        where business_id = $1 and status = 'needs_approval' order by coalesce(scheduled_for, created_at) limit 6`,
      [business.id],
    ),
    sql<{ id: string; kind: string; title: string; status: string; pay_cents: number; slots: number; approved: number; waiting: number }>(
      `select c.id, c.kind::text as kind, c.title, c.status::text as status, c.pay_cents::int as pay_cents, c.slots,
              (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int
                + (select count(*) from car_bookings k where k.campaign_id = c.id and k.status in ('active', 'completed'))::int as approved,
              (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('submitted', 'under_review'))::int
                + (select count(*) from applications a where a.campaign_id = c.id and a.status = 'applied')::int as waiting
         from campaigns c
        where c.business_id = $1 and c.status in ('draft', 'open', 'paused')
          and c.kind in ('recreate_reel', 'instagram_story', 'car_ads')
        order by c.created_at desc limit 5`,
      [business.id],
    ),
    sqlOne<{ cents: string }>(
      `select w.available_credit_cents::text as cents from wallets w join businesses b on b.owner_id = w.user_id where b.id = $1`,
      [business.id],
    ),
    sqlOne<{ spent: string; content: string }>(
      `select
         (select coalesce(sum(-l.amount_cents), 0) from credit_ledger l join businesses b on b.owner_id = l.user_id
           where b.id = $1 and l.amount_cents < 0 and l.transaction_type = 'campaign_payment'
             and l.created_at >= date_trunc('month', now()))::text as spent,
         (select count(*) from submissions s join campaigns c on c.id = s.campaign_id
           where c.business_id = $1 and s.status in ('approved', 'paid')
             and coalesce(s.reviewed_at, s.created_at) >= date_trunc('month', now()))::text as content`,
      [business.id],
    ),
    getSubscription(business.id),
    getTrendsForBusiness(business.id).catch(() => []),
    getGrowthSummary(business.id).catch(() => null),
    getNextShoot(business.id).catch(() => null),
  ]);

  const n = (v: string | undefined) => Number(v ?? 0);
  const attention = [
    reels.length > 0 && { key: "reels", count: reels.length, label: reels.length === 1 ? "recreation to review" : "recreations to review", cta: "Review", href: "/business/campaigns?needs=review", media: reels.map((r) => r.media), ratio: "aspect-[9/16]" },
    stories.length > 0 && { key: "stories", count: stories.length, label: stories.length === 1 ? "Story proof to verify" : "Story proofs to verify", cta: "Verify", href: "/business/campaigns?needs=review", media: stories.map((r) => r.media), ratio: "aspect-[9/16]" },
    carApps.length > 0 && { key: "cars", count: carApps.length, label: carApps.length === 1 ? "driver waiting" : "drivers waiting", cta: "Review", href: "/business/campaigns?needs=drivers", media: carApps.map((r) => r.media), ratio: "aspect-[4/3]" },
    posts.length > 0 && { key: "posts", count: posts.length, label: posts.length === 1 ? "post to approve" : "posts to approve", cta: "Approve", href: "/business/content", media: posts.map((r) => r.media), ratio: "aspect-square" },
  ].filter(Boolean) as { key: string; count: number; label: string; cta: string; href: string; media: (string | null)[]; ratio: string }[];

  const views = growth?.metrics.views ?? null;
  const credit = n(wallet?.cents);
  const hour = new Date().getUTCHours();
  const trend = trends.find((t) => t.media_url || t.thumbnail_url) ?? trends[0] ?? null;
  const plan = subscription && subscription.status !== "cancelled" ? PLAN_BY_KEY[subscription.plan] : null;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader kicker={business.name} title={`${greeting(hour)}, ${business.name}`} wrap unread={ctx.unreadNotifications} showSearch={false} />
      <p className="mt-2 text-[1.0625rem] text-ink-soft">
        {attention.length === 0 ? "Nothing is waiting on you." : `${attention.reduce((s, a) => s + a.count, 0)} need your attention`}
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10">
        <div className="min-w-0">
          {/* Needs attention: the media, the count, one verb. */}
          {attention.length > 0 && (
            <ul className="flex flex-col gap-3" aria-label="Needs your attention">
              {attention.map((a, i) => (
                <li key={a.key} className="reveal" style={{ animationDelay: `${i * 70}ms` }}>
                  <Link href={a.href} className="flex items-center gap-4 rounded-[var(--radius-card)] bg-surface p-3">
                    <span className="flex shrink-0 -space-x-3">
                      {a.media.slice(0, 3).map((m, k) => (
                        <span key={k} className={`relative h-16 w-12 overflow-hidden rounded-[8px] bg-surface-2 ring-2 ring-surface ${a.ratio === "aspect-[4/3]" || a.ratio === "aspect-square" ? "w-16" : ""}`} style={{ zIndex: 3 - k }}>
                          {m && <MediaPreview src={m} className="absolute inset-0 h-full w-full object-cover" />}
                        </span>
                      ))}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[1.25rem] leading-none font-800 tracking-[-0.02em]"><span className="text-signal">{a.count}</span> {a.label}</span>
                    </span>
                    <span className={`btn btn-sm shrink-0 ${i === 0 ? "btn-signal" : ""}`}>{a.cta}<CaretRight size={16} weight="bold" aria-hidden /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* This month: three numbers on the page. */}
          <section className={`${attention.length > 0 ? "mt-8" : ""}`} aria-label="This month">
            <h2 className="eyebrow">This month</h2>
            <div className="mt-3 grid grid-cols-3 gap-4">
              <Figure value={formatCredit(n(month?.spent))} label="Spent" tone="signal" />
              <Figure value={String(n(month?.content))} label={n(month?.content) === 1 ? "Piece created" : "Pieces created"} />
              {views != null ? <Figure value={compact(views) ?? "0"} label="Views" /> : <Figure value="No data" label="Views" faint />}
            </div>
            {growth?.source === "unavailable" && (
              <Link href="/business/health" className="link-row mt-1 text-sm">Add this month&apos;s numbers<CaretRight size={14} aria-hidden /></Link>
            )}
          </section>

          {/* Trending: one large trend, one button. */}
          {trend && (
            <section className="mt-8" aria-label="Trending for you">
              <div className="flex items-baseline justify-between">
                <h2 className="eyebrow">Trending for you</h2>
                <Link href="/business/trends" className="link-row text-sm">See all<CaretRight size={14} aria-hidden /></Link>
              </div>
              <div className="mt-3">
                <TrendCard trend={trend} large />
              </div>
            </section>
          )}

          {/* Next shoot */}
          {shoot && (
            <section className="mt-8" aria-label="Next content shoot">
              <h2 className="eyebrow">Next content shoot</h2>
              <Link href="/business/content/shoots" className="mt-3 flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[12px] bg-surface-2 text-ink-soft"><CalendarBlank size={26} aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[1.375rem] leading-none font-800 tracking-[-0.03em]">{fmtDate(shoot.scheduled_for)}</span>
                  <span className="mt-1.5 block text-sm text-ink-soft">{shoot.photos_planned} photos · {shoot.videos_planned} short videos{shoot.assigned_label ? ` · ${shoot.assigned_label}` : ""}</span>
                </span>
                <CaretRight size={18} className="text-ink-faint" aria-hidden />
              </Link>
            </section>
          )}
        </div>

        {/* Rail: campaigns, plan, credit. Rows, not cards. */}
        <aside className="mt-10 lg:mt-0">
          <div className="flex items-baseline justify-between">
            <h2 className="eyebrow">Campaigns</h2>
            <Link href="/business/campaigns" className="link-row text-sm">All<CaretRight size={14} aria-hidden /></Link>
          </div>
          {campaigns.length === 0 ? (
            <Link href="/business/create" className="btn btn-signal mt-3">Run something</Link>
          ) : (
            <ul className="mt-2 divide-y divide-rule">
              {campaigns.map((c) => {
                const pct = c.slots > 0 ? Math.min(100, Math.round((c.approved / c.slots) * 100)) : 0;
                return (
                  <li key={c.id}>
                    <Link href={`/business/campaigns/${c.id}`} className="block py-3">
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-xs font-700 text-ink-faint">{KIND_SHORT[c.kind] ?? c.kind}</span>
                          <span className="line-clamp-1 font-display text-[0.9375rem] leading-tight font-700">{c.title}</span>
                        </span>
                        <Money cents={c.pay_cents} size="sm" suffix={c.kind === "car_ads" ? "/ mo" : undefined} />
                      </span>
                      <span className="mt-2 block h-1 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full bg-signal" style={{ width: `${pct}%` }} /></span>
                      <span className="mt-1.5 flex items-center justify-between text-xs text-ink-faint">
                        <span>{c.approved} of {c.slots}{c.waiting > 0 ? ` · ${c.waiting} waiting` : ""}</span>
                        <StatusChip status={c.status} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <ul className="mt-6 divide-y divide-rule">
            <li>
              <Link href="/business/plan" className="flex min-h-14 items-center justify-between gap-3 py-3">
                <span className="font-display text-[1rem] font-700">{plan ? `TapMart ${plan.name}` : "No plan yet"}</span>
                <span className="flex items-center gap-1 text-sm text-ink-faint">{plan ? (subscription!.status === "active" ? "Active" : subscription!.status.replace("_", " ")) : "See plans"}<CaretRight size={16} aria-hidden /></span>
              </Link>
            </li>
            <li>
              <Link href="/business/billing" className="flex min-h-14 items-center justify-between gap-3 py-3">
                <span className="font-display text-[1rem] font-700">Campaign credit</span>
                <span className="flex items-center gap-1"><Money cents={credit} size="sm" /><CaretRight size={16} className="text-ink-faint" aria-hidden /></span>
              </Link>
            </li>
          </ul>
        </aside>
      </div>
    </main>
  );
}

function Figure({ value, label, tone = "ink", faint = false }: { value: string; label: string; tone?: "ink" | "signal"; faint?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={`tnum truncate font-display leading-none font-800 tracking-[-0.03em] ${faint ? "text-[1.125rem] text-ink-faint" : `text-[1.75rem] ${tone === "signal" ? "text-signal" : "text-ink"}`}`}>{value}</p>
      <p className="mt-1.5 text-sm text-ink-soft">{label}</p>
    </div>
  );
}
