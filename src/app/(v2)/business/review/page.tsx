import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { EmptyState, Money, SectionTitle } from "@/components/v2/ui";

export const metadata = { title: "Review queue" };
export const dynamic = "force-dynamic";

/** Everything waiting on the business, campaign by campaign. */
export default async function ReviewQueuePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const ids = ctx.businesses.map((b) => b.id);

  const rows = ids.length
    ? await sql<{ campaign_id: string; title: string; pay_cents: number; waiting: number; event_at: string | null }>(
        `select c.id as campaign_id, c.title, c.pay_cents::int as pay_cents, c.event_at,
                (select count(*) from submissions s where s.campaign_id = c.id
                  and s.status in ('submitted', 'under_review'))::int as waiting
           from campaigns c
          where c.business_id = any($1::uuid[]) and c.status in ('open', 'paused')
          order by waiting desc, c.created_at desc`,
        [ids],
      )
    : [];
  const withWork = rows.filter((r) => r.waiting > 0 ||
    (r.event_at && new Date(r.event_at) > new Date()));

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <Link href="/business" className="font-mono text-xs text-ink-faint hover:text-ink">← Business</Link>
      <h1 className="mt-2 font-display text-2xl font-900 tracking-[-0.03em]">Review queue</h1>
      <section className="mt-4">
        <SectionTitle count={withWork.length}>Waiting on you</SectionTitle>
        {withWork.length === 0 && (
          <div className="mt-3">
            <EmptyState title="All caught up" body="New submissions land here the moment creators upload." />
          </div>
        )}
        <ul className="mt-3 flex flex-col gap-2">
          {withWork.map((r) => (
            <li key={r.campaign_id}>
              <Link href={`/jobs/${r.campaign_id}`} className="flex items-center gap-3 border border-rule p-3 hover:border-ink">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-800">{r.title}</span>
                  <span className="font-mono text-[0.625rem] text-ink-faint">
                    {r.waiting > 0 ? `${r.waiting} submission${r.waiting === 1 ? "" : "s"} to review` : ""}
                    {r.event_at ? `${r.waiting > 0 ? " · " : ""}shoot ${new Date(r.event_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" })}` : ""}
                  </span>
                </span>
                <Money cents={r.pay_cents} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
