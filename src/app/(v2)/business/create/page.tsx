import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { ScreenHeader } from "@/components/v2/ui";

export const metadata = { title: "Create" };
export const dynamic = "force-dynamic";

/**
 * Create: three choices and nothing else. Recreate a Reel, Instagram Story
 * ads, Car advertising. Each is a short guided flow that ends with real
 * people doing the work. Trends live on their own screen.
 */
export default async function CreatePage({
  searchParams,
}: { searchParams: Promise<{ rec?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create"), searchParams]);
  const business = ctx.activeBusiness;

  const rec = params.rec
    ? await sqlOne<{ kind: string }>(`select prefill->>'kind' as kind from marketing_recommendations where id = $1 and business_id = $2`, [params.rec, business.id])
    : null;
  const q = params.rec ? `?rec=${params.rec}` : "";

  const options = [
    { href: `/business/create/recreate${q}`, kind: "recreate_reel", title: "Recreate a Reel", media: "/uploads/seed/demo-coffee-cover.webp", stat: "Creators recreate your Reel", look: "video" },
    { href: `/business/create/story${q}`, kind: "instagram_story", title: "Instagram Story ads", media: "/uploads/seed/demo-latte.webp", stat: "Creators post your Story for 24 hours", look: "story" },
    { href: `/business/create/car${q}`, kind: "car_ads", title: "Car advertising", media: "/uploads/seed/demo-bmw.webp", stat: "Advertise on local cars, monthly", look: "car" },
  ] as const;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pt-[18px] pb-6 md:px-8 md:py-8">
      <ScreenHeader bell={false} title="Create campaign" unread={ctx.unreadNotifications} showSearch={false} />

      <ul className="mt-[14px] grid gap-[14px] sm:grid-cols-3" aria-label="Campaign types">
        {options.map((o, i) => {
          const suggested = rec?.kind === o.kind;
          return (
            <li key={o.kind} className="reveal" style={{ animationDelay: `${i * 60}ms` }}>
              <Link href={o.href} className={`card group relative block h-[260px] w-full overflow-hidden sm:h-[300px] ${suggested ? "card-signal" : ""}`}>
                {/* Each type shows its own kind of media: a video frame, a Story creative in a phone, a car. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.media} alt="" className="hero-media h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                <span className="media-scrim absolute inset-0" aria-hidden />
                {suggested && <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-600 text-signal">Suggested</span>}
                <span className="absolute inset-x-4 bottom-[15px] z-[2] flex items-end justify-between gap-3">
                  <span className="min-w-0">
                    {suggested && <span className="glass-tag mb-[9px] text-signal">Suggested</span>}
                    <span className="mb-1 block font-display text-[20px] leading-[1.15] font-[760] tracking-[-0.6px] text-ink">{o.title}</span>
                    <span className="block truncate text-[13px] text-meta">{o.stat}</span>
                  </span>
                  
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

    </main>
  );
}
