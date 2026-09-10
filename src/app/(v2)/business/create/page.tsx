import Link from "next/link";
import { CaretRight, Play } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { getTrendsForBusiness } from "@/lib/trends";
import { ScreenHeader } from "@/components/v2/ui";
import { TrendTile } from "../trends/TrendCard";

export const metadata = { title: "Create" };
export const dynamic = "force-dynamic";

/**
 * Create: three choices and nothing else. Recreate a Reel, Instagram Story
 * ads, Car advertising. Each is a short guided flow that ends with real
 * people doing the work. Below, a few trends to start from.
 */
export default async function CreatePage({
  searchParams,
}: { searchParams: Promise<{ rec?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create"), searchParams]);
  const business = ctx.activeBusiness;

  const [rec, trends] = await Promise.all([
    params.rec
      ? sqlOne<{ kind: string }>(`select prefill->>'kind' as kind from marketing_recommendations where id = $1 and business_id = $2`, [params.rec, business.id])
      : Promise.resolve(null),
    getTrendsForBusiness(business.id).catch(() => []),
  ]);
  const q = params.rec ? `?rec=${params.rec}` : "";
  const withMedia = trends.filter((t) => t.media_url || t.thumbnail_url).slice(0, 6);

  const options = [
    { href: `/business/create/recreate${q}`, kind: "recreate_reel", title: "Recreate a Reel", media: "/uploads/seed/demo-coffee-cover.webp", stat: "Creators recreate your Reel", look: "video" },
    { href: `/business/create/story${q}`, kind: "instagram_story", title: "Instagram Story ads", media: "/uploads/seed/demo-latte.webp", stat: "Creators post your Story for 24 hours", look: "story" },
    { href: `/business/create/car${q}`, kind: "car_ads", title: "Car advertising", media: "/uploads/seed/demo-bmw.webp", stat: "Advertise on local cars, monthly", look: "car" },
  ] as const;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader bell={false} kicker="Create" title="What do you want to run?" wrap unread={ctx.unreadNotifications} showSearch={false} />

      <ul className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Campaign types">
        {options.map((o, i) => {
          const suggested = rec?.kind === o.kind;
          return (
            <li key={o.kind} className="reveal" style={{ animationDelay: `${i * 60}ms` }}>
              <Link href={o.href} className={`group relative block aspect-[16/9] w-full overflow-hidden rounded-[16px] bg-surface-2 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] can-hover:hover:-translate-y-1 sm:aspect-[4/5] ${suggested ? "ring-2 ring-signal" : ""}`}>
                {/* Each type shows its own kind of media: a video frame, a Story creative in a phone, a car. */}
                {o.look === "story" ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={o.media} alt="" className="h-full w-full scale-110 object-cover blur-[2px] brightness-50" loading="lazy" />
                    <span className="absolute inset-y-4 right-4 aspect-[9/16] overflow-hidden rounded-[10px] ring-1 ring-white/15 sm:inset-y-6 sm:right-1/2 sm:translate-x-1/2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.media} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </span>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.media} alt="" className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                )}
                <span className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
                {o.look === "video" && (
                  <span className="glass absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-ink" aria-hidden><Play size={16} weight="fill" /></span>
                )}
                {suggested && <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-signal">Suggested</span>}
                <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-display text-[1.375rem] leading-[1.05] font-800 tracking-[-0.03em] text-ink">{o.title}</span>
                    <span className="mt-1 block truncate text-sm text-ink-soft">{o.stat}</span>
                  </span>
                  <span className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink"><CaretRight size={18} weight="bold" aria-hidden /></span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {withMedia.length > 0 && (
        <section className="mt-8" aria-label="Start from a trend">
          <div className="flex items-baseline justify-between">
            <h2 className="eyebrow">Trend starters</h2>
            <Link href="/business/trends" className="link-row text-sm">See all<CaretRight size={14} aria-hidden /></Link>
          </div>
          <ul className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:-mx-8 md:px-8 [&::-webkit-scrollbar]:hidden">
            {withMedia.map((t, i) => <li key={t.id} className="shrink-0"><TrendTile trend={t} index={i} /></li>)}
          </ul>
        </section>
      )}
    </main>
  );
}
