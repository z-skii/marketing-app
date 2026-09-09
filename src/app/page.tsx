import Link from "next/link";
import { redirect } from "next/navigation";
import { SITE_NAME } from "@/config/site";
import { sql } from "@/lib/db";
import { getV2Context } from "@/lib/v2/core";
import { type EarnKind } from "@/lib/v2/opportunities";
import { planPrices } from "@/lib/v2/subscriptions";

// Signed-in people never see this; it decides where they go from the session.
export const dynamic = "force-dynamic";

const FOOTER_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/rules", label: "Rules" },
  { href: "/creator-terms", label: "Creator terms" },
];

const WAYS: { kind: EarnKind; title: string; body: string; media: string; tag: string; suffix?: string }[] = [
  {
    kind: "recreate_reel",
    title: "Recreate a Reel",
    body: "A business shows you a video. You film your own version. Approved versions get paid.",
    media: "/uploads/seed/demo-coffee-cover.webp",
    tag: "Recreate",
  },
  {
    kind: "instagram_story",
    title: "Post a Story",
    body: "A ready-made Story lands in your hands. Post it, keep it live for a day, send proof.",
    media: "/uploads/seed/demo-latte.webp",
    tag: "Story",
  },
  {
    kind: "car_ads",
    title: "Drive with a car ad",
    body: "Add your car once. When a campaign fits it, apply. Drive like you already do, paid monthly.",
    media: "/uploads/seed/demo-bmw.webp",
    tag: "Car ad",
    suffix: "/ month",
  },
];

const CAMPAIGNS = [
  { title: "Recreate", body: "Real people film their own version of your best video." },
  { title: "Story", body: "Your creative, posted to real Instagram Stories in your city." },
  { title: "Car ad", body: "Your artwork on real cars, driven around the neighbourhoods you serve." },
];

function dollars(cents: number) {
  return `$${Math.round(cents / 100)}`;
}

/** The best open pay per kind, so the numbers on this page are real campaigns, never examples. */
async function topPay(): Promise<Partial<Record<EarnKind, number>>> {
  const rows = await sql<{ kind: EarnKind; pay_cents: number }>(
    `select c.kind::text as kind, max(c.pay_cents)::int as pay_cents
       from campaigns c
      where c.status = 'open' and c.kind in ('recreate_reel', 'instagram_story', 'car_ads')
        and (c.deadline is null or c.deadline > now())
      group by c.kind`,
  );
  return Object.fromEntries(rows.map((r) => [r.kind, r.pay_cents]));
}

function PayTag({ cents, suffix, size = "md" }: { cents: number | undefined; suffix?: string; size?: "md" | "lg" }) {
  if (!cents) return null;
  return (
    <p className={`tnum font-display leading-none font-800 tracking-[-0.03em] text-signal ${size === "lg" ? "text-[1.75rem]" : "text-[1.375rem]"}`}>
      {dollars(cents)}
      {suffix && <span className={`ml-1.5 font-600 tracking-normal text-ink-soft ${size === "lg" ? "text-base" : "text-sm"}`}>{suffix}</span>}
    </p>
  );
}

/**
 * The front door for people who are not signed in. Signed-in people go
 * straight to the app, in whichever mode they left it. The page is the
 * product in one scroll: what a person earns, what a business gets, and
 * the two prices.
 */
export default async function LandingPage() {
  const ctx = await getV2Context();
  if (ctx && !ctx.user.suspended) redirect(ctx.activeBusiness ? "/business" : "/home");
  const [prices, pay] = await Promise.all([planPrices(), topPay()]);

  return (
    <div className="app-root flex min-h-dvh flex-col bg-paper text-ink">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-800 tracking-[-0.03em]">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-signal" />
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-2" aria-label="Account">
          <Link href="/sign-in" className="btn btn-ghost">Sign in</Link>
          <Link href="/sign-up" className="btn btn-signal hidden sm:inline-flex">Create account</Link>
        </nav>
      </header>

      <main id="main" className="flex-1">
        {/* ------------------------------------------------------------ hero */}
        <section className="mx-auto w-full max-w-6xl px-5 pt-10 pb-12 md:px-8 md:pt-20 md:pb-20">
          <div className="md:grid md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-center md:gap-12">
            <div>
              <h1 className="font-display text-[2.75rem] leading-[0.98] font-800 tracking-[-0.04em] md:text-[4.5rem]">
                Get paid to promote businesses.
              </h1>
              <p className="mt-5 font-display text-[1.25rem] leading-snug font-700 tracking-[-0.02em] text-ink-soft md:text-[1.5rem]">
                Recreate. Post. Drive. Get paid.
              </p>
              <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-ink-faint">
                Local businesses post campaigns. You do one real thing with your phone or your car, and the money lands in your earnings.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="btn btn-signal btn-lg">Create account</Link>
                <Link href="/sign-in" className="btn btn-lg">Sign in</Link>
              </div>
            </div>
            <div className="mt-10 grid grid-cols-[3fr_2fr] gap-3 md:mt-0">
              <div className="card relative aspect-[4/5] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/uploads/seed/demo-bmw.webp" alt="A car with a campaign wrap" className="h-full w-full object-cover" fetchPriority="high" />
                <div className="media-scrim absolute inset-x-0 bottom-0 h-2/3" aria-hidden />
                <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700">Car ad</span>
                <div className="absolute inset-x-4 bottom-4"><PayTag cents={pay.car_ads} suffix="/ month" size="lg" /></div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="card relative aspect-[4/5] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/uploads/seed/demo-latte.webp" alt="An iced latte Story creative" className="h-full w-full object-cover" />
                  <div className="media-scrim absolute inset-x-0 bottom-0 h-2/3" aria-hidden />
                  <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700">Story</span>
                  <div className="absolute inset-x-3 bottom-3"><PayTag cents={pay.instagram_story} /></div>
                </div>
                <div className="card relative aspect-[4/5] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/uploads/seed/demo-coffee-cover.webp" alt="A coffee shop reference video" className="h-full w-full object-cover" />
                  <div className="media-scrim absolute inset-x-0 bottom-0 h-2/3" aria-hidden />
                  <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700">Recreate</span>
                  <div className="absolute inset-x-3 bottom-3"><PayTag cents={pay.recreate_reel} /></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- how you earn */}
        <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-20" aria-labelledby="earn-title">
          <h2 id="earn-title" className="font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2.5rem]">How you earn</h2>
          <p className="mt-2 max-w-lg text-[0.9375rem] text-ink-soft">Three kinds of campaign. Pick the ones that fit you. Every one pays a set amount, shown up front.</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
            {WAYS.map((w, i) => (
              <li key={w.title} className="card overflow-hidden">
                <div className="relative aspect-[4/3] w-full bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.media} alt="" className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                  <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
                  <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700">{w.tag}</span>
                  <div className="absolute inset-x-4 bottom-4"><PayTag cents={pay[w.kind]} suffix={w.suffix} size="lg" /></div>
                </div>
                <div className="p-4 pt-3.5 md:p-5 md:pt-4">
                  <h3 className="font-display text-[1.25rem] leading-[1.15] font-800 tracking-[-0.02em]">{w.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{w.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-faint">Amounts shown are open campaigns right now. Each campaign shows its own pay before you start.</p>
        </section>

        {/* -------------------------------------------------------- business */}
        <section className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-20" aria-labelledby="business-title">
          <div className="card p-5 md:p-10">
            <div className="md:grid md:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] md:gap-12">
              <div>
                <p className="text-sm text-ink-soft">For businesses</p>
                <h2 id="business-title" className="mt-2 font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em] md:text-[2.5rem]">
                  Get real people to put your business in front of more people.
                </h2>
                <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">
                  Post a campaign, set the pay, approve the work. Your marketing calendar, ideas and every campaign live in one place.
                </p>
                <p className="mt-6 font-display text-[1.125rem] font-800 tracking-[-0.02em]">
                  Essential <span className="text-signal">{dollars(prices.essential)}/mo</span>
                  <span className="mx-2 text-ink-faint">·</span>
                  Growth <span className="text-signal">{dollars(prices.growth)}/mo</span>
                </p>
                <p className="mt-1.5 text-sm text-ink-faint">Campaign pay is separate and goes to the people who do the work.</p>
                <Link href="/sign-up" className="btn btn-signal btn-lg mt-6">Start a business account</Link>
              </div>
              <ul className="row-list mt-8 md:mt-0">
                {CAMPAIGNS.map((c) => (
                  <li key={c.title} className="card-2 px-4 py-3.5">
                    <p className="font-display text-[1.0625rem] font-800 tracking-[-0.02em]">{c.title}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">{c.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-faint" aria-label="Footer">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-ink">{l.label}</Link>
            ))}
          </nav>
          <Link href="/board" className="text-sm text-ink-faint hover:text-ink">The classic board</Link>
        </div>
      </footer>
    </div>
  );
}
