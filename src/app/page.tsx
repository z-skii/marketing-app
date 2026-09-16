import Link from "next/link";
import { Archivo, IBM_Plex_Sans } from "next/font/google";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { SITE_NAME } from "@/config/site";
import { PLANS, shootsLine } from "@/config/plans";
import { getSettings } from "@/lib/settings";
import { getV2Context } from "@/lib/v2/core";
import { planPrices } from "@/lib/v2/subscriptions";
import { Wordmark } from "@/components/fs/parts";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Chapter } from "@/components/site/Chapter";
import { BrowserFrame, PhoneFrame, Photo } from "@/components/site/frames";
import { Inspect } from "@/components/site/Inspect";
import { Strip } from "@/components/site/Strip";
import "./public.css";

export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "/" } };
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#F4F3EF" };

const display = Archivo({ subsets: ["latin"], weight: "variable", variable: "--font-fs-display", display: "swap" });
const ui = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-fs-ui", display: "swap" });

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/rules", label: "Rules" },
  { href: "/creator-terms", label: "Creator terms" },
];

/** A frame's inspect action: the same capture, readable. */
function phone(name: string, alt: string) {
  return { src: `/marketing/frames/${name}.webp`, alt, size: "phone" as const, width: 390, height: 844, label: "Inspect demo screen" };
}
function desk(name: string, alt: string) {
  return { src: `/marketing/frames/${name}.webp`, alt, size: "desktop" as const, width: 1440, height: 900, label: "Inspect demo screen" };
}

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function whole(cents: number): string {
  return cents % 100 === 0 ? `$${(cents / 100).toLocaleString("en-US")}` : money(cents);
}

/**
 * The public front door. It tells the product in the order a person meets
 * it: Recreate, Post, Drive, then how businesses use TapMart, then how pay
 * works and what a subscription costs. Every screen shown is a real
 * production capture taken with demo accounts; every number in the copy is
 * read from production configuration. A signed-in visitor can still read
 * the page and gets one way back into the app.
 */
export default async function HomePage() {
  const [ctx, prices, settings] = await Promise.all([getV2Context(), planPrices(), getSettings()]);
  const open = ctx && !ctx.user.suspended
    ? (ctx.onboarded ? { href: ctx.activeBusiness ? "/business" : "/home", label: "Open TapMart" } : { href: "/onboarding", label: "Finish setting up" })
    : null;
  const minimumPayout = Number(settings.minimum_payout_cents);
  const feePct = Number(settings.platform_fee_pct);
  const year = new Date().getFullYear();

  return (
    <div className={`fs site ${display.variable} ${ui.variable}`}>
      <SiteHeader open={open} />

      <main id="main">
        {/* ---------------------------------------------------------- hero */}
        <section className="site-hero" aria-labelledby="hero-title">
          <div className="site-wrap site-hero-grid">
            <div className="site-hero-copy">
              <p className="site-kicker">Local marketing. Real people.</p>
              <h1 id="hero-title" className="site-h1" style={{ marginTop: 12 }}>Recreate. Post. Drive. Get paid.</h1>
              <p className="site-lead">Local businesses pay people nearby to film a Reel, post a Story or carry an ad on their car. Approved work creates earnings you can pay out.</p>
              <div className="site-cta-row">
                <Link href="/sign-up" className="fs-btn fs-btn-primary">Start earning</Link>
                <a href="#business" className="fs-btn fs-btn-secondary">For businesses</a>
              </div>
            </div>
            <div>
              <div className="site-hero-art">
                <PhoneFrame name="user-home-390" alt="TapMart Home on a phone: a Recreate Reel campaign paying $75.00 per approved version and an Instagram Story ad paying $25.00" eager />
                <Photo src="/marketing/story-creative.webp" alt="A supplied Instagram Story creative for an iced latte offer" ratio="portrait" width={720} height={1280} eager className="is-sheet" />
                <Photo src="/marketing/filming.webp" alt="Illustration of a person filming a barista at a counter with a phone" ratio="wide" width={1400} height={933} eager />
              </div>
              <p className="site-caption">Demo product · Tyler · Home · For you. The Story is a supplied demo creative; the filming image is a generated illustration.</p>
              <div className="site-inspect-row"><Inspect {...phone("user-home-390", "Home, demo account, For you")} /></div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ chapters */}
        <div className="site-intro" id="earn">
          <div className="site-wrap">
            <div className="site-section-head" data-reveal>
              <p className="site-kicker">Three ways to earn</p>
              <h2 className="site-h2">Pick the work that fits you.</h2>
              <p className="site-lead">Every campaign states its pay and its conditions before you accept. You choose which ones to take.</p>
            </div>
          </div>
        </div>

        <Chapter
          id="recreate" tone="graphite" num="01" name="Recreate"
          title="Film your version of a business's Reel."
          lead="Follow the brief. Submit your video."
          note="The frames are separate demo records, not one live progression."
          cta={{ href: "/sign-up", label: "Find Recreate work" }}
          steps={[
            { title: "The business supplies the reference", body: "A supplied reference and a short brief: what to show, the pay per approved version and the deadline.", media: <PhoneFrame name="recreate-detail-390" alt="A Recreate campaign on a phone: the reference video, the brief and the pay per approved version" />, caption: "Demo product · Tyler · Open opportunity", plane: { amount: "$75.00", basis: "per approved version", lines: ["$63.75 to you after the $11.25 fee, if approved", "8 spots · Demo Coffee Co."], tone: "accent" }, inspect: phone("recreate-detail-390", "Recreate campaign, open opportunity, demo record") },
            { title: "You film your own version", body: "Your place, your phone, your take. It is a new video, not a repost of the reference.", media: <Photo src="/marketing/filming.webp" alt="Illustration of a person filming a barista at a counter with a phone on a tripod" ratio="wide" width={1400} height={933} />, caption: "Generated filming illustration, not a customer.", inspect: { src: "/marketing/filming.webp", alt: "Generated filming illustration", size: "photo", width: 1400, height: 933, label: "Inspect illustration" } },
            { title: "Submit it for review", body: "The business watches it and accepts it, or asks for one change with a note.", media: <PhoneFrame name="recreate-revision-390" alt="A submitted Recreate video on a phone with the business asking for one change" />, caption: "Demo product · Devon · Revision requested", inspect: phone("recreate-revision-390", "Recreate submission with a revision requested, demo record") },
            { title: "Approval creates earnings", body: "Accepted work moves to your available balance in Earnings.", media: <PhoneFrame name="earnings-390" alt="Earnings on a phone: an available balance with the Request payout action" />, caption: "Demo product · Devon · Earnings, demo balance", inspect: phone("earnings-390", "Earnings with a demo balance") },
          ]}
        />

        <Chapter
          id="post" tone="canvas" num="02" name="Post"
          title="Share the supplied Story."
          lead="Instagram eligibility and the required live time apply."
          note="The frames are separate demo records, not one live progression."
          cta={{ href: "/sign-up", label: "Find Story work" }}
          steps={[
            { title: "The creative is ready", body: "The business supplies the Story. You post it as it is, in the business's own look.", media: <Photo src="/marketing/story-creative.webp" alt="A finished 9:16 Instagram Story creative for an iced latte offer at a coffee shop" ratio="portrait" width={720} height={1280} className="is-sheet" />, caption: "Supplied Story creative, shown at 9:16 · Demo campaign", plane: { amount: "$25.00", basis: "after 24h live and approval", lines: ["1,000+ followers · 24h live", "Post our iced latte story · Demo Roastery"], tone: "surface" }, inspect: { src: "/marketing/story-creative.webp", alt: "Supplied Story creative, demo campaign", size: "photo", width: 720, height: 1280, label: "Inspect creative" } },
            { title: "Check what applies", body: "The follower minimum, the live time and the pay are on the campaign before you accept.", media: <PhoneFrame name="story-detail-390" alt="A Story campaign on a phone with its pay, follower requirement and live time" />, caption: "Demo product · Tyler · Open opportunity", inspect: phone("story-detail-390", "Story campaign, open opportunity, demo record") },
            { title: "Post it, then send proof", body: "A screenshot after the required live time. The business confirms it.", media: <PhoneFrame name="story-submitted-390" alt="A Story job on a phone after the proof was submitted, waiting for the business" />, caption: "Demo product · Devon · Campaign open · Proof in review", inspect: phone("story-submitted-390", "Story proof in review, demo record") },
            { title: "Follow every job in Activity", body: "Submitted, accepted, paid: each state is shown as it happens.", media: <PhoneFrame name="activity-390" alt="Activity on a phone listing the person's jobs and the state of each" />, caption: "Demo product · Devon · Activity", inspect: phone("activity-390", "Activity, demo records") },
          ]}
        />

        <Chapter
          id="drive" tone="underlay" num="03" name="Drive"
          title="Carry an ad on your real car."
          lead="Monthly pay follows approved proofs."
          note="The frames are separate demo records, not one live progression."
          cta={{ href: "/sign-up", label: "Find car placements" }}
          steps={[
            { title: "Add your car once", body: "Make, model, colour and photos. Campaigns are matched to real vehicles.", media: <Photo src="/marketing/car-context.webp" alt="Illustration of an ordinary estate car parked outside a local shop, with no ad on it" ratio="wide" width={1400} height={933} />, caption: "Generated illustration · No installed ad", inspect: { src: "/marketing/car-context.webp", alt: "Generated illustration of a car with no installed ad", size: "photo", width: 1400, height: 933, label: "Inspect illustration" } },
            { title: "A placement opens", body: "The placement, the duration and the monthly pay are stated before you apply.", media: <PhoneFrame name="car-detail-390" alt="A car ad campaign on a phone: $300.00 per month for a rear window placement over 30 days" />, caption: "Demo product · Tyler · Open placement · The wrapped car is the business's supplied campaign artwork", plane: { amount: "$300.00", basis: "per month", lines: ["$255.00 to you after the 15% fee", "Rear window · 30 days · Raleigh, NC"], tone: "surface" }, inspect: phone("car-detail-390", "Car ad campaign, open placement, demo record") },
            { title: "Book it, install it, prove it", body: "Installation is confirmed with photos. Monthly proofs keep the pay coming.", media: <PhoneFrame name="car-booking-390" alt="A booked car ad on a phone: installation next, the placement, the monthly pay and nothing paid yet" />, caption: "Demo product · Devon · Booking, installation next", inspect: phone("car-booking-390", "Car ad booking waiting for installation, demo record") },
          ]}
        />

        {/* ------------------------------------------------------ business */}
        <section id="business" className="site-section tone-canvas" aria-labelledby="business-title">
          <div className="site-wrap">
            <div className="site-section-head" data-reveal>
              <p className="site-kicker">For businesses</p>
              <h2 id="business-title" className="site-h2">Put your business out there.</h2>
              <p className="site-lead">Two systems in one account: campaigns that real people and real cars carry out, and monthly content from real shoots.</p>
            </div>

            <div className="site-system" data-reveal>
              <div className="site-system-copy">
                <p className="site-kicker"><span className="site-num">1</span>Campaigns</p>
                <h3 className="site-h3">Choose people or cars. Fund the work.</h3>
                <p className="site-body">Find people and cars near you. Create a Recreate, Story or Car campaign with the pay stated. Review every piece of work before it counts.</p>
              </div>
              <div>
                <div className="site-desk-composition">
                  <BrowserFrame name="business-home-1440" alt="Business Home on a desktop: people and cars near the business, and what needs attention" />
                  <PhoneFrame name="business-review-390" alt="Reviewing a submitted Story proof on a phone" />
                </div>
                <div className="site-only-desktop-block">
                  <p className="site-caption">Demo product · Demo Coffee Co. · Business Home · 4 campaign decisions · 2 files to approve</p>
                  <p className="site-caption">Demo product · Demo Coffee Co. · Story proof · Submitted</p>
                  <div className="site-inspect-row">
                    <Inspect {...desk("business-home-1440", "Business Home, demo account")} label="Inspect Business Home" />
                    <Inspect {...phone("business-review-390", "Story proof review, demo account")} label="Inspect Story proof" />
                  </div>
                </div>
                <Strip count={3} label="business screens">
                  <figure><PhoneFrame name="business-home-390" alt="Business Home on a phone: people and cars near the business" /><figcaption><p className="site-caption">Demo product · Demo Coffee Co. · Business Home · 4 campaign decisions</p><Inspect {...phone("business-home-390", "Business Home, demo account")} /></figcaption></figure>
                  <figure><PhoneFrame name="business-create-390" alt="Create on a phone: start a Recreate, Story or Car campaign" /><figcaption><p className="site-caption">Demo product · Demo Coffee Co. · Create a campaign</p><Inspect {...phone("business-create-390", "Create, demo account")} /></figcaption></figure>
                  <figure><PhoneFrame name="business-review-390" alt="Reviewing a submitted Story proof on a phone" /><figcaption><p className="site-caption">Demo product · Demo Coffee Co. · Story proof · Submitted</p><Inspect {...phone("business-review-390", "Story proof review, demo account")} /></figcaption></figure>
                </Strip>
              </div>
            </div>

            <div className="site-system" data-reveal>
              <div className="site-system-copy">
                <p className="site-kicker"><span className="site-num">2</span>Monthly content</p>
                <h3 className="site-h3">Real shoots. Photos and videos to review and schedule.</h3>
                <p className="site-body">A photographer or videographer comes to you. The delivered photos and videos land in your library to approve and put on the calendar.</p>
              </div>
              <div>
                <div className="site-desk-composition">
                  <BrowserFrame name="business-content-1440" alt="Business Content on a desktop: the month's shoot, the library and the calendar" />
                  <div className="site-contact">
                    <Photo src="/marketing/shoot-counter.webp" alt="Illustration of a coffee counter as a shoot photo" ratio="square" width={1200} height={800} />
                    <Photo src="/marketing/shoot-window.webp" alt="Illustration of a window seat as a shoot photo" ratio="square" width={900} height={600} />
                  </div>
                </div>
                <div className="site-only-desktop-block">
                  <p className="site-caption">Demo product · Demo Coffee Co. · Content · File: Edit requested · Post: Not scheduled</p>
                  <p className="site-caption">The two small images are generated sample illustrations, not delivered work.</p>
                  <div className="site-inspect-row"><Inspect {...desk("business-content-1440", "Business Content, demo account")} label="Inspect Content" /></div>
                </div>
                <Strip count={3} label="content screens">
                  <figure><PhoneFrame name="business-content-390" alt="Business Content on a phone: the month's shoot and the library" /><figcaption><p className="site-caption">Demo product · Demo Coffee Co. · Content · File: Edit requested</p><Inspect {...phone("business-content-390", "Business Content, demo account")} /></figcaption></figure>
                  <figure><Photo src="/marketing/shoot-counter.webp" alt="Illustration of a coffee counter as a shoot photo" ratio="square" width={1200} height={800} /><figcaption><p className="site-caption">Generated sample shoot illustration</p></figcaption></figure>
                  <figure><Photo src="/marketing/shoot-pour.webp" alt="Illustration of a latte being poured as a shoot photo" ratio="square" width={864} height={1536} /><figcaption><p className="site-caption">Generated sample shoot illustration</p></figcaption></figure>
                </Strip>
              </div>
            </div>

            <div className="site-plan-lines" data-reveal>
              {PLANS.map((p) => (
                <p key={p.key} className="site-plan-line">
                  <span className="site-h3">{p.name}</span>
                  <span className="site-body">{shootsLine(p.shoots)}.</span>
                  <span className="site-meta">{whole(prices[p.key])} a month</span>
                </p>
              ))}
            </div>
            <div className="site-rule-note" data-reveal>
              <p className="fs-t-task">Campaign spending is separate from your content subscription.</p>
              <p className="site-body" style={{ color: "var(--fs-muted)" }}>The subscription pays for the monthly content service. Campaigns are funded on their own as campaign credit, and that credit goes to the people who do the work.</p>
            </div>
            <div className="site-cta-row" data-reveal>
              <Link href="/sign-up" className="fs-btn fs-btn-primary">Create a business account</Link>
              <a href="#pricing" className="fs-btn fs-btn-secondary">See the plans</a>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- get paid */}
        <section id="how" className="site-section tone-canvas" aria-labelledby="how-title">
          <div className="site-wrap">
            <div className="site-section-head" data-reveal>
              <p className="site-kicker">How it works</p>
              <h2 id="how-title" className="site-h2">Get paid.</h2>
              <p className="site-lead">Choose work, do the work, get reviewed, request a payout. The conditions are always in the open.</p>
            </div>
            <div className="site-paid-grid">
              <ol className="site-paid-steps" data-reveal>
                <li><p className="site-step-num" aria-hidden>01</p><h3 className="site-h3">Choose work</h3><p className="site-body">Check the task, the pay and the conditions before you accept.</p></li>
                <li><p className="site-step-num" aria-hidden>02</p><h3 className="site-h3">Do the work</h3><p className="site-body">Follow the brief and submit what the campaign asks for.</p></li>
                <li><p className="site-step-num" aria-hidden>03</p><h3 className="site-h3">Approval creates earnings</h3><p className="site-body">The business reviews it. Accepted work moves to your available balance. The {feePct}% fee is already deducted from what you see.</p></li>
                <li><p className="site-step-num" aria-hidden>04</p><h3 className="site-h3">Request a payout</h3><p className="site-body">From {money(minimumPayout)} available. {SITE_NAME} sends payouts by hand, usually within a few days.</p></li>
              </ol>
              <div className="site-paid-media" data-reveal>
                <figure>
                  <div className="site-source-row">
                    <PhoneFrame name="earnings-390" alt="Earnings on a phone: the available balance, the payout minimum and the Request payout action" />
                    <div className="site-plane is-surface">
                      <p className="site-money site-plane-amount">$34.00</p>
                      <p className="site-plane-basis">available, demo balance</p>
                      <p className="site-plane-line">Minimum payout {money(minimumPayout)} · Request payout</p>
                    </div>
                  </div>
                  <figcaption>
                    <p className="site-caption">Demo product · Devon · Earnings · Nothing pending</p>
                    <Inspect {...phone("earnings-390", "Earnings with a demo balance")} />
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- pricing */}
        <section id="pricing" className="site-section tone-underlay" aria-labelledby="pricing-title">
          <div className="site-wrap">
            <div className="site-section-head" data-reveal>
              <p className="site-kicker">Business plans</p>
              <h2 id="pricing-title" className="site-h2">Two plans. Nothing hidden.</h2>
              <p className="site-lead">The subscription covers monthly content and the tools. Campaign pay is never inside it.</p>
            </div>
            <div className="site-plans" data-reveal>
              {PLANS.map((p) => (
                <div key={p.key} className="site-plan">
                  <h3 className="site-h3">{p.name}</h3>
                  <p className="site-meta" style={{ marginTop: 4 }}>{p.tagline}</p>
                  <p className="site-money site-plan-price">{whole(prices[p.key])}<span>a month</span></p>
                  <ul className="site-plan-features">
                    {p.features.filter((f) => !f.soon).map((f) => <li key={f.label}><Check size={16} weight="bold" aria-hidden />{f.label}</li>)}
                  </ul>
                  {p.features.some((f) => f.soon) && (
                    <>
                      <p className="site-meta site-plan-soon">Planned, not available today</p>
                      <ul className="site-plan-features is-soon">{p.features.filter((f) => f.soon).map((f) => <li key={f.label}>{f.label}</li>)}</ul>
                    </>
                  )}
                  <Link href="/sign-up" className="fs-btn fs-btn-secondary">{p.cta}</Link>
                </div>
              ))}
            </div>
            <div className="site-rule-note" data-reveal>
              <p className="fs-t-task">Three kinds of money, kept apart.</p>
              <p className="site-body" style={{ color: "var(--fs-muted)" }}>A business subscription pays for content and tools. Campaign credit funds campaigns and goes to the people who do the work. Earnings for a person come from approved work, with the {feePct}% fee already deducted, and are paid out on request.</p>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- finale */}
        <section className="site-finale tone-graphite fs-on-dark" aria-labelledby="finale-title">
          <div className="site-wrap" data-reveal>
            <h2 id="finale-title" className="site-h2">Your next local move.</h2>
            <div className="site-cta-row">
              <Link href="/sign-up" className="fs-btn fs-btn-primary">Start earning</Link>
              <Link href="/sign-up" className="fs-btn fs-btn-secondary">For businesses</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-wrap site-footer-grid">
          <div>
            <Wordmark size={30} />
            <p className="site-meta" style={{ marginTop: 8 }}>Local marketing. Real people.</p>
            <p className="site-meta" style={{ marginTop: 4 }}>{year} {SITE_NAME}</p>
          </div>
          <nav aria-label="Product">
            <p className="site-kicker">Product</p>
            <ul>
              <li><a href="#earn">Earn</a></li>
              <li><a href="#business">For businesses</a></li>
              <li><Link href="/sign-in">Sign in</Link></li>
            </ul>
          </nav>
          <nav aria-label="Legal">
            <p className="site-kicker">Legal</p>
            <ul>{LEGAL_LINKS.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}</ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
