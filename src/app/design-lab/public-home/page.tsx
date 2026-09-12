import Link from "next/link";
import { List, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Wordmark, Money } from "../parts";
import { ASSET, maya, opportunities, usd, people, contentFiles } from "../mock";
import { PhoneFrame } from "./frames";
import { Chapter } from "./Chapter";
import { Enhance } from "./Enhance";
import { BusinessDemo } from "./BusinessDemo";
import { PlacementDiagram } from "./PlacementDiagram";
import { RecreateCommitment, StoryCommitment, StoryEligibility, CarCommitment } from "../work";
import { PersonSpread, spreads } from "../business-home/PeopleRibbon";
import { ContentWorkspace } from "../business-content/ContentWorkspace";
import "./public.css";

/**
 * Prototype 05: the public homepage, refined into one continuous
 * source-to-commitment story. The hero joins a filming scene, one real
 * phone capture and an attached cobalt commitment excerpt. Three
 * full-width chapters each own their complete source assembly and the
 * real product commitment (Recreate on graphite, Post on canvas, Drive on
 * underlay); on the enhanced desktop each pins locally while scroll moves
 * only the sources. The business section is one working demonstration.
 * Get paid joins the steps to the financial reading region. Phone: the
 * same objects in normal flow, nothing pinned. Fixture data only.
 */
export default function PublicHomeLab() {
  const { recreate, story, car } = opportunities;
  const mayaSpread = spreads(people)[0];
  return (
    <div className="pub">
      <Enhance />
      <header className="pub-header">
        <Link href="/design-lab/public-home" aria-label="TapMart home"><Wordmark size={30} /></Link>
        <nav className="pub-nav" aria-label="Public">
          <Link href="#earn">Earn</Link>
          <Link href="#business">For businesses</Link>
          <Link href="#how">How it works</Link>
          <Link href="#sign-in" className="pub-signin">Sign in</Link>
          <Link href="#start" className="btn btn-primary">Get started</Link>
        </nav>
        <div className="pub-header-m">
          <Link href="#sign-in" className="pub-signin-m">Sign in</Link>
          <button type="button" className="btn btn-secondary pub-menu" aria-haspopup="dialog"><List size={20} aria-hidden />Menu</button>
        </div>
      </header>

      {/* Hero: the first source-to-commitment joint. */}
      <section className="pub-hero" aria-labelledby="hero-title">
        <div className="pub-hero-text">
          <h1 id="hero-title" className="pub-h1">Recreate.<br />Post. Drive.<br />Get paid.</h1>
          <p className="pub-sub">Film a Reel. Share a supplied Story. Advertise on your car.</p>
          <div className="pub-actions">
            <Link href="#earn" className="btn btn-secondary pub-audience">Start earning</Link>
            <Link href="#business" className="btn btn-secondary pub-audience">For businesses</Link>
          </div>
          <p className="pub-conditions">Check the task, eligibility and approval conditions.</p>
        </div>
        <div className="pub-hero-media">
          <div className="pub-filming">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSET("public-filming-01")} alt="A person filming a short video at a coffee counter with a phone on a small tripod" />
          </div>
          <PhoneFrame src={ASSET("capture-user-home-390", "png")} alt="The implemented TapMart User Home, showing three demo opportunities" width={252} className="pub-hero-phone" />
          <div className="pub-hero-excerpt on-dark" aria-label="Demo opportunity">
            <div>
              <p className="t-meta" style={{ margin: 0, color: "#FFFFFF" }}>Demo opportunity</p>
              <p className="t-task" style={{ margin: "2px 0 0", color: "#FFFFFF" }}>{recreate.title}</p>
            </div>
            <Money cents={recreate.payCents} per={recreate.basis} dark />
          </div>
          <div className="pub-hero-foot">
            <p className="t-meta" style={{ margin: 0 }}>Demo product · Generated filming illustration</p>
            <Link href="/design-lab/user-home" className="btn btn-secondary pub-open">Open earning example</Link>
          </div>
        </div>
      </section>

      <div id="earn">
        {/* Recreate: reference, filming, real conditional pay. */}
        <Chapter id="recreate" tone="graphite" phases={[0.4, 0.8]} label="Recreate">
          <div className="pub-chapter-head on-dark">
            <h2 className="pub-h2">Recreate.</h2>
            <p className="t-task">Film your version of a business&apos;s Reel.</p>
          </div>
          <div className="pub-body">
            <div className="pub-sources pub-sources-recreate on-dark">
              <div className="pub-src-ref">
                <div className="media contain" style={{ width: 224, height: 398, background: "var(--tm-stage)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={recreate.reference} alt="Reference still: a latte being poured at the Loopday Coffee counter" width={224} height={398} />
                </div>
                <span className="t-meta pub-label" style={{ color: "var(--tm-muted-dark)" }}>Reference still · Demo</span>
              </div>
              <div className="pub-src-film">
                <div className="media" style={{ width: 624, height: 416 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ASSET("public-filming-01")} alt="A person filming their own version at a coffee counter" width={624} height={416} />
                </div>
                <span className="t-meta pub-label" style={{ color: "var(--tm-muted-dark)" }}>Filming illustration · Generated</span>
              </div>
            </div>
            <div className="pub-work pub-work-recreate">
              <div className="pub-joint" aria-hidden />
              <RecreateCommitment width={448} height={420} ledge={128} detail href="/design-lab/user-home#recreate" />
            </div>
          </div>
          <div className="pub-chapter-foot on-dark">
            <p className="t-meta" style={{ margin: 0, color: "var(--tm-muted-dark)" }}>Demo work · The reference is a still, not a player</p>
            <Link href="/design-lab/user-home#recreate" className="btn btn-secondary pub-open">See the example</Link>
          </div>
        </Chapter>

        {/* Post: the supplied Story, eligibility, the work state. */}
        <Chapter id="post" tone="canvas" phases={[0.4, 0.75]} label="Post">
          <div className="pub-chapter-head">
            <h2 className="pub-h2">Post.</h2>
            <p className="t-task">Share the supplied Story.</p>
          </div>
          <div className="pub-body">
            <div className="pub-sources pub-sources-post">
              <div className="pub-src-story">
                <div className="media" style={{ width: 288, height: 512, borderRadius: 0, boxShadow: "var(--tm-shadow-source)", background: "var(--tm-underlay)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={story.creative} alt="The supplied Story creative: Take a coffee break." width={288} height={512} />
                </div>
                <span className="t-meta pub-label">Supplied creative · Demo</span>
              </div>
              <div className="pub-src-elig"><StoryEligibility width={352} /></div>
            </div>
            <div className="pub-work pub-work-post">
              <StoryCommitment width={400} detail href="/design-lab/user-home#story" />
            </div>
          </div>
          <div className="pub-chapter-foot">
            <p className="t-meta" style={{ margin: 0 }}>Instagram is a manual entry here, not an API verification</p>
            <Link href="/design-lab/user-home#story" className="btn btn-secondary pub-open">See the example</Link>
          </div>
        </Chapter>

        {/* Drive: the vehicle, the placement concept, the monthly campaign. */}
        <Chapter id="drive" tone="underlay" phases={[0.45, 0.75]} label="Drive">
          <div className="pub-chapter-head">
            <h2 className="pub-h2">Drive.</h2>
            <p className="t-task">Carry an ad on your car.</p>
          </div>
          <div className="pub-body">
            <div className="pub-sources pub-sources-drive">
              <div className="pub-src-car">
                <div className="media" style={{ width: 640, height: 427 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={car.visual} alt="Campaign visual: a bike shop's delivery car parked outside the shop, no ad installed" width={640} height={427} />
                </div>
                <span className="t-meta pub-label">Campaign visual · Demo · No installed ad</span>
              </div>
              <div className="pub-src-diagram">
                <div className="pub-diagram-field"><PlacementDiagram width={208} /></div>
                <span className="t-meta pub-label">Placement concept: rear doors.</span>
              </div>
            </div>
            <div className="pub-work pub-work-drive">
              <CarCommitment width={448} inset={0} detail href="/design-lab/user-home#car" />
            </div>
          </div>
          <div className="pub-chapter-foot">
            <p className="t-meta" style={{ margin: 0 }}>Artwork is never composited onto a photographed car</p>
            <Link href="/design-lab/user-home#car" className="btn btn-secondary pub-open">See the example</Link>
          </div>
        </Chapter>
      </div>

      {/* Phone chapters: the same objects in normal reading order. */}
      <div className="pub-phone-chapters" id="earn-phone" aria-label="How you earn">
        <section className="pub-pchapter tone-graphite on-dark">
          <h2 className="pub-h2">Recreate.</h2>
          <p className="t-task">Film your version of a business&apos;s Reel.</p>
          <div style={{ display: "flex", gap: 16, marginTop: 24, alignItems: "flex-start" }}>
            <div>
              <div className="media contain" style={{ width: 112, height: 199, background: "var(--tm-stage)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={recreate.reference} alt="Reference still" width={112} height={199} />
              </div>
              <span className="t-meta pub-label" style={{ color: "var(--tm-muted-dark)" }}>Reference still</span>
            </div>
            <div>
              <div className="media" style={{ width: 230, height: 153 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ASSET("public-filming-01")} alt="A person filming their own version" width={230} height={153} />
              </div>
              <span className="t-meta pub-label" style={{ color: "var(--tm-muted-dark)" }}>Filming illustration</span>
            </div>
          </div>
          <div style={{ marginTop: 16, marginLeft: "var(--tm-shift-phone)" }}><RecreateCommitment width={346} height={280} ledge={112} detail href="/design-lab/user-home#recreate" /></div>
        </section>
        <section className="pub-pchapter tone-canvas">
          <h2 className="pub-h2">Post.</h2>
          <p className="t-task">Share the supplied Story.</p>
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <div className="media" style={{ width: 180, height: 320, margin: "0 auto", borderRadius: 0, boxShadow: "var(--tm-shadow-source)", background: "var(--tm-underlay)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={story.creative} alt="The supplied Story creative: Take a coffee break." width={180} height={320} />
            </div>
            <span className="t-meta pub-label" style={{ display: "inline-block" }}>Supplied creative · Demo</span>
          </div>
          <div style={{ marginTop: 16 }}><StoryEligibility width={358} /></div>
          <div style={{ marginTop: 16, marginLeft: "var(--tm-shift-phone)" }}><StoryCommitment width={346} detail href="/design-lab/user-home#story" /></div>
        </section>
        <section className="pub-pchapter tone-underlay">
          <h2 className="pub-h2">Drive.</h2>
          <p className="t-task">Carry an ad on your car.</p>
          <div className="media" style={{ width: "100%", aspectRatio: "358 / 239", marginTop: 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={car.visual} alt="Campaign visual: a bike shop's delivery car, no ad installed" />
          </div>
          <span className="t-meta pub-label">Campaign visual · Demo · No installed ad</span>
          <div style={{ marginTop: 16 }}><PlacementDiagram width={160} /><span className="t-meta pub-label">Placement concept: rear doors.</span></div>
          <div style={{ marginTop: 16 }}><CarCommitment width={358} inset={12} detail href="/design-lab/user-home#car" /></div>
        </section>
      </div>

      {/* Business: one working demonstration. */}
      <section id="business" className="pub-section pub-biz" aria-labelledby="biz-title">
        <h2 id="biz-title" className="pub-h2">Put your business out there.</h2>
        <div className="pub-biz-desktop">
          <BusinessDemo />
          <Link href="/design-lab/business-home" className="btn btn-secondary pub-open" style={{ marginTop: 16 }}>Open full example</Link>
        </div>
        <div className="pub-biz-phone">
          <h3 className="t-section" style={{ margin: "24px 0 0" }}>Campaigns</h3>
          <p className="t-task" style={{ margin: "4px 0 16px" }}>Choose people or cars. Fund the work.</p>
          <PersonSpread s={mayaSpread} compact />
          <Link href="/design-lab/business-home" className="btn btn-secondary pub-open" style={{ marginTop: 8 }}>Open example</Link>
          <h3 className="t-section" style={{ margin: "48px 0 0" }}>Monthly content</h3>
          <p className="t-task" style={{ margin: "4px 0 16px" }}>Real shoots. Photos and videos to review and schedule.</p>
          <ContentWorkspace files={contentFiles} shootLabel="Shoot 01 · May 7, 2026" uploader="Imani Cole" compact />
          <Link href="/design-lab/business-content" className="btn btn-secondary pub-open" style={{ marginTop: 16 }}>Open example</Link>
        </div>
        <dl className="pub-plans"><div><dt>Essential</dt><dd>1 shoot, 10 photos, 3 videos each month.</dd></div><div><dt>Growth</dt><dd>2 shoots, 20 photos, 6 videos each month.</dd></div></dl>
        <p className="t-task" style={{ marginTop: 24 }}>Campaign spending is separate from your content subscription.</p>
      </section>

      {/* Get paid: the steps joined to the financial reading region. */}
      <section id="how" className="pub-section pub-paid" aria-labelledby="paid-title">
        <div>
          <h2 id="paid-title" className="pub-h2">Get paid.</h2>
          <ol className="pub-steps">
            {[
              ["Choose work.", "Check the task, pay and conditions."],
              ["Do the work.", "Submit the required video, confirmation or proof."],
              ["Approval creates earnings.", "Request a payout from your available balance."],
            ].map(([t, b], i) => (
              <li key={t}>
                <span className="pub-step-n t-display">{i + 1}</span>
                <span className="t-section" style={{ display: "block" }}>{t}</span>
                <span className="t-body" style={{ display: "block" }}>{b}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="pub-earnings" aria-label="Demo earnings summary">
          <p className="t-meta" style={{ margin: 0 }}>Demo money · Not a customer result</p>
          <p className="t-meta" style={{ margin: "16px 0 0" }}>Available earnings</p>
          <p className="money-balance" style={{ margin: "2px 0 0" }}>{usd(maya.money.availableCents)}</p>
          <p className="t-body" style={{ margin: "8px 0 0" }}>Payout requested {usd(maya.money.payoutRequestedCents)}</p>
          <p className="t-body" style={{ margin: "12px 0 0" }}>Fees and a payout minimum apply. Payout requests are reviewed.</p>
        </div>
      </section>

      <section className="pub-section pub-final on-dark" aria-labelledby="final-title">
        <h2 id="final-title" className="pub-h2">Your next move.</h2>
        <div className="pub-actions">
          <Link href="#earn" className="btn btn-secondary pub-audience pub-audience-dark">Start earning <ArrowRight size={18} aria-hidden /></Link>
          <Link href="#business" className="btn btn-secondary pub-audience pub-audience-dark">For businesses <ArrowRight size={18} aria-hidden /></Link>
        </div>
      </section>

      <footer className="pub-footer">
        <Wordmark size={30} />
        <nav aria-label="Footer" className="pub-footer-links">
          {["Earn", "For businesses", "Sign in", "Terms", "Privacy", "Creator terms", "Rules"].map((l) => <Link key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}>{l}</Link>)}
        </nav>
        <p className="t-meta">2026 · Design Lab demonstration with fictional people and businesses.</p>
      </footer>
    </div>
  );
}
