import Link from "next/link";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles, getOpportunities, type FeedTab } from "@/lib/v2/opportunities";
import { EarnCard } from "@/components/v2/EarnCards";
import { EmptyState, ScreenHeader } from "@/components/v2/ui";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/*
 * Home is the money marketplace: one mixed feed of the three ways to earn.
 * No tabs per type, no numbers, no sentence. The media is the design.
 */

export default async function HomePage({
  searchParams,
}: { searchParams: Promise<{ offset?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null; // layout redirects
  if (ctx.mode === "business") redirect("/business");

  const tab: FeedTab = "for_you";
  const kind = null;
  const offset = Math.max(parseInt(params.offset ?? "0", 10) || 0, 0);
  const pageSize = 12;

  const [cards, vehicles] = await Promise.all([
    getOpportunities({ viewerId: ctx.user.id, viewerCity: ctx.city, tab, kind, limit: pageSize + 1, offset }),
    getMyVehicles(ctx.user.id),
  ]);
  const hasMore = cards.length > pageSize;
  // The first page opens with one of each earning type, then the rest in feed order.
  const firstPage = cards.slice(0, pageSize);
  const leads = ["car_ads", "recreate_reel", "instagram_story"]
    .map((k) => firstPage.find((c) => c.kind === k))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const page = offset === 0 ? [...leads, ...firstPage.filter((c) => !leads.includes(c))] : firstPage;
  const href = (off = 0) => `/home${off ? `?offset=${off}` : ""}`;
  const listedVehicle = vehicles.find((v) => v.status === "listed");

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 pt-3 pb-6 md:px-8 md:pt-8 md:pb-10">
      <ScreenHeader bell={false} showSearch={false}
        kicker="Ways to make money"
        title={ctx.city ?? <Link href="/me/edit" className="underline decoration-ink-faint underline-offset-4">Add your city</Link>}
        unread={ctx.unreadNotifications}
      />

      {page.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={offset > 0 ? "That's everything" : "Nothing here yet"}
            body={!listedVehicle ? "Add your car so you can apply the moment a campaign posts." : "New campaigns post every week."}
            actionHref={!listedVehicle ? "/me/vehicles/new" : "/home"}
            actionLabel={!listedVehicle ? "Add my car" : "Refresh"}
          />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 items-start gap-x-5 gap-y-8 lg:grid-cols-2">
          {page.map((card, i) => (
            <EarnCard key={card.id} card={card} vehicles={vehicles} priority={i < 3} index={i} />
          ))}
        </div>
      )}

      {(hasMore || offset > 0) && (
        <div className="mt-8 flex items-center justify-between">
          {offset > 0 ? (
            <Link href={href(Math.max(offset - pageSize, 0))} className="btn">Newer</Link>
          ) : <span />}
          {hasMore && <Link href={href(offset + pageSize)} className="btn">More</Link>}
        </div>
      )}
    </main>
  );
}
