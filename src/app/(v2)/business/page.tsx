import Link from "next/link";
import { CaretRight, CalendarBlank, GoogleLogo } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { formatCredit } from "@/lib/money";
import { getSubscription } from "@/lib/v2/subscriptions";
import { getTrendsForBusiness } from "@/lib/trends";
import { getGrowthSummary } from "@/lib/social/insights";
import { getNextShoot } from "@/lib/business/shoots";
import { getBrandKit } from "@/lib/business/brand";
import { getGoogleSummary } from "@/lib/google/summary";
import { PLAN_BY_KEY } from "@/config/plans";
import { Money, ScreenHeader } from "@/components/v2/ui";
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
function signed(n: number | null) {
  if (n == null) return null;
  return `${n > 0 ? "+" : ""}${compact(n)}`;
}

type Attention = {
  key: string;
  title: string;
  status: string;
  cta: string;
  href: string;
  media: (string | null)[];
  shape: "tall" | "wide" | "square";
  icon?: "google";
  tone?: "alert";
};

/**
 * Business overview: what needs my attention. Each block is the media it is
 * about, one title, one status line and one action. Then the month in
 * three numbers, one trend worth recreating, and a compact rail. Every
 * number is measured or absent.
 */
export default async function BusinessOverview() {
  const ctx = await requireBusinessContext();
  const business = ctx.activeBusiness;

  const [reels, stories, carApps, posts, campaigns, wallet, activeCount, subscription, trends, growth, shoot, brand, google, details] = await Promise.all([
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
    sql<{ id: string; campaign_id: string; media: string | null }>(
      `select a.id, a.campaign_id, coalesce(v.poster_url, (select url from vehicle_photos p where p.vehicle_id = v.id order by created_at limit 1)) as media
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
    sql<{ id: string; kind: string; title: string; pay_cents: number; slots: number; approved: number; waiting: number; media: string | null }>(
      `select c.id, c.kind::text as kind, c.title, c.pay_cents::int as pay_cents, c.slots,
              coalesce(c.details->>'reference_media_url', c.details->>'creative_url', c.details->>'artwork_url') as media,
              (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int
                + (select count(*) from car_bookings k where k.campaign_id = c.id and k.status in ('active', 'completed'))::int as approved,
              (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('submitted', 'under_review'))::int
                + (select count(*) from applications a where a.campaign_id = c.id and a.status = 'applied')::int as waiting
         from campaigns c
        where c.business_id = $1 and c.status in ('open', 'paused')
          and c.kind in ('recreate_reel', 'instagram_story', 'car_ads')
        order by c.created_at desc limit 4`,
      [business.id],
    ),
    sqlOne<{ cents: string }>(
      `select w.available_credit_cents::text as cents from wallets w join businesses b on b.owner_id = w.user_id where b.id = $1`,
      [business.id],
    ),
    sqlOne<{ n: string }>(
      `select count(*)::text as n from campaigns where business_id = $1 and status = 'open' and kind in ('recreate_reel', 'instagram_story', 'car_ads')`,
      [business.id],
    ),
    getSubscription(business.id),
    getTrendsForBusiness(business.id).catch(() => []),
    getGrowthSummary(business.id).catch(() => null),
    getNextShoot(business.id).catch(() => null),
    getBrandKit(business.id).catch(() => null),
    getGoogleSummary(business.id).catch(() => null),
    sqlOne<{ cover_url: string | null }>(`select cover_url from businesses where id = $1`, [business.id]),
  ]);

  const n = (v: string | undefined) => Number(v ?? 0);
  const plural = (c: number, one: string, many: string) => `${c} ${c === 1 ? one : many}`;

  const shootImage =
    shoot?.deliverable_urls?.[0] ?? brand?.kit.image_examples?.[0] ?? details?.cover_url ?? null;

  const attention: Attention[] = [];
  if (reels.length > 0) attention.push({ key: "reels", title: plural(reels.length, "Reel submission", "Reel submissions"), status: "Ready to review", cta: "Review", href: "/business/campaigns?tab=review", media: reels.map((r) => r.media), shape: "tall" });
  if (stories.length > 0) attention.push({ key: "stories", title: plural(stories.length, "Story proof", "Story proofs"), status: "Waiting to be verified", cta: "Verify", href: "/business/campaigns?tab=review", media: stories.map((r) => r.media), shape: "tall" });
  if (carApps.length > 0) attention.push({ key: "cars", title: plural(carApps.length, "driver application", "driver applications"), status: "Waiting for your pick", cta: "Review", href: "/business/campaigns?tab=review", media: carApps.map((r) => r.media), shape: "wide" });
  if (posts.length > 0) attention.push({ key: "posts", title: plural(posts.length, "post", "posts"), status: "Needs approval before it goes out", cta: "Approve", href: "/business/content", media: posts.map((r) => r.media), shape: "square" });
  if (shoot) attention.push({ key: "shoot", title: "Next monthly shoot", status: `${fmtDate(shoot.scheduled_for)} · ${shoot.photos_planned} photos, ${shoot.videos_planned} videos`, cta: "View", href: `/business/content/shoots/${shoot.id}`, media: [shootImage], shape: "wide" });
  if (google?.status === "attention") attention.push({ key: "google", title: "Google needs attention", status: google.issues.slice(0, 2).join(" · "), cta: "Fix", href: google.fixHref, media: [], shape: "square", icon: "google", tone: "alert" });

  const waiting = reels.length + stories.length + carApps.length + posts.length;
  const credit = n(wallet?.cents);
  const hour = new Date().getUTCHours();
  const trend = trends.find((t) => t.media_url || t.thumbnail_url) ?? trends[0] ?? null;
  const plan = subscription && subscription.status !== "cancelled" ? PLAN_BY_KEY[subscription.plan] : null;
  const views = growth?.metrics.views ?? null;
  const reach = growth?.metrics.reach ?? null;
  const followers = growth?.metrics.followers_delta ?? null;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader bell={false} kicker="Overview" title={`${greeting(hour)}, ${business.name}`} wrap unread={ctx.unreadNotifications} showSearch={false} />
      <p className="mt-2 text-[1.0625rem] text-ink-soft">
        {attention.length === 0 ? "Nothing is waiting on you." : waiting > 0 ? `${plural(waiting, "thing needs", "things need")} your attention` : "Nothing is waiting on you. Here is what is coming up."}
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10">
        <div className="min-w-0">
          {attention.length > 0 && (
            <ul className="flex flex-col gap-2.5" aria-label="Needs your attention">
              {attention.map((a, i) => (
                <li key={a.key} className="reveal" style={{ animationDelay: `${i * 60}ms` }}>
                  <Link href={a.href} className="flex items-center gap-3 rounded-[var(--radius-card)] bg-surface p-3 pr-3.5 md:gap-4">
                    <AttentionMedia item={a} />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block font-display text-[1.0625rem] leading-[1.15] font-800 tracking-[-0.02em]">{a.title}</span>
                      <span className={`mt-1 line-clamp-2 block text-sm leading-snug ${a.tone === "alert" ? "alert-text" : "text-ink-soft"}`}>{a.status}</span>
                    </span>
                    <span className={`btn btn-sm shrink-0 ${i === 0 ? "btn-signal" : ""}`}>{a.cta}<CaretRight size={16} weight="bold" aria-hidden /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* This month: three numbers, nothing else. */}
          <section className={attention.length > 0 ? "mt-9" : ""} aria-label="This month">
            <div className="flex items-baseline justify-between">
              <h2 className="eyebrow">This month</h2>
              <Link href="/business/social" className="link-row text-sm">Social<CaretRight size={14} aria-hidden /></Link>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4">
              <Figure value={compact(views)} label="Views" tone="signal" />
              <Figure value={reach != null ? compact(reach) : signed(followers)} label={reach != null ? "Reach" : "Followers"} />
              <Figure value={String(n(activeCount?.n))} label={n(activeCount?.n) === 1 ? "Active campaign" : "Active campaigns"} />
            </div>
            {growth?.source === "unavailable" && (
              <p className="mt-2 text-sm text-ink-faint">Views and reach appear once Instagram is connected or you add this month&apos;s numbers.</p>
            )}
          </section>

          {trend && (
            <section className="mt-9" aria-label="Trending for you">
              <div className="flex items-baseline justify-between">
                <h2 className="eyebrow">Trending for you</h2>
                <Link href="/business/trends" className="link-row text-sm">See all<CaretRight size={14} aria-hidden /></Link>
              </div>
              <div className="mt-3">
                <TrendCard trend={trend} large />
              </div>
            </section>
          )}
        </div>

        {/* Rail: running campaigns with their media, then plan and credit as rows. */}
        <aside className="mt-10 lg:mt-0">
          <div className="flex items-baseline justify-between">
            <h2 className="eyebrow">Running</h2>
            <Link href="/business/campaigns" className="link-row text-sm">All<CaretRight size={14} aria-hidden /></Link>
          </div>
          {campaigns.length === 0 ? (
            <Link href="/business/create" className="btn btn-signal mt-3 w-full">Create a campaign</Link>
          ) : (
            <ul className="mt-2 divide-y divide-rule">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <Link href={`/business/campaigns/${c.id}`} className="flex items-center gap-3 py-2.5">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-surface-2">
                      {c.media && <MediaPreview src={c.media} className="absolute inset-0 h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 font-display text-[0.9375rem] leading-tight font-700">{c.title}</span>
                      <span className="tnum mt-0.5 block text-xs text-ink-faint">
                        {KIND_SHORT[c.kind] ?? c.kind} · {c.approved} / {c.slots}
                        {c.waiting > 0 && <span className="font-700 text-signal"> · {c.waiting} waiting</span>}
                      </span>
                    </span>
                    <Money cents={c.pay_cents} size="sm" suffix={c.kind === "car_ads" ? "/ mo" : undefined} />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <ul className="mt-6 divide-y divide-rule">
            <li>
              <Link href="/business/plan" className="flex min-h-14 items-center justify-between gap-3 py-3">
                <span className="font-display text-[1rem] font-700">{plan ? `${plan.name} plan` : "No plan yet"}</span>
                <span className="flex items-center gap-1 text-sm text-ink-faint">{plan ? (subscription!.status === "active" ? "Active" : subscription!.status.replace("_", " ")) : "See plans"}<CaretRight size={16} aria-hidden /></span>
              </Link>
            </li>
            <li>
              <Link href="/business/billing" className="flex min-h-14 items-center justify-between gap-3 py-3">
                <span className="font-display text-[1rem] font-700">Campaign credit</span>
                <span className="flex items-center gap-1"><span className="tnum font-display font-700">{formatCredit(credit)}</span><CaretRight size={16} className="text-ink-faint" aria-hidden /></span>
              </Link>
            </li>
          </ul>
        </aside>
      </div>
    </main>
  );
}

function AttentionMedia({ item }: { item: Attention }) {
  if (item.icon === "google") {
    return (
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-ink">
        <GoogleLogo size={30} weight="bold" aria-hidden />
      </span>
    );
  }
  const media = item.media.filter((m): m is string => Boolean(m)).slice(0, 3);
  if (media.length === 0) {
    return (
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-ink-soft">
        <CalendarBlank size={28} aria-hidden />
      </span>
    );
  }
  const single = media.length === 1;
  const w = item.shape === "tall" ? "w-12" : "w-16";
  return (
    <span className={`flex shrink-0 ${single ? "" : "-space-x-3"}`}>
      {media.map((m, k) => (
        <span key={k} className={`relative h-16 ${single && item.shape !== "tall" ? "w-[5.25rem]" : w} overflow-hidden rounded-[8px] bg-surface-2 ring-2 ring-surface`} style={{ zIndex: 3 - k }}>
          <MediaPreview src={m} className="absolute inset-0 h-full w-full object-cover" />
        </span>
      ))}
    </span>
  );
}

function Figure({ value, label, tone = "ink" }: { value: string | null; label: string; tone?: "ink" | "signal" }) {
  const faint = value == null;
  return (
    <div className="min-w-0">
      <p className={`tnum truncate font-display leading-none font-800 tracking-[-0.03em] ${faint ? "text-[1.125rem] text-ink-faint" : `text-[1.875rem] ${tone === "signal" ? "text-signal" : "text-ink"}`}`}>{value ?? "No data"}</p>
      <p className="mt-1.5 text-sm text-ink-soft">{label}</p>
    </div>
  );
}
