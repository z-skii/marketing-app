import Link from "next/link";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles, getOpportunities, type FeedTab } from "@/lib/v2/opportunities";
import { EarnCard } from "@/components/v2/EarnCards";
import { FilterBar } from "@/components/v2/FilterBar";

const FILTERS = [
  { key: "for_you", label: "For you" },
  { key: "nearby", label: "Nearby" },
  { key: "recreate", label: "Recreate" },
  { key: "stories", label: "Stories" },
  { key: "cars", label: "Car ads" },
] as const;
import { EmptyState } from "@/components/v2/ui";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

/*
 * Home is the money marketplace: one mixed feed of the three ways to earn.
 * No tabs per type, no numbers, no sentence. The media is the design.
 */

export default async function HomePage({
  searchParams,
}: { searchParams: Promise<{ offset?: string; f?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null; // layout redirects
  if (ctx.mode === "business") redirect("/business");

  const f = params.f && FILTERS.some((x) => x.key === params.f) ? params.f : "for_you";
  const tab: FeedTab = f === "nearby" ? "nearby" : "for_you";
  const kind = f === "recreate" ? "recreate_reel" : f === "stories" ? "instagram_story" : f === "cars" ? "car_ads" : null;
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
  const href = (off = 0, key = f) => `/home${key !== "for_you" || off ? `?${[key !== "for_you" ? `f=${key}` : null, off ? `offset=${off}` : null].filter(Boolean).join("&")}` : ""}`;
  const listedVehicle = vehicles.find((v) => v.status === "listed");

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 pt-[18px] pb-6 md:px-8 md:pt-8 md:pb-10">
      <FilterBar label="Feed" active={f} items={FILTERS.map((x) => ({ key: x.key, label: x.label, href: href(0, x.key) }))} />
      <h2 className="eyebrow mx-0.5 mt-6 mb-2.5">{f === "nearby" ? (ctx.city ? `Near ${ctx.city}` : "Nearby") : "Earn now"}</h2>
      {f === "nearby" && !ctx.city && (
        <p className="mb-3 text-[13px] text-ink-soft"><Link href="/me/edit" className="underline decoration-ink-faint underline-offset-4">Add your city</Link> to see what is near you.</p>
      )}

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
        <div className="grid grid-cols-1 items-start gap-[14px] lg:grid-cols-2"><div className="contents">
          {page.map((card, i) => (
            <EarnCard key={card.id} card={card} vehicles={vehicles} priority={i < 3} index={i} />
          ))}
        </div></div>
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
