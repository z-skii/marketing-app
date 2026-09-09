import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { getFeed } from "@/lib/v2/feed";
import { sql } from "@/lib/db";
import { OpportunityCard } from "@/components/v2/OpportunityCard";
import { EmptyState, Money, SectionTitle, StatusChip } from "@/components/v2/ui";

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

/** Jobs: paid work to grab, and everything you've applied to or submitted. */
export default async function JobsPage({
  searchParams,
}: { searchParams: Promise<{ tab?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  const tab = params.tab === "mine" ? "mine" : "browse";

  const [cards, myWork] = await Promise.all([
    tab === "browse"
      ? getFeed({ viewerId: ctx.user.id, viewerCity: ctx.city, tab: "for_you", limit: 30 })
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
  ]);

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <h1 className="font-display text-2xl font-900 tracking-[-0.03em]">Jobs</h1>

      <nav className="mt-4 flex gap-1 border-b border-rule" aria-label="Jobs tabs">
        {([["browse", "Browse"], ["mine", "My Work"]] as const).map(([key, label]) => (
          <Link
            key={key}
            href={key === "browse" ? "/jobs" : "/jobs?tab=mine"}
            aria-current={tab === key ? "page" : undefined}
            className={`px-4 py-2.5 font-mono text-[0.6875rem] font-600 tracking-[0.1em] uppercase ${
              tab === key ? "border-b-2 border-signal text-ink" : "text-ink-faint hover:text-ink"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "browse" && (
        <div className="mt-4 flex flex-col gap-3">
          {cards.map((card) => <OpportunityCard key={card.id} card={card} />)}
          {cards.length === 0 && (
            <EmptyState
              title="No open jobs right now"
              body="New campaigns post daily. Save businesses you like to see their work first."
            />
          )}
        </div>
      )}

      {tab === "mine" && (
        <section className="mt-4">
          <SectionTitle count={myWork.length}>Applications &amp; submissions</SectionTitle>
          {myWork.length === 0 && (
            <div className="mt-3">
              <EmptyState
                title="Nothing yet"
                body="Apply to a job or submit to a campaign and it'll show up here."
                actionHref="/jobs" actionLabel="Browse jobs"
              />
            </div>
          )}
          <ul className="mt-3 flex flex-col gap-2">
            {myWork.map((w, i) => (
              <li key={i}>
                <Link href={`/jobs/${w.campaign_id}`} className="flex items-center gap-3 border border-rule p-3 hover:border-ink">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-800">{w.title}</p>
                    <p className="font-mono text-[0.625rem] text-ink-faint">
                      {w.what} · {new Date(w.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <StatusChip status={w.status} />
                  <Money cents={w.pay_cents} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
