import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { getSubscription } from "@/lib/v2/subscriptions";
import { EmptyState, ScreenHeader, SectionTitle } from "@/components/v2/ui";
import { IdeaCard } from "../IdeaCard";
import { RefreshIdeasButton } from "./RefreshButton";

export const metadata = { title: "Trends" };
export const dynamic = "force-dynamic";

type Rec = {
  id: string; kind: string; title: string; body: string; stat: string | null;
  reference_url: string | null; prefill_kind: string | null;
};

/**
 * Trending content for the business's category, each one a tap from a
 * campaign. Trends belong to Growth; Essential businesses still see them
 * with a plain line saying so.
 */
export default async function TrendsPage() {
  const ctx = await requireBusinessContext("/business/trends");
  const business = ctx.activeBusiness;

  const [recs, subscription] = await Promise.all([
    sql<Rec>(
      `select id, kind, title, body, stat, reference_url, prefill->>'kind' as prefill_kind
         from marketing_recommendations
        where business_id = $1 and status = 'new'
        order by (kind = 'trend') desc, created_at desc limit 20`,
      [business.id],
    ),
    getSubscription(business.id),
  ]);
  const trends = recs.filter((r) => r.kind === "trend");
  const ideas = recs.filter((r) => r.kind === "idea");
  const onGrowth = subscription?.plan === "growth" && subscription.status !== "cancelled";

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader
        kicker={business.name} title="Trends" unread={ctx.unreadNotifications} showSearch={false}
        right={<RefreshIdeasButton businessId={business.id} />}
      />
      <p className="mt-2 text-[0.9375rem] text-ink-soft">
        Formats working for businesses like yours right now. Each one becomes a campaign in one tap.
      </p>
      {!onGrowth && (
        <p className="card-2 mt-4 px-4 py-3 text-sm">
          Trending content is part of Growth. <Link href="/business/plan" className="font-display font-700 text-signal">See plans →</Link>
        </p>
      )}

      <section className="mt-6" aria-label="Trending">
        {trends.length === 0 ? (
          <EmptyState title="No trends yet" body="Refresh ideas to get a fresh set for your category." />
        ) : (
          <div className="flex flex-col gap-3">
            {trends.map((t) => (
              <IdeaCard key={t.id} id={t.id} businessId={business.id} title={t.title} body={t.body} stat={t.stat} referenceUrl={t.reference_url} kind={t.prefill_kind} trend />
            ))}
          </div>
        )}
      </section>

      {ideas.length > 0 && (
        <section className="mt-8" aria-label="Ideas">
          <SectionTitle>Ideas for your business</SectionTitle>
          <div className="mt-3 flex flex-col gap-3">
            {ideas.map((i) => (
              <IdeaCard key={i.id} id={i.id} businessId={business.id} title={i.title} body={i.body} kind={i.prefill_kind} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
