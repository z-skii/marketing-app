import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { formatCredit } from "@/lib/money";
import { Avatar, EmptyState, Money, SectionTitle, StatusChip } from "@/components/v2/ui";
import { IdeaCard } from "./IdeaCard";

export const metadata = { title: "Business" };
export const dynamic = "force-dynamic";

/**
 * The business command center: what needs attention now, quick actions,
 * marketing ideas that become campaigns in one tap, and the live campaigns.
 * Cards and action items — never a wall of stats.
 */
export default async function BusinessPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const business = ctx.businesses[0] ?? null;

  if (!business) {
    return (
      <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
        <h1 className="font-display text-2xl font-900 tracking-[-0.03em]">Business</h1>
        <div className="mt-5">
          <EmptyState
            title="Add your business"
            body="Let TapMart start organizing your marketing — campaigns, content, photos, car ads."
            actionHref="/business/new" actionLabel="Add business"
          />
        </div>
      </main>
    );
  }

  const [attention, campaigns, ideas, wallet, connections] = await Promise.all([
    sqlOne<{ pending_subs: string; countered: string; approvals: string; upcoming: string }>(
      `select
         (select count(*) from submissions s join campaigns c on c.id = s.campaign_id
           where c.business_id = $1 and s.status in ('submitted', 'under_review'))::text as pending_subs,
         (select count(*) from car_offers o where o.business_id = $1 and o.status = 'countered')::text as countered,
         (select count(*) from calendar_posts p where p.business_id = $1 and p.status = 'needs_approval')::text as approvals,
         (select count(*) from campaigns c where c.business_id = $1 and c.status = 'open'
            and c.event_at between now() and now() + interval '48 hours')::text as upcoming`,
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
    sql<{ provider: string; status: string }>(
      `select provider, status::text as status from connected_accounts where business_id = $1`,
      [business.id],
    ),
  ]);

  const items = [
    Number(attention?.pending_subs ?? 0) > 0 && {
      href: "/business/review", text: `Approve ${attention!.pending_subs} creator submission${attention!.pending_subs === "1" ? "" : "s"}`,
    },
    Number(attention?.countered ?? 0) > 0 && {
      href: "/business/car-ads", text: `${attention!.countered} driver counter-offer${attention!.countered === "1" ? "" : "s"} to answer`,
    },
    Number(attention?.approvals ?? 0) > 0 && {
      href: "/business/calendar", text: `${attention!.approvals} post${attention!.approvals === "1" ? "" : "s"} waiting for approval`,
    },
    Number(attention?.upcoming ?? 0) > 0 && {
      href: "/business/review", text: "A shoot is coming up in the next 48 hours",
    },
  ].filter(Boolean) as { href: string; text: string }[];

  const connectedCount = connections.filter((c) => c.status === "connected").length;

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <header className="flex items-center gap-3">
        <Avatar src={business.logo_url} name={business.name} size={44} />
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-900 tracking-[-0.03em]">{business.name}</h1>
          <p className="font-mono text-[0.6875rem] text-ink-faint">
            <Link href={`/b/${business.slug}`} className="hover:text-ink">public page ↗</Link>
            {" · "}
            <Link href="/business/edit" className="hover:text-ink">edit &amp; brand kit</Link>
          </p>
        </div>
        <span className="ml-auto text-right">
          <span className="block font-mono text-[0.625rem] text-ink-faint uppercase">Wallet</span>
          <Money cents={Number(wallet?.cents ?? 0)} />
        </span>
      </header>

      {items.length > 0 && (
        <aside className="mt-5 border-[1.5px] border-ink p-4">
          <p className="eyebrow !text-signal">
            {items.length === 1 ? "1 thing needs" : `${items.length} things need`} your attention
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {items.map((i) => (
              <li key={i.text}>
                <Link href={i.href} className="underline decoration-signal underline-offset-2">{i.text}</Link>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <section className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
        {[
          ["/create", "+ Hire creators"],
          ["/cars?tab=browse", "+ Advertise on cars"],
          ["/create", "+ Request photos"],
          ["/business/calendar", "Content calendar"],
          ["/business/connections", `Accounts (${connectedCount}/4)`],
          ["/wallet", `Add credit · ${formatCredit(Number(wallet?.cents ?? 0))}`],
        ].map(([href, label]) => (
          <Link key={label} href={href} className="border border-rule px-3 py-3 text-center font-mono text-[0.6875rem] font-600 uppercase tracking-wide hover:border-signal hover:text-signal">
            {label}
          </Link>
        ))}
      </section>

      {ideas.length > 0 && (
        <section className="mt-6">
          <SectionTitle>Marketing ideas</SectionTitle>
          <div className="mt-2 flex flex-col gap-2">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} id={idea.id} businessId={business.id} title={idea.title} body={idea.body} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <SectionTitle count={campaigns.length}>Campaigns</SectionTitle>
        {campaigns.length === 0 && (
          <div className="mt-2">
            <EmptyState
              title="Turn your next marketing idea into paid creator content"
              actionHref="/create" actionLabel="Create campaign"
            />
          </div>
        )}
        <ul className="mt-2 flex flex-col gap-2">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link href={`/jobs/${c.id}`} className="flex items-center gap-3 border border-rule p-3 hover:border-ink">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-800">{c.title}</span>
                  <span className="font-mono text-[0.625rem] text-ink-faint">
                    {c.approved}/{c.slots} approved{c.submitted > 0 ? ` · ${c.submitted} waiting` : ""}
                  </span>
                </span>
                <StatusChip status={c.status} />
                <Money cents={c.pay_cents} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
