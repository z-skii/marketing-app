import Link from "next/link";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import {
  getMyVehicles, getOpportunities, type EarnKind, type FeedTab,
} from "@/lib/v2/opportunities";
import { sqlOne } from "@/lib/db";
import { formatCredit } from "@/lib/money";
import { EarnCard } from "@/components/v2/EarnCards";
import { EmptyState, ScreenHeader, Stat } from "@/components/v2/ui";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/*
 * Home is the marketplace. One pill row: three rankings and the three ways
 * to earn. Nothing here is a separate destination; they are all filters.
 */
const PILLS: { key: string; label: string; tab?: FeedTab; kind?: EarnKind }[] = [
  { key: "for_you", label: "For you", tab: "for_you" },
  { key: "nearby", label: "Nearby", tab: "nearby" },
  { key: "recreate", label: "Recreate", kind: "recreate_reel" },
  { key: "stories", label: "Stories", kind: "instagram_story" },
  { key: "cars", label: "Car ads", kind: "car_ads" },
  { key: "top_pay", label: "Highest pay", tab: "top_pay" },
];

export default async function HomePage({
  searchParams,
}: { searchParams: Promise<{ f?: string; offset?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null; // layout redirects
  if (ctx.mode === "business") redirect("/business");

  const pill = PILLS.find((p) => p.key === params.f) ?? PILLS[0];
  const tab: FeedTab = pill.tab ?? "for_you";
  const kind = pill.kind ?? null;
  const offset = Math.max(parseInt(params.offset ?? "0", 10) || 0, 0);
  const pageSize = 12;

  const [cards, vehicles, rail] = await Promise.all([
    getOpportunities({ viewerId: ctx.user.id, viewerCity: ctx.city, tab, kind, limit: pageSize + 1, offset }),
    getMyVehicles(ctx.user.id),
    sqlOne<{ available: string; active: string; nearby: string }>(
      `select
         (select coalesce(sum(amount_cents), 0) from earnings
           where profile_id = $1 and status = 'available')::text as available,
         ((select count(*) from applications a join campaigns c on c.id = a.campaign_id
            where a.applicant_id = $1 and a.status in ('applied', 'accepted')
              and c.kind in ('recreate_reel', 'instagram_story', 'car_ads'))
          + (select count(*) from submissions s
              where s.creator_id = $1 and s.status in ('submitted', 'under_review', 'revision_requested'))
          + (select count(*) from car_bookings k join vehicles v on v.id = k.vehicle_id
              where v.owner_id = $1 and k.status in ('creative_pending', 'installation_pending', 'active', 'proof_required')))::text as active,
         (select count(*) from campaigns c
           where c.status = 'open' and c.kind in ('recreate_reel', 'instagram_story', 'car_ads')
             and (c.deadline is null or c.deadline > now())
             and $2::text is not null and lower(c.city) = lower($2))::text as nearby`,
      [ctx.user.id, ctx.city],
    ),
  ]);

  const hasMore = cards.length > pageSize;
  const page = cards.slice(0, pageSize);
  const href = (key: string, off = 0) => `/home?f=${key}${off ? `&offset=${off}` : ""}`;
  const listedVehicle = vehicles.find((v) => v.status === "listed");

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,42rem)_17rem] lg:gap-10">
        <div className="min-w-0">
          <ScreenHeader
            kicker="Ways to make money"
            title={ctx.city ?? <Link href="/me/edit" className="text-signal">Add your city</Link>}
            unread={ctx.unreadNotifications}
          />

          <nav className="pill-row mt-4" aria-label="Filter">
            {PILLS.map((p) => (
              <Link key={p.key} href={href(p.key)} className="pill" aria-current={p.key === pill.key ? "page" : undefined}>
                {p.label}
              </Link>
            ))}
          </nav>

          {page.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title={offset > 0 ? "That's everything" : "Nothing here yet"}
                body={
                  pill.kind === "car_ads" && !listedVehicle
                    ? "Car campaigns show up here as businesses post them. Add your car now so you can apply the moment one does."
                    : "Businesses post new ways to earn every week. Check back soon or widen the filter."
                }
                actionHref={pill.kind === "car_ads" && !listedVehicle ? "/me/vehicles/new" : href("for_you")}
                actionLabel={pill.kind === "car_ads" && !listedVehicle ? "Add my car" : "Show everything"}
              />
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-4">
              {page.map((card, i) => (
                <EarnCard key={card.id} card={card} vehicles={vehicles} priority={i === 0} />
              ))}
            </div>
          )}

          {(hasMore || offset > 0) && (
            <div className="mt-6 flex items-center justify-between">
              {offset > 0 ? (
                <Link href={href(pill.key, Math.max(offset - pageSize, 0))} className="btn">Newer</Link>
              ) : <span />}
              {hasMore && <Link href={href(pill.key, offset + pageSize)} className="btn">More</Link>}
            </div>
          )}
        </div>

        {/* Desktop rail: your money, what you are doing, your car. */}
        <aside className="hidden lg:block">
          <div className="card p-5">
            <Stat tone="signal" value={formatCredit(Number(rail?.available ?? 0))} label="Available to pay out" />
            <Link href="/earnings" className="mt-4 block font-display text-sm font-600 text-ink-soft hover:text-ink">Open earnings →</Link>
          </div>
          <div className="card mt-3 p-5">
            <RailRow href="/activity" label="Active campaigns" value={Number(rail?.active ?? 0)} />
            {ctx.city && <RailRow href={href("nearby")} label={`Open in ${ctx.city}`} value={Number(rail?.nearby ?? 0)} />}
          </div>
          <div className="card mt-3 p-5">
            {listedVehicle ? (
              <>
                <p className="text-sm text-ink-soft">Your vehicle</p>
                <p className="mt-1 font-display text-[1.125rem] font-800 tracking-[-0.02em]">{listedVehicle.year} {listedVehicle.make} {listedVehicle.model}</p>
                <p className="mt-1 text-sm text-signal">{listedVehicle.available ? "Available for ads" : "Not available"}</p>
                <Link href={`/me/vehicles/${listedVehicle.id}`} className="mt-3 block font-display text-sm font-600 text-ink-soft hover:text-ink">Manage vehicle →</Link>
              </>
            ) : (
              <>
                <p className="font-display text-[1.125rem] font-800 tracking-[-0.02em]">Make money with your car</p>
                <p className="mt-1 text-sm text-ink-soft">List it once and car campaigns near you show whether it qualifies.</p>
                <Link href="/me/vehicles/new" className="btn btn-signal btn-sm mt-3">Add vehicle</Link>
              </>
            )}
          </div>
          {ctx.instagram.status === "disconnected" && (
            <div className="card mt-3 p-5">
              <p className="font-display text-[1.125rem] font-800 tracking-[-0.02em]">Story campaigns need Instagram</p>
              <p className="mt-1 text-sm text-ink-soft">Add your handle once to take Story campaigns.</p>
              <Link href="/me/instagram" className="btn btn-sm mt-3">Add Instagram</Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function RailRow({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="tnum font-display text-lg font-800">{value}</span>
    </Link>
  );
}
