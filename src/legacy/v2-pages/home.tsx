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
import { MapPin } from "@phosphor-icons/react/dist/ssr";

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
    <main id="main" className="mx-auto w-full max-w-[1136px] px-4 pt-[14px] pb-6 rail:px-8 rail:pt-0">
      {/* Desktop page header: title left, global actions in the rail */}
      <div className="hidden rail:flex rail:h-16 rail:items-center">
        <h1 className="font-display text-[30px] leading-9 font-[820] tracking-[-0.8px]">Earn now</h1>
      </div>
      <h1 className="sr-only rail:hidden">Earn now</h1>
      <div className="-mx-4 px-4 rail:mx-0 rail:mt-[18px] rail:px-0">
        <FilterBar label="Feed" active={f} items={FILTERS.map((x) => ({ key: x.key, label: x.label, href: x.key === "nearby" && !ctx.city ? "/me/edit" : href(0, x.key) }))} />
      </div>
      {!ctx.city && (
        <div className="row mt-[14px] flex items-center gap-3 p-3">
          <span className="icon-square"><MapPin size={20} aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[14px] leading-[18px] font-700">Add your city</span>
            <span className="block text-[12px] leading-4 text-ink-soft">Nearby uses your city.</span>
          </span>
          <Link href="/me/edit" className="btn shrink-0">Add city</Link>
        </div>
      )}

      {page.length === 0 ? (
        <div className="mt-[14px] rail:max-w-[720px]">
          <EmptyState
            title="No opportunities right now"
            body="Check another filter or come back later."
            actionHref={f !== "for_you" ? "/home" : !listedVehicle ? "/me/vehicles/new" : undefined}
            actionLabel={f !== "for_you" ? "Show For you" : !listedVehicle ? "Add my car" : undefined}
          />
        </div>
      ) : (
        <div className="mt-[14px] grid grid-cols-1 items-start gap-[14px] rail:grid-cols-[348px_348px_360px] rail:gap-6"><div className="contents">
          {page.map((card, i) => (
            <EarnCard key={card.id} card={card} vehicles={vehicles} priority={i < 3} index={i} />
          ))}
        </div></div>
      )}

      {(hasMore || offset > 0) && (
        <div className="mt-4 flex items-center justify-between gap-3 rail:max-w-[720px]">
          {offset > 0 ? (
            <Link href={href(Math.max(offset - pageSize, 0))} className="btn flex-1">Newer</Link>
          ) : <span />}
          {hasMore && <Link href={href(offset + pageSize)} className="btn flex-1">More opportunities</Link>}
        </div>
      )}
    </main>
  );
}
