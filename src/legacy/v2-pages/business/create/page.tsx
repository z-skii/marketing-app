import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";

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
    { href: `/business/create/recreate${q}`, kind: "recreate_reel", badge: "Recreate", title: "Recreate a Reel", media: "/uploads/seed/tapmart-recreate.jpg", pos: "50% 42%", posDesktop: "50% 44%", body: "Creators film their own version of your reference video.", aria: "Start Recreate a Reel campaign" },
    { href: `/business/create/story${q}`, kind: "instagram_story", badge: "Story", title: "Instagram Story ads", media: "/uploads/seed/tapmart-story.jpg", pos: "48% 46%", posDesktop: "50% 48%", body: "Creators post your finished Story creative for 24 hours.", aria: "Start Instagram Story ads campaign" },
    { href: `/business/create/car${q}`, kind: "car_ads", badge: "Car", title: "Car advertising", media: "/uploads/seed/tapmart-car.jpg", pos: "54% 50%", posDesktop: "53% 50%", body: "Your ad on local drivers' cars, paid monthly.", aria: "Start Car advertising campaign" },
  ] as const;

  return (
    <main id="main" className="mx-auto w-full max-w-[1208px] px-4 pt-[14px] pb-6 rail:px-8 rail:pt-8">
      <h1 className="font-display text-[23px] leading-[29px] font-[800] tracking-[-0.45px] rail:text-[30px] rail:leading-9 rail:font-[820] rail:tracking-[-0.8px]">Create campaign</h1>
      <p className="mt-1.5 text-[14px] leading-5 text-ink-soft">Pick a format to start a short setup.</p>

      <ul className="mt-4 grid gap-[14px] rail:mt-8 rail:grid-cols-3 rail:gap-[18px]" aria-label="Campaign types">
        {options.map((o, i) => {
          const suggested = rec?.kind === o.kind;
          return (
            <li key={o.kind} className="reveal" style={{ animationDelay: `${i * 35}ms` }}>
              <Link href={o.href} aria-label={o.aria} className="card group relative block h-[184px] w-full overflow-hidden transition-[transform,box-shadow] duration-100 active:scale-[0.985] rail:h-[560px] rail:rounded-[24px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={o.media} alt="" className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-150 can-hover:group-hover:brightness-[1.04]" style={{ objectPosition: o.pos }} loading={i === 0 ? "eager" : "lazy"} />
                <span className="absolute inset-x-0 top-0 h-[72px] bg-[image:var(--tm-scrim-top)]" aria-hidden />
                <span className="absolute inset-0 bg-[image:var(--tm-scrim)]" aria-hidden />
                <span className="glass-tag absolute top-[14px] left-[14px] uppercase">{o.badge}</span>
                {suggested && <span className="glass-tag absolute top-[14px] right-[14px] !bg-[color:var(--tm-lime-tint)] !text-signal">Recommended</span>}
                <span className="absolute inset-x-[14px] bottom-[14px] flex items-end justify-between gap-3 rail:inset-x-[18px] rail:bottom-[18px]">
                  <span className="min-w-0">
                    <span className="block font-display text-[20px] leading-[25px] font-[760] tracking-[-0.35px] text-ink rail:text-[24px] rail:leading-[29px] rail:font-[800] rail:tracking-[-0.55px]">{o.title}</span>
                    <span className="mt-[5px] line-clamp-2 block text-[13px] leading-[17px] font-600 text-ink-2 rail:text-[14px] rail:leading-5">{o.body}</span>
                  </span>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center text-ink"><CaretRight size={18} aria-hidden /></span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
