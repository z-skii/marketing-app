import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { formatCredit } from "@/lib/money";
import { getSubscription } from "@/lib/v2/subscriptions";
import { PLAN_BY_KEY } from "@/config/plans";
import { Money, ScreenHeader, SectionTitle, Stat, StatusChip } from "@/components/v2/ui";
import { IdeaCard } from "./IdeaCard";

export const metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

function greeting(hour: number) {
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const KIND_SHORT: Record<string, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car ad" };

/**
 * Business overview: what needs your attention, what this month cost and
 * produced, the three things you can run, and trends and ideas that become
 * campaigns in one tap. Every number comes from the ledger and the tables.
 */
export default async function BusinessOverview() {
  const ctx = await requireBusinessContext();
  const business = ctx.activeBusiness;

  const [attention, campaigns, recs, wallet, month, subscription] = await Promise.all([
    sqlOne<{ reels: string; stories: string; car_apps: string; artwork: string; proofs: string; posts: string }>(
      `select
         (select count(*) from submissions s join campaigns c on c.id = s.campaign_id
           where c.business_id = $1 and c.kind = 'recreate_reel' and s.status in ('submitted', 'under_review'))::text as reels,
         (select count(*) from submissions s join campaigns c on c.id = s.campaign_id
           where c.business_id = $1 and c.kind = 'instagram_story' and s.status in ('submitted', 'under_review'))::text as stories,
         (select count(*) from applications a join campaigns c on c.id = a.campaign_id
           where c.business_id = $1 and c.kind = 'car_ads' and a.status = 'applied')::text as car_apps,
         (select count(*) from car_bookings k where k.business_id = $1 and k.status = 'creative_pending')::text as artwork,
         (select count(*) from car_proofs p join car_bookings k on k.id = p.booking_id
           where k.business_id = $1 and p.created_at > now() - interval '7 days')::text as proofs,
         (select count(*) from calendar_posts p where p.business_id = $1 and p.status = 'needs_approval')::text as posts`,
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
        order by c.created_at desc limit 6`,
      [business.id],
    ),
    sql<{ id: string; kind: string; title: string; body: string; stat: string | null; reference_url: string | null; prefill_kind: string | null }>(
      `select id, kind, title, body, stat, reference_url, prefill->>'kind' as prefill_kind
         from marketing_recommendations
        where business_id = $1 and status = 'new' order by (kind = 'trend') desc, created_at desc limit 4`,
      [business.id],
    ),
    sqlOne<{ cents: string }>(
      `select w.available_credit_cents::text as cents from wallets w
        join businesses b on b.owner_id = w.user_id where b.id = $1`,
      [business.id],
    ),
    sqlOne<{ spent: string; content: string; active: string; cars: string }>(
      `select
         (select coalesce(sum(-l.amount_cents), 0) from credit_ledger l
           join businesses b on b.owner_id = l.user_id
          where b.id = $1 and l.amount_cents < 0 and l.transaction_type = 'campaign_payment'
            and l.created_at >= date_trunc('month', now()))::text as spent,
         (select count(*) from submissions s join campaigns c on c.id = s.campaign_id
           where c.business_id = $1 and s.status in ('approved', 'paid')
             and coalesce(s.reviewed_at, s.created_at) >= date_trunc('month', now()))::text as content,
         (select count(*) from campaigns c where c.business_id = $1 and c.status = 'open'
             and c.kind in ('recreate_reel', 'instagram_story', 'car_ads'))::text as active,
         (select count(*) from car_bookings k where k.business_id = $1 and k.status = 'active')::text as cars`,
      [business.id],
    ),
    getSubscription(business.id),
  ]);

  const n = (v: string | undefined) => Number(v ?? 0);
  const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
  const items = [
    n(attention?.reels) > 0 && {
      href: "/business/campaigns?needs=review", count: n(attention!.reels),
      title: plural(n(attention!.reels), "Reel submission", "Reel submissions"), sub: "Ready to review. Approve to pay.", cta: "Review",
    },
    n(attention?.stories) > 0 && {
      href: "/business/campaigns?needs=review", count: n(attention!.stories),
      title: plural(n(attention!.stories), "Story proof", "Story proofs"), sub: "Check the screenshot and link, then approve.", cta: "Verify",
    },
    n(attention?.car_apps) > 0 && {
      href: "/business/campaigns?needs=drivers", count: n(attention!.car_apps),
      title: plural(n(attention!.car_apps), "Car application", "Car applications"), sub: "Drivers waiting for your approval.", cta: "See drivers",
    },
    n(attention?.artwork) > 0 && {
      href: "/business/campaigns?needs=artwork", count: n(attention!.artwork),
      title: plural(n(attention!.artwork), "Car needs artwork", "Cars need artwork"), sub: "Accepted drivers are waiting on the decal.", cta: "Send artwork",
    },
    n(attention?.posts) > 0 && {
      href: "/business/content", count: n(attention!.posts),
      title: plural(n(attention!.posts), "Post waiting for approval", "Posts waiting for approval"), sub: "In your content calendar.", cta: "Approve",
    },
  ].filter(Boolean) as { href: string; count: number; title: string; sub: string; cta: string }[];

  const credit = n(wallet?.cents);
  const hour = new Date().getUTCHours();
  const trends = recs.filter((r) => r.kind === "trend");
  const ideas = recs.filter((r) => r.kind === "idea");

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader
        kicker={business.name}
        title={`${greeting(hour)}, ${business.name}`}
        wrap
        unread={ctx.unreadNotifications}
        showSearch={false}
        right={
          <Link href={`/b/${business.slug}`} className="hidden font-display text-sm font-600 text-ink-soft hover:text-ink md:inline">
            Public page →
          </Link>
        }
      />
      <p className="mt-2 text-[1.0625rem] text-ink-soft">
        {items.length === 0
          ? "Nothing is waiting on you right now."
          : `${items.length} thing${items.length === 1 ? "" : "s"} need${items.length === 1 ? "s" : ""} your attention.`}
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <div className="min-w-0">
          {items.length > 0 && (
            <section className="flex flex-col gap-3" aria-label="Needs your attention">
              {items.map((item, i) => (
                <div key={item.title} className={`card flex items-center gap-4 p-4 md:p-5 ${i === 0 ? "card-signal" : ""}`}>
                  <span className="tnum w-12 shrink-0 font-display text-[2.25rem] leading-none font-800 text-signal">{item.count}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{item.title.replace(/^\d+ /, "")}</span>
                    <span className="mt-1 block text-sm text-ink-soft">{item.sub}</span>
                  </span>
                  <Link href={item.href} className={`btn ${i === 0 ? "btn-signal" : ""} btn-sm shrink-0`}>{item.cta}</Link>
                </div>
              ))}
            </section>
          )}

          <section className={`card ${items.length > 0 ? "mt-6" : ""} p-5`} aria-label="This month">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-800 tracking-[-0.02em]">This month</h2>
              <Link href="/business/billing" className="font-display text-sm font-600 text-ink-soft hover:text-ink">Billing →</Link>
            </div>
            <div className="mt-4 grid grid-cols-[1.4fr_1fr_1fr] gap-4">
              <Stat tone="signal" value={formatCredit(n(month?.spent))} label="Marketing spend" sub={n(month?.spent) > 0 ? "Paid to people" : "You only pay on approval"} />
              <Stat value={n(month?.active)} label="Active campaigns" sub={n(month?.cars) > 0 ? `${n(month?.cars)} on cars` : undefined} />
              <Stat value={n(month?.content)} label="Content created" />
            </div>
          </section>

          <section className="mt-6" aria-label="Quick actions">
            <SectionTitle>Run something</SectionTitle>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <Tile href="/business/create/recreate" primary title="Recreate a Reel" sub="Pay per approved video" />
              <Tile href="/business/create/story" title="Run Story ads" sub="Real people, real followers" />
              <Tile href="/business/create/car" title="Advertise on cars" sub="Monthly, around your city" />
            </div>
          </section>

          {trends.length > 0 && (
            <section className="mt-8" aria-label="Trending for your business">
              <SectionTitle action={{ href: "/business/trends", label: "See all" }}>Trending for your business</SectionTitle>
              <div className="mt-3 flex flex-col gap-3">
                {trends.map((t) => (
                  <IdeaCard key={t.id} id={t.id} businessId={business.id} title={t.title} body={t.body} stat={t.stat} referenceUrl={t.reference_url} kind={t.prefill_kind} trend />
                ))}
              </div>
            </section>
          )}

          {ideas.length > 0 && (
            <section className="mt-8" aria-label="Ideas for your business">
              <SectionTitle>Ideas for your business</SectionTitle>
              <div className="mt-3 flex flex-col gap-3">
                {ideas.map((idea) => (
                  <IdeaCard key={idea.id} id={idea.id} businessId={business.id} title={idea.title} body={idea.body} kind={idea.prefill_kind} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="mt-8 lg:mt-0">
          <SectionTitle count={campaigns.length} action={{ href: "/business/campaigns", label: "All" }}>Campaigns</SectionTitle>
          {campaigns.length === 0 ? (
            <p className="card mt-3 p-4 text-sm text-ink-soft">
              Nothing running yet. Start with a Reel, a Story or a car.
            </p>
          ) : (
            <ul className="row-list mt-3">
              {campaigns.map((c) => {
                const pct = c.slots > 0 ? Math.min(100, Math.round((c.approved / c.slots) * 100)) : 0;
                return (
                  <li key={c.id}>
                    <Link href={`/business/campaigns/${c.id}`} className="card block p-4">
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block text-xs font-700 text-ink-faint">{KIND_SHORT[c.kind] ?? c.kind}</span>
                          <span className="block font-display text-base leading-tight font-800 tracking-[-0.01em]">{c.title}</span>
                        </span>
                        <Money cents={c.pay_cents} size="sm" suffix={c.kind === "car_ads" ? "/ mo" : undefined} />
                      </span>
                      <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <span className="block h-full rounded-full bg-signal" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="mt-2 flex items-center justify-between gap-2 text-sm text-ink-faint">
                        <span>{c.approved} of {c.slots}{c.waiting > 0 ? ` · ${c.waiting} waiting` : ""}</span>
                        <StatusChip status={c.status} />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="card mt-6 p-4">
            <p className="text-sm text-ink-soft">Your plan</p>
            {subscription && subscription.status !== "cancelled" ? (
              <>
                <p className="mt-1 font-display text-[1.125rem] font-800 tracking-[-0.02em]">TapMart {PLAN_BY_KEY[subscription.plan].name}</p>
                <p className="text-sm text-ink-faint">{subscription.status === "active" ? "Active" : subscription.status.replace("_", " ")}</p>
              </>
            ) : (
              <>
                <p className="mt-1 font-display text-[1.125rem] font-800 tracking-[-0.02em]">No plan yet</p>
                <p className="text-sm text-ink-faint">Pick Essential or Growth to unlock the marketing tools.</p>
              </>
            )}
            <Link href="/business/plan" className="mt-3 inline-block font-display text-sm font-600 text-signal">
              {subscription ? "Manage plan →" : "See plans →"}
            </Link>
          </div>
          <div className="card mt-3 p-4">
            <p className="text-sm text-ink-soft">Campaign credit</p>
            <p className="mt-1"><Money cents={credit} size="lg" /></p>
            <p className="text-sm text-ink-faint">Pays the people who complete your campaigns.</p>
            <Link href="/business/billing" className="mt-3 inline-block font-display text-sm font-600 text-ink-soft hover:text-ink">Add credit →</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Tile({ href, title, sub, primary = false }: { href: string; title: string; sub: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 rounded-[var(--radius-card)] px-4 py-3.5 transition-transform active:scale-[0.99] lg:min-h-28 lg:flex-col lg:items-start lg:justify-between lg:p-4 ${
        primary ? "bg-signal text-signal-ink" : "card-2 text-ink"
      }`}
    >
      <span className="font-display text-[1.0625rem] leading-tight font-800 tracking-[-0.02em]">{title}</span>
      <span className={`text-sm ${primary ? "text-signal-ink/75" : "text-ink-faint"}`}>{sub}</span>
    </Link>
  );
}
