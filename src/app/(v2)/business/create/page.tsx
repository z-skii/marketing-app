import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { ScreenHeader } from "@/components/v2/ui";

export const metadata = { title: "Create" };
export const dynamic = "force-dynamic";

/**
 * What do you want to run? Three answers. Each one is a short guided flow
 * that ends with real people doing the work. Nothing else lives here.
 */
export default async function CreatePage({
  searchParams,
}: { searchParams: Promise<{ rec?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create"), searchParams]);
  const business = ctx.activeBusiness;

  const rec = params.rec
    ? await sqlOne<{ kind: string }>(
        `select prefill->>'kind' as kind from marketing_recommendations where id = $1 and business_id = $2`,
        [params.rec, business.id],
      )
    : null;
  const q = params.rec ? `?rec=${params.rec}` : "";

  const options = [
    {
      href: `/business/create/recreate${q}`,
      kind: "recreate_reel",
      title: "Recreate a Reel",
      body: "Get real people to recreate content for your business. You pay per approved video.",
      media: "/uploads/seed/demo-coffee-cover.webp",
      stat: "From $25 per video",
    },
    {
      href: `/business/create/story${q}`,
      kind: "instagram_story",
      title: "Instagram Story ads",
      body: "Pay people to share a ready-made Story with their followers and keep it live 24 hours.",
      media: "/uploads/seed/demo-latte.webp",
      stat: "From $5 per story",
    },
    {
      href: `/business/create/car${q}`,
      kind: "car_ads",
      title: "Car advertising",
      body: "Put your brand on vehicles around your city. Drivers apply, you pick, we handle the rest.",
      media: "/uploads/seed/demo-bmw.webp",
      stat: "From $25 per car per month",
    },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader kicker={business.name} title="What do you want to run?" unread={ctx.unreadNotifications} showSearch={false} />
      <p className="mt-2 max-w-xl text-[1.0625rem] text-ink-soft">
        Three ways to put real people behind your marketing. Pick one and answer a few questions.
      </p>

      <ul className="mt-6 grid gap-4 lg:grid-cols-3">
        {options.map((o, i) => {
          const suggested = rec?.kind === o.kind;
          return (
            <li key={o.kind}>
              <Link href={o.href} className={`card block h-full overflow-hidden ${suggested ? "card-signal" : ""}`}>
                <div className="relative aspect-[16/10] w-full bg-surface-2 lg:aspect-[4/5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.media} alt="" className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                  <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
                  {suggested && <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-signal">Suggested</span>}
                  <div className="absolute inset-x-4 bottom-4">
                    <p className="font-display text-[1.5rem] leading-[1.05] font-800 tracking-[-0.03em]">{o.title}</p>
                    <p className="mt-1.5 font-display text-sm font-700 text-signal">{o.stat}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <p className="text-[0.9375rem] leading-relaxed text-ink-soft">{o.body}</p>
                  <span aria-hidden className="text-ink-faint">→</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-sm text-ink-faint">
        Campaign pay goes to the people who do the work and is funded from your campaign credit, separate from your plan.
      </p>
    </main>
  );
}
