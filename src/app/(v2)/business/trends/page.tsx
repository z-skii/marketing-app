import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { getTrendsForBusiness, listProviderStatus } from "@/lib/trends";
import { ScreenHeader } from "@/components/v2/ui";
import { TrendCard } from "./TrendCard";
import { IdeaCard } from "../IdeaCard";
import { AddTrendForm } from "./AddTrendForm";

export const metadata = { title: "Trending" };
export const dynamic = "force-dynamic";

/**
 * Trending for your business: content worth recreating, each one a tap from
 * a campaign. Numbers are shown only when a provider measured them. A
 * business can always paste a link it found itself.
 */
export default async function TrendsPage() {
  const ctx = await requireBusinessContext("/business/trends");
  const business = ctx.activeBusiness;

  const [trends, ideas] = await Promise.all([
    getTrendsForBusiness(business.id),
    sql<{ id: string; title: string; body: string; prefill_kind: string | null }>(
      `select id, title, body, prefill->>'kind' as prefill_kind
         from marketing_recommendations
        where business_id = $1 and status = 'new' and kind = 'idea'
        order by created_at desc limit 4`,
      [business.id],
    ),
  ]);
  const providers = listProviderStatus();
  const live = providers.find((p) => p.id === "api")?.available ?? false;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader kicker={business.name} title="Trending for you" unread={ctx.unreadNotifications} showSearch={false} />

      {trends.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Nothing yet. Paste a Reel or TikTok you want people to recreate.</p>
      ) : (
        <div className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
          {trends.map((t, i) => <TrendCard key={t.id} trend={t} large={i === 0} index={i} />)}
        </div>
      )}

      {/* Paste your own */}
      <section className="mt-8" aria-label="Add a reference">
        <h2 className="eyebrow">Found one yourself?</h2>
        <AddTrendForm />
        {!live && (
          <p className="mt-2 text-sm text-ink-faint">
            Platform trend feeds are not connected in this environment. What you see is curated by TapMart or added by you.
          </p>
        )}
      </section>

      {ideas.length > 0 && (
        <section className="mt-8" aria-label="Ideas">
          <h2 className="eyebrow">Ideas for your business</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {ideas.map((i) => (
              <IdeaCard key={i.id} id={i.id} businessId={business.id} title={i.title} body={i.body} kind={i.prefill_kind} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-sm text-ink-faint">
        Every recreation is paid from your campaign credit. <Link href="/business/billing" className="link-row text-sm">Billing</Link>
      </p>
    </main>
  );
}
