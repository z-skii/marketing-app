import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { getFeed, type FeedTab } from "@/lib/v2/feed";
import { sqlOne } from "@/lib/db";
import { OpportunityCard } from "@/components/v2/OpportunityCard";
import { EmptyState } from "@/components/v2/ui";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

const TABS: { key: FeedTab; label: string }[] = [
  { key: "for_you", label: "For You" },
  { key: "nearby", label: "Nearby" },
  { key: "top_pay", label: "Highest Pay" },
  { key: "new", label: "New" },
];

const KINDS = [
  { key: "", label: "All" },
  { key: "content", label: "Content" },
  { key: "photography", label: "Photos" },
  { key: "ugc", label: "UGC" },
  { key: "videography", label: "Video" },
  { key: "car_ads", label: "Car Ads" },
];

/**
 * The discovery feed: personalized opportunities, one card each, one obvious
 * action. Business owners also get a "needs your attention" strip on top.
 */
export default async function HomePage({
  searchParams,
}: { searchParams: Promise<{ tab?: string; kind?: string; offset?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null; // layout redirects

  const tab = (TABS.some((t) => t.key === params.tab) ? params.tab : "for_you") as FeedTab;
  const kind = KINDS.some((k) => k.key === params.kind) ? params.kind || null : null;
  const offset = Math.max(parseInt(params.offset ?? "0", 10) || 0, 0);
  const pageSize = 20;

  const business = ctx.businesses[0] ?? null;
  const [cards, attention] = await Promise.all([
    getFeed({ viewerId: ctx.user.id, viewerCity: ctx.city, tab, kind, limit: pageSize + 1, offset }),
    business
      ? sqlOne<{ pending: string; offers: string }>(
          `select
             (select count(*) from submissions s join campaigns c on c.id = s.campaign_id
               where c.business_id = $1 and s.status in ('submitted', 'under_review'))::text as pending,
             (select count(*) from car_offers o
               where o.business_id = $1 and o.status = 'countered')::text as offers`,
          [business.id],
        )
      : Promise.resolve(null),
  ]);
  const hasMore = cards.length > pageSize;
  const shown = cards.slice(0, pageSize);
  const pendingReviews = Number(attention?.pending ?? 0);
  const counteredOffers = Number(attention?.offers ?? 0);

  const query = (next: Record<string, string | number | null>) => {
    const merged = { tab, kind: kind ?? "", offset: "", ...next };
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) usp.set(k, String(v));
    const s = usp.toString();
    return s ? `/home?${s}` : "/home";
  };

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <header className="flex items-baseline justify-between md:hidden">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-signal" aria-hidden />
          <span className="font-display text-lg font-900 tracking-[-0.03em]">TAPMART</span>
        </span>
        <Link href="/search" className="p-2 font-mono text-xs font-600 uppercase text-ink-faint">
          Search
        </Link>
      </header>

      {(pendingReviews > 0 || counteredOffers > 0) && business && (
        <aside className="mt-4 border-[1.5px] border-ink bg-paper p-4 md:mt-0">
          <p className="eyebrow !text-signal">Needs your attention</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {pendingReviews > 0 && (
              <li>
                <Link href="/business/review" className="underline decoration-signal underline-offset-2">
                  Review {pendingReviews} creator submission{pendingReviews === 1 ? "" : "s"}
                </Link>
              </li>
            )}
            {counteredOffers > 0 && (
              <li>
                <Link href="/business/car-ads" className="underline decoration-signal underline-offset-2">
                  {counteredOffers} driver counter-offer{counteredOffers === 1 ? "" : "s"} waiting
                </Link>
              </li>
            )}
          </ul>
        </aside>
      )}

      {/* Tabs */}
      <nav className="mt-4 flex gap-1 overflow-x-auto border-b border-rule" aria-label="Feed tabs">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={query({ tab: t.key })}
            aria-current={t.key === tab ? "page" : undefined}
            className={`px-3.5 py-2.5 font-mono text-[0.6875rem] font-600 tracking-[0.1em] whitespace-nowrap uppercase ${
              t.key === tab ? "border-b-2 border-signal text-ink" : "text-ink-faint hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Kind filters */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {KINDS.map((k) => (
          <Link
            key={k.key}
            href={query({ kind: k.key })}
            className={`shrink-0 border px-3 py-1.5 font-mono text-[0.625rem] font-600 uppercase tracking-wide ${
              (kind ?? "") === k.key ? "border-signal text-signal" : "border-rule text-ink-faint hover:border-ink hover:text-ink"
            }`}
          >
            {k.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {shown.map((card) => <OpportunityCard key={card.id} card={card} />)}
        {shown.length === 0 && (
          <EmptyState
            title="Nothing matches yet"
            body={
              ctx.city
                ? "Try another tab, widen your filters, or check back soon — new opportunities post daily."
                : "Add your city on your profile so we can show nearby work."
            }
            actionHref={ctx.city ? "/home" : "/me/edit"}
            actionLabel={ctx.city ? "Clear filters" : "Add city"}
          />
        )}
      </div>

      <div className="mt-5 flex justify-center gap-3">
        {offset > 0 && (
          <Link href={query({ offset: Math.max(offset - pageSize, 0) || "" })} className="btn btn-ghost !px-4 !py-2 text-xs">
            ← Newer
          </Link>
        )}
        {hasMore && (
          <Link href={query({ offset: offset + pageSize })} className="btn !px-4 !py-2 text-xs">
            Load more
          </Link>
        )}
      </div>
    </main>
  );
}
