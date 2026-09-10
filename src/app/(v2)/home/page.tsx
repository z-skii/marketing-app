import Link from "next/link";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import {
  getMyVehicles, getOpportunities, type EarnKind, type FeedTab,
} from "@/lib/v2/opportunities";
import { sqlOne } from "@/lib/db";
import { formatCredit } from "@/lib/money";
import { EarnCard } from "@/components/v2/EarnCards";
import { FilterBar } from "@/components/v2/FilterBar";
import { EmptyState, ScreenHeader } from "@/components/v2/ui";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/*
 * Home is the money marketplace: one feed, three kinds of opportunity, six
 * filters. The media is the design; the page itself says almost nothing.
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
    sqlOne<{ available: string; active: string }>(
      `select
         (select coalesce(sum(amount_cents), 0) from earnings
           where profile_id = $1 and status = 'available')::text as available,
         ((select count(*) from applications a join campaigns c on c.id = a.campaign_id
            where a.applicant_id = $1 and a.status in ('applied', 'accepted')
              and c.kind in ('recreate_reel', 'instagram_story', 'car_ads'))
          + (select count(*) from submissions s
              where s.creator_id = $1 and s.status in ('submitted', 'under_review', 'revision_requested'))
          + (select count(*) from car_bookings k join vehicles v on v.id = k.vehicle_id
              where v.owner_id = $1 and k.status in ('creative_pending', 'installation_pending', 'active', 'proof_required')))::text as active`,
      [ctx.user.id],
    ),
  ]);

  const hasMore = cards.length > pageSize;
  const page = cards.slice(0, pageSize);
  const href = (key: string, off = 0) => `/home?f=${key}${off ? `&offset=${off}` : ""}`;
  const listedVehicle = vehicles.find((v) => v.status === "listed");
  const available = Number(rail?.available ?? 0);
  const active = Number(rail?.active ?? 0);

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 py-4 md:px-8 md:py-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-10">
        <div className="min-w-0">
          <ScreenHeader
            kicker="Ways to make money"
            title={ctx.city ?? <Link href="/me/edit" className="underline decoration-ink-faint underline-offset-4">Add your city</Link>}
            unread={ctx.unreadNotifications}
          />

          <div className="mt-4">
            <FilterBar items={PILLS.map((p) => ({ key: p.key, label: p.label, href: href(p.key) }))} active={pill.key} />
          </div>

          {page.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title={offset > 0 ? "That's everything" : "Nothing here yet"}
                body={pill.kind === "car_ads" && !listedVehicle ? "Add your car so you can apply the moment a campaign posts." : "New campaigns post every week."}
                actionHref={pill.kind === "car_ads" && !listedVehicle ? "/me/vehicles/new" : href("for_you")}
                actionLabel={pill.kind === "car_ads" && !listedVehicle ? "Add my car" : "Show everything"}
              />
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5">
              {page.map((card, i) => (
                <EarnCard key={card.id} card={card} vehicles={vehicles} priority={i < 3} index={i} />
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

        {/* Desktop rail: your money and your setup, as plain rows on the page. */}
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <Link href="/earnings" className="block">
              <p className="tnum font-display text-[2.5rem] leading-none font-800 tracking-[-0.03em] text-signal">{formatCredit(available)}</p>
              <p className="mt-1.5 text-sm text-ink-soft">Ready to pay out</p>
            </Link>
            <div className="rule mt-6 pt-4">
              <Link href="/activity" className="link-row w-full justify-between">
                <span>In progress</span>
                <span className="tnum font-display text-lg font-800 text-ink">{active}</span>
              </Link>
              {listedVehicle ? (
                <Link href={`/me/vehicles/${listedVehicle.id}`} className="link-row w-full justify-between">
                  <span>{listedVehicle.year} {listedVehicle.make} {listedVehicle.model}</span>
                  <span className={`text-sm ${listedVehicle.available ? "text-signal" : "text-ink-faint"}`}>{listedVehicle.available ? "Available" : "Paused"}</span>
                </Link>
              ) : (
                <Link href="/me/vehicles/new" className="link-row w-full justify-between">
                  <span>Add your car</span>
                  <span className="text-sm text-ink-faint">Car ads</span>
                </Link>
              )}
              {ctx.instagram.status === "disconnected" && (
                <Link href="/me/instagram" className="link-row w-full justify-between">
                  <span>Add Instagram</span>
                  <span className="text-sm text-ink-faint">Stories</span>
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
