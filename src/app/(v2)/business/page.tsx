import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { formatCredit } from "@/lib/money";
import { EmptyState, Money, ScreenHeader, SectionTitle, Stat, StatusChip } from "@/components/v2/ui";
import { IdeaCard } from "./IdeaCard";

export const metadata = { title: "Business" };
export const dynamic = "force-dynamic";

function greeting(hour: number) {
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The business dashboard: what needs you now, what this month cost and
 * produced, the four things you do most, and ideas that become campaigns
 * in one tap. Every number comes from the ledger and the tables.
 */
export default async function BusinessPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const business = ctx.businesses[0] ?? null;

  if (!business) {
    return (
      <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
        <ScreenHeader title="Your business" unread={ctx.unreadNotifications} showSearch={false} />
        <div className="mt-6">
          <EmptyState
            title="Add your business"
            body="Hire creators, get photos, put your name on cars. Name, category and city is all it takes to start."
            actionHref="/business/new" actionLabel="Add business"
          />
        </div>
      </main>
    );
  }

  const [attention, campaigns, ideas, wallet, month] = await Promise.all([
    sqlOne<{ pending_subs: string; countered: string; approvals: string; upcoming: string; applicants: string }>(
      `select
         (select count(*) from submissions s join campaigns c on c.id = s.campaign_id
           where c.business_id = $1 and s.status in ('submitted', 'under_review'))::text as pending_subs,
         (select count(*) from car_offers o where o.business_id = $1 and o.status = 'countered')::text as countered,
         (select count(*) from calendar_posts p where p.business_id = $1 and p.status = 'needs_approval')::text as approvals,
         (select count(*) from campaigns c where c.business_id = $1 and c.status = 'open'
            and c.event_at between now() and now() + interval '48 hours')::text as upcoming,
         (select count(*) from applications a join campaigns c on c.id = a.campaign_id
           where c.business_id = $1 and a.status = 'applied')::text as applicants`,
      [business.id],
    ),
    sql<{ id: string; title: string; status: string; pay_cents: number; slots: number; approved: number; submitted: number }>(
      `select c.id, c.title, c.status::text as status, c.pay_cents::int as pay_cents, c.slots,
              (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int as approved,
              (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('submitted', 'under_review'))::int as submitted
         from campaigns c where c.business_id = $1 and c.status in ('draft', 'open', 'paused')
        order by c.created_at desc limit 8`,
      [business.id],
    ),
    sql<{ id: string; title: string; body: string }>(
      `select id, title, body from marketing_recommendations
        where business_id = $1 and status = 'new' order by created_at desc limit 3`,
      [business.id],
    ),
    sqlOne<{ cents: string }>(
      `select w.available_credit_cents::text as cents from wallets w
        join businesses b on b.owner_id = w.user_id where b.id = $1`,
      [business.id],
    ),
    sqlOne<{ spent: string; approved: string; active: string; bookings: string }>(
      `select
         (select coalesce(sum(-l.amount_cents), 0) from credit_ledger l
           join businesses b on b.owner_id = l.user_id
          where b.id = $1 and l.amount_cents < 0
            and l.created_at >= date_trunc('month', now()))::text as spent,
         (select count(*) from submissions s join campaigns c on c.id = s.campaign_id
           where c.business_id = $1 and s.status in ('approved', 'paid')
             and coalesce(s.reviewed_at, s.created_at) >= date_trunc('month', now()))::text as approved,
         (select count(*) from campaigns c where c.business_id = $1 and c.status = 'open')::text as active,
         (select count(*) from car_bookings k where k.business_id = $1 and k.status = 'active')::text as bookings`,
      [business.id],
    ),
  ]);

  const n = (v: string | undefined) => Number(v ?? 0);
  const items = [
    n(attention?.pending_subs) > 0 && {
      href: "/business/review", count: n(attention!.pending_subs),
      title: `Creator submission${n(attention!.pending_subs) === 1 ? "" : "s"} to review`,
      sub: "Approve to pay them. Money leaves your wallet only when you say so.",
      cta: "Review",
    },
    n(attention?.applicants) > 0 && {
      href: "/business/review", count: n(attention!.applicants),
      title: `Applicant${n(attention!.applicants) === 1 ? "" : "s"} waiting for a decision`,
      sub: "Pick who gets the job before the date passes.",
      cta: "See applicants",
    },
    n(attention?.countered) > 0 && {
      href: "/business/car-ads", count: n(attention!.countered),
      title: `Driver counter-offer${n(attention!.countered) === 1 ? "" : "s"}`,
      sub: "A driver named a different monthly price.",
      cta: "Answer",
    },
    n(attention?.approvals) > 0 && {
      href: "/business/calendar", count: n(attention!.approvals),
      title: `Post${n(attention!.approvals) === 1 ? "" : "s"} waiting for approval`,
      sub: "Ready in your content calendar.",
      cta: "Approve",
    },
    n(attention?.upcoming) > 0 && {
      href: "/business/review", count: n(attention!.upcoming),
      title: "Shoot in the next 48 hours",
      sub: "Make sure the place and the people are ready.",
      cta: "Details",
    },
  ].filter(Boolean) as { href: string; count: number; title: string; sub: string; cta: string }[];

  const credit = n(wallet?.cents);
  const hour = new Date().getUTCHours();
  const firstName = (ctx.user.displayName ?? ctx.user.username).split(" ")[0];

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader
        kicker={business.name}
        title={`${greeting(hour)}, ${firstName} 👋`}
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

      <div className="mt-6 md:grid md:grid-cols-[minmax(0,1fr)_20rem] md:gap-8">
        <div className="min-w-0">
          {items.length > 0 && (
            <section className="flex flex-col gap-3" aria-label="Needs your attention">
              {items.map((item, i) => (
                <div key={item.title} className={`card flex items-center gap-4 p-4 md:p-5 ${i === 0 ? "card-signal" : ""}`}>
                  <span className="tnum w-12 shrink-0 font-display text-[2.25rem] leading-none font-800 text-signal">{item.count}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{item.title}</span>
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
              <Link href="/wallet" className="font-display text-sm font-600 text-ink-soft hover:text-ink">Wallet →</Link>
            </div>
            <div className="mt-4 grid grid-cols-[1.4fr_1fr_1fr] gap-4">
              <Stat tone="signal" value={formatCredit(n(month?.spent))} label="Spent on marketing" sub={n(month?.spent) > 0 ? "Paid out to people" : "You only pay on approval"} />
              <Stat value={n(month?.approved)} label="Content approved" />
              <Stat value={n(month?.active) + n(month?.bookings)} label="Running now" sub={n(month?.bookings) > 0 ? `${n(month?.bookings)} on cars` : undefined} />
            </div>
          </section>

          <section className="mt-6" aria-label="Quick actions">
            <div className="grid grid-cols-2 gap-3">
              <Tile href="/create" primary title="Hire creators" sub="UGC, content, photo and video" />
              <Tile href="/cars?tab=browse" title="Advertise on cars" sub="Rent space on real cars" />
              <Tile href="/business/calendar" title="Content calendar" sub="Plan and approve posts" />
              <Tile href="/wallet/add" title="Add credit" sub={`${formatCredit(credit)} available`} />
            </div>
          </section>

          {ideas.length > 0 && (
            <section className="mt-8" aria-label="Ideas for your business">
              <SectionTitle>Ideas for your business</SectionTitle>
              <p className="mt-1 text-sm text-ink-faint">Based on what businesses like yours are running. One tap turns any of them into a campaign.</p>
              <div className="mt-3 flex flex-col gap-3">
                {ideas.map((idea) => (
                  <IdeaCard key={idea.id} id={idea.id} businessId={business.id} title={idea.title} body={idea.body} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="mt-8 md:mt-0">
          <SectionTitle count={campaigns.length} action={{ href: "/create", label: "+ New" }}>Campaigns</SectionTitle>
          {campaigns.length === 0 && (
            <div className="mt-3">
              <EmptyState
                title="No campaigns yet"
                body="Turn your next idea into paid creator content."
                actionHref="/create" actionLabel="Create campaign"
              />
            </div>
          )}
          <ul className="row-list mt-3">
            {campaigns.map((c) => {
              const pct = c.slots > 0 ? Math.min(100, Math.round((c.approved / c.slots) * 100)) : 0;
              return (
                <li key={c.id}>
                  <Link href={`/jobs/${c.id}`} className="card block p-4">
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0 font-display text-base leading-tight font-800 tracking-[-0.01em]">{c.title}</span>
                      <Money cents={c.pay_cents} size="sm" />
                    </span>
                    <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <span className="block h-full rounded-full bg-signal" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="mt-2 flex items-center justify-between gap-2 text-sm text-ink-faint">
                      <span>{c.approved} of {c.slots} approved{c.submitted > 0 ? ` · ${c.submitted} waiting` : ""}</span>
                      <StatusChip status={c.status} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-col gap-1 px-1 text-sm">
            <Link href="/business/edit" className="text-ink-soft hover:text-ink">Edit business and brand kit</Link>
            <Link href="/business/connections" className="text-ink-soft hover:text-ink">Connected accounts</Link>
            <Link href="/business/car-ads" className="text-ink-soft hover:text-ink">Car ad offers and bookings</Link>
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
      className={`flex min-h-24 flex-col gap-1.5 rounded-[var(--radius-card)] p-4 transition-transform active:scale-[0.99] md:min-h-28 md:justify-between md:gap-0 ${
        primary ? "bg-signal text-signal-ink" : "card-2 text-ink"
      }`}
    >
      <span className="font-display text-[1.0625rem] leading-tight font-800 tracking-[-0.02em]">{title}</span>
      <span className={`text-sm ${primary ? "text-signal-ink/75" : "text-ink-faint"}`}>{sub}</span>
    </Link>
  );
}
