import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
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
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business" label="Business" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Review queue</h1>
      <p className="mt-1.5 text-[0.9375rem] text-ink-soft">Approve to pay. Money leaves your wallet only when you say so.</p>

      <section className="mt-6">
        <SectionTitle count={withWork.length}>Waiting on you</SectionTitle>
        {withWork.length === 0 && (
          <div className="mt-3">
            <EmptyState title="All caught up" body="New submissions land here the moment creators upload." actionHref="/business" actionLabel="Back to business" />
          </div>
        )}
        <ul className="row-list mt-3">
          {withWork.map((r, i) => (
            <li key={r.campaign_id}>
              <Link href={`/jobs/${r.campaign_id}`} className={`card flex items-center gap-4 p-4 ${i === 0 && r.waiting > 0 ? "card-signal" : ""}`}>
                {r.waiting > 0 && (
                  <span className="tnum w-10 shrink-0 font-display text-[2rem] leading-none font-800 text-signal">{r.waiting}</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{r.title}</span>
                  <span className="mt-1 block text-sm text-ink-faint">
                    {[
                      r.waiting > 0 ? `${r.waiting} submission${r.waiting === 1 ? "" : "s"} to review` : null,
                      r.event_at ? `Shoot ${new Date(r.event_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" })}` : null,
                    ].filter(Boolean).join("  ·  ")}
                  </span>
                </span>
                <Money cents={r.pay_cents} size="sm" />
                <span aria-hidden className="text-ink-faint">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
