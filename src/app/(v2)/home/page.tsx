import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { getFeed, type FeedTab } from "@/lib/v2/feed";
import { sqlOne } from "@/lib/db";
import { formatCredit } from "@/lib/money";
import { OpportunityCard } from "@/components/v2/OpportunityCard";
import { EmptyState, ScreenHeader, Stat } from "@/components/v2/ui";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/*
 * One pill row drives the whole feed. The first four are rankings, the rest
 * narrow to a kind of work, and Car Ads is a door to the marketplace.
 */
const PILLS: { key: string; label: string; tab?: FeedTab; kind?: string; href?: string }[] = [
  { key: "for_you", label: "For you", tab: "for_you" },
  { key: "nearby", label: "Nearby", tab: "nearby" },
  { key: "top_pay", label: "High pay", tab: "top_pay" },
  { key: "new", label: "New", tab: "new" },
  { key: "cars", label: "Car ads", href: "/cars" },
  { key: "photography", label: "Photography", kind: "photography" },
  { key: "ugc", label: "UGC", kind: "ugc" },
  { key: "videography", label: "Video", kind: "videography" },
  { key: "content", label: "Content", kind: "content" },
];
const TABS = new Set<string>(["for_you", "nearby", "top_pay", "new"]);
const KINDS = new Set<string>(["photography", "ugc", "videography", "content"]);

/**
 * The discovery feed: where you are, what pays, one photo per opportunity.
 * Desktop adds a right rail with the four numbers that describe your month.
 */
export default async function HomePage({
  searchParams,
}: { searchParams: Promise<{ tab?: string; kind?: string; offset?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null; // layout redirects

  const tab = (TABS.has(params.tab ?? "") ? params.tab : "for_you") as FeedTab;
  const kind = KINDS.has(params.kind ?? "") ? params.kind! : null;
  const offset = Math.max(parseInt(params.offset ?? "0", 10) || 0, 0);
  const pageSize = 12;

  const business = ctx.businesses[0] ?? null;
  const [cards, attention, month] = await Promise.all([
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
    sqlOne<{ earned: string; applications: string; nearby: string; saved: string }>(
      `select
         (select coalesce(sum(amount_cents), 0) from earnings
           where profile_id = $1 and created_at >= date_trunc('month', now()))::text as earned,
         (select count(*) from applications
           where applicant_id = $1 and status in ('applied', 'accepted'))::text as applications,
         (select count(*) from campaigns c
           where c.status = 'open' and (c.deadline is null or c.deadline > now())
             and $2::text is not null and lower(c.city) = lower($2))::text as nearby,
         (select count(*) from saved_items where profile_id = $1)::text as saved`,
      [ctx.user.id, ctx.city],
    ),
  ]);
  const hasMore = cards.length > pageSize;
  const shown = cards.slice(0, pageSize);
  const pendingReviews = Number(attention?.pending ?? 0);
  const counteredOffers = Number(attention?.offers ?? 0);
  const activeKey = kind ?? tab;

  const query = (next: { tab?: string; kind?: string | null; offset?: number }) => {
    const usp = new URLSearchParams();
    const t = next.tab ?? tab;
    const k = next.kind === undefined ? kind : next.kind;
    if (t !== "for_you") usp.set("tab", t);
    if (k) usp.set("kind", k);
    if (next.offset) usp.set("offset", String(next.offset));
    const s = usp.toString();
    return s ? `/home?${s}` : "/home";
  };
  const pillHref = (p: (typeof PILLS)[number]) =>
    p.href ?? (p.tab ? query({ tab: p.tab, kind: null }) : query({ tab: "for_you", kind: p.kind }));

  const firstName = (ctx.user.displayName ?? ctx.user.username).split(" ")[0];

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-4 md:px-8 md:py-8">
      <div className="md:grid md:grid-cols-[minmax(0,42rem)_17rem] md:gap-10">
        <div className="min-w-0">
          <ScreenHeader
            kicker={ctx.city ? "Paid work near" : `Hi ${firstName}`}
            title={
              ctx.city ?? (
                <Link href="/me/edit" className="underline decoration-signal decoration-2 underline-offset-4">
                  Add your city
                </Link>
              )
            }
            unread={ctx.unreadNotifications}
          />

          {(pendingReviews > 0 || counteredOffers > 0) && business && (
            <Link
              href={pendingReviews > 0 ? "/business/review" : "/business/car-ads"}
              className="card card-signal mt-5 flex items-center gap-4 p-4"
            >
              <span className="tnum font-display text-[2rem] leading-none font-800 text-signal">
                {pendingReviews + counteredOffers}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-base font-700">
                  {pendingReviews > 0
                    ? `Creator submission${pendingReviews === 1 ? "" : "s"} waiting for your review`
                    : `Driver counter-offer${counteredOffers === 1 ? "" : "s"} waiting on you`}
                </span>
                <span className="block text-sm text-ink-faint">{business.name}</span>
              </span>
              <span aria-hidden className="text-ink-faint">→</span>
            </Link>
          )}

          <nav className="pill-row mt-5" aria-label="Feed filters">
            {PILLS.map((p) => (
              <Link
                key={p.key}
                href={pillHref(p)}
                className="pill"
                aria-current={p.key === activeKey ? "page" : undefined}
              >
                {p.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-4 md:gap-5">
            {shown.map((card, i) => <OpportunityCard key={card.id} card={card} priority={i === 0} />)}
            {shown.length === 0 && (
              <EmptyState
                title={ctx.city ? "Nothing here yet" : "Add your city to see nearby work"}
                body={
                  ctx.city
                    ? "Try another filter or check back soon. New opportunities post every day."
                    : "Nearby, High pay and the numbers on the right all depend on where you are."
                }
                actionHref={ctx.city ? "/home" : "/me/edit"}
                actionLabel={ctx.city ? "Show everything" : "Add city"}
              />
            )}
          </div>

          {(offset > 0 || hasMore) && (
            <div className="mt-6 flex justify-center gap-3">
              {offset > 0 && (
                <Link href={query({ offset: Math.max(offset - pageSize, 0) })} className="btn btn-ghost">
                  Newer
                </Link>
              )}
              {hasMore && (
                <Link href={query({ offset: offset + pageSize })} className="btn">
                  Load more
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Desktop rail: your month in four real numbers. */}
        <aside className="hidden md:block">
          <div className="sticky top-8 flex flex-col gap-3">
            <div className="card p-5">
              <Stat
                tone="signal"
                value={formatCredit(Number(month?.earned ?? 0))}
                label="Earned this month"
                sub={Number(month?.earned ?? 0) > 0 ? "After the platform fee" : "Approved work lands here"}
              />
              <Link href="/wallet" className="mt-4 inline-block font-display text-sm font-600 text-ink-soft hover:text-ink">
                Open wallet →
              </Link>
            </div>
            <div className="card divide-y divide-paper p-1">
              <RailRow href="/jobs?tab=mine" label="Active applications" value={month?.applications ?? "0"} />
              <RailRow href={query({ tab: "nearby", kind: null })} label={ctx.city ? `Open in ${ctx.city}` : "Open nearby"} value={month?.nearby ?? "0"} />
              <RailRow href="/jobs?tab=saved" label="Saved" value={month?.saved ?? "0"} />
            </div>
            {!ctx.hasVehicles && (
              <Link href="/cars/new" className="card-2 block p-5">
                <span className="block font-display text-base font-800 tracking-[-0.02em]">Your car could pay you monthly</span>
                <span className="mt-1 block text-sm text-ink-soft">List it once. Businesses send offers for the space.</span>
                <span className="mt-3 inline-block font-display text-sm font-700 text-signal">List my car →</span>
              </Link>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function RailRow({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-[10px] px-4 py-3 hover:bg-surface-2">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="tnum font-display text-xl font-800">{value}</span>
    </Link>
  );
}
