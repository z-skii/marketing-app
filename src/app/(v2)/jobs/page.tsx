import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { getFeed } from "@/lib/v2/feed";
import { sql } from "@/lib/db";
import { OpportunityCard } from "@/components/v2/OpportunityCard";
import { EmptyState, Money, ScreenHeader, SectionTitle, StatusChip } from "@/components/v2/ui";

export const metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";

type WorkRow = {
  campaign_id: string;
  title: string;
  pay_cents: number;
  kind: string;
  what: string;
  status: string;
  created_at: string;
};

type Tab = "browse" | "mine" | "saved";

const TABS: { key: Tab; label: string; href: string }[] = [
  { key: "browse", label: "Browse", href: "/jobs" },
  { key: "mine", label: "My work", href: "/jobs?tab=mine" },
  { key: "saved", label: "Saved", href: "/jobs?tab=saved" },
];

/** Jobs: paid work to grab, everything you applied to or submitted, and what you saved. */
export default async function JobsPage({
  searchParams,
}: { searchParams: Promise<{ tab?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  const tab: Tab = params.tab === "mine" ? "mine" : params.tab === "saved" ? "saved" : "browse";

  const [cards, myWork, savedIds] = await Promise.all([
    tab === "browse"
      ? getFeed({ viewerId: ctx.user.id, viewerCity: ctx.city, tab: "for_you", limit: 30 })
      : tab === "saved"
        ? getFeed({ viewerId: ctx.user.id, viewerCity: ctx.city, tab: "new", limit: 50 })
        : Promise.resolve([]),
    tab === "mine"
      ? sql<WorkRow>(
          `select c.id as campaign_id, c.title, c.pay_cents::int as pay_cents, c.kind::text as kind,
                  'application' as what, a.status::text as status, a.created_at
             from applications a join campaigns c on c.id = a.campaign_id
            where a.applicant_id = $1
           union all
           select c.id, c.title, c.pay_cents::int, c.kind::text,
                  'submission', s.status::text, s.created_at
             from submissions s join campaigns c on c.id = s.campaign_id
            where s.creator_id = $1
           order by created_at desc limit 100`,
          [ctx.user.id],
        )
      : Promise.resolve([]),
    tab === "saved"
      ? sql<{ item_id: string }>(
          `select item_id from saved_items where profile_id = $1 and item_type = 'campaign' order by created_at desc limit 50`,
          [ctx.user.id],
        )
      : Promise.resolve([]),
  ]);

  const savedOrder = new Map(savedIds.map((s, i) => [s.item_id, i]));
  const savedCards = tab === "saved"
    ? cards
        .filter((c) => savedOrder.has(c.id))
        .sort((a, b) => (savedOrder.get(a.id) ?? 0) - (savedOrder.get(b.id) ?? 0))
    : [];

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader
        title="Jobs"
        kicker={tab === "browse" ? "Paid work near you" : tab === "mine" ? "What you applied to and sent in" : "Jobs you saved for later"}
        unread={ctx.unreadNotifications}
      />

      <nav className="mt-6 flex gap-5" aria-label="Jobs tabs">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={tab === t.key ? "page" : undefined}
            className={`relative pb-2 font-display text-lg font-800 tracking-[-0.02em] transition-colors ${
              tab === t.key
                ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-signal"
                : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "browse" && (
        <div className="mt-4 flex flex-col gap-4 md:gap-5">
          {cards.map((card, i) => <OpportunityCard key={card.id} card={card} priority={i === 0} />)}
          {cards.length === 0 && (
            <EmptyState
              title="No open jobs right now"
              body="New campaigns post every day. Save businesses you like to see their work first."
              actionHref="/home" actionLabel="Go home"
            />
          )}
        </div>
      )}

      {tab === "saved" && (
        <div className="mt-4 flex flex-col gap-4 md:gap-5">
          {savedCards.map((card, i) => <OpportunityCard key={card.id} card={card} priority={i === 0} />)}
          {savedCards.length === 0 && (
            <EmptyState
              title="Nothing saved yet"
              body="Tap the bookmark on any job and it will wait for you here."
              actionHref="/home" actionLabel="Find jobs"
            />
          )}
        </div>
      )}

      {tab === "mine" && (
        <section className="mt-5">
          <SectionTitle count={myWork.length}>Applications and submissions</SectionTitle>
          {myWork.length === 0 && (
            <div className="mt-3">
              <EmptyState
                title="Nothing yet"
                body="Apply to a job or submit to a campaign and it shows up here."
                actionHref="/jobs" actionLabel="Browse jobs"
              />
            </div>
          )}
          <ul className="row-list mt-3">
            {myWork.map((w, i) => (
              <li key={`${w.what}-${w.campaign_id}-${i}`}>
                <Link href={`/jobs/${w.campaign_id}`} className="card flex items-center gap-3 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{w.title}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusChip status={w.status} />
                      <span className="text-sm text-ink-faint">
                        {w.what === "application" ? "Applied" : "Submitted"}{"  ·  "}
                        {new Date(w.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </span>
                  </span>
                  <Money cents={w.pay_cents} size="sm" />
                  <span aria-hidden className="text-ink-faint">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
