import Link from "next/link";
import { List } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "../parts";
import { ASSET, maya, usd } from "../mock";
import { Chapters } from "./Chapters";
import { PhoneFrame, BrowserFrame } from "./frames";
import "./public.css";

/**
 * Prototype 05: the public homepage. Recreate. / Post. Drive. / Get paid.
 * One filming scene meets one real phone capture of the implemented User
 * Home. Three earning chapters share a sticky desktop stage whose source
 * changes with the active chapter; on phone they stack in normal flow.
 * The business section shows real browser captures of the marketplace
 * and Content workspace. Get paid is three plain steps and the read-only
 * Lab money summary. Every generated image is labelled as illustration,
 * and every scaled capture has its own standalone Open example control.
 */
export default function PublicHomeLab() {
  return (
    <div className="pub">
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
          <div className="pub-stage">
            <div className="pub-plane" aria-hidden />
            <div className="pub-filming">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSET("public-filming-01")} alt="A person filming a short video at a coffee counter with a phone on a small tripod" />
            </div>
            <PhoneFrame src={ASSET("capture-user-home-390", "png")} alt="The implemented TapMart User Home, showing three demo opportunities" width={224} className="pub-hero-phone" />
          </div>
          <div className="pub-stage-foot">
            <p className="t-meta" style={{ margin: 0 }}>Demo product · Generated filming illustration</p>
            <Link href="/design-lab/user-home" className="btn btn-secondary pub-open">Open earning example</Link>
          </div>
        </div>
      </section>

      <Chapters />

      <section id="business" className="pub-section" aria-labelledby="biz-title">
        <h2 id="biz-title" className="pub-h2">Put your business out there.</h2>
        <div className="pub-cols">
          <div>
            <h3 className="t-section">Campaigns</h3>
            <p className="t-task" style={{ margin: "4px 0 16px" }}>Choose people or cars. Fund the work.</p>
            <BrowserFrame src={ASSET("capture-business-home-1440", "png")} alt="The implemented Business Home marketplace: six people compared by their work, and a shelf of available cars" />
            <p className="t-meta" style={{ margin: "8px 0 0" }}>Demo product</p>
            <Link href="/design-lab/business-home" className="btn btn-secondary pub-open" style={{ marginTop: 8 }}>Open example</Link>
          </div>
          <div>
            <h3 className="t-section">Monthly content</h3>
            <p className="t-task" style={{ margin: "4px 0 16px" }}>Real shoots. Photos and videos to review and schedule.</p>
            <BrowserFrame src={ASSET("capture-business-content-1440", "png")} alt="The implemented Content workspace: one delivered original under review, a filmstrip of the other files, and the decision inspector" />
            <p className="t-meta" style={{ margin: "8px 0 0" }}>Demo product</p>
            <Link href="/design-lab/business-content" className="btn btn-secondary pub-open" style={{ marginTop: 8 }}>Open example</Link>
            <dl className="pub-plans"><div><dt>Essential</dt><dd>1 shoot, 10 photos, 3 videos each month.</dd></div><div><dt>Growth</dt><dd>2 shoots, 20 photos, 6 videos each month.</dd></div></dl>
          </div>
        </div>
        <p className="t-task" style={{ marginTop: 32 }}>Campaign spending is separate from your content subscription.</p>
      </section>

      <section id="how" className="pub-section" aria-labelledby="paid-title">
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
        <div className="pub-earnings" aria-label="Demo earnings summary">
          <p className="t-meta" style={{ margin: 0 }}>Demo money · Not a customer result</p>
          <p className="t-meta" style={{ margin: "16px 0 0" }}>Available earnings</p>
          <p className="money-balance" style={{ margin: "2px 0 0" }}>{usd(maya.money.availableCents)}</p>
          <p className="t-body" style={{ margin: "8px 0 0" }}>Payout requested {usd(maya.money.payoutRequestedCents)}</p>
          <p className="t-body" style={{ margin: "12px 0 0" }}>Fees and a payout minimum apply. Payout requests are reviewed.</p>
        </div>
      </section>

      <section className="pub-section pub-final" aria-labelledby="final-title">
        <h2 id="final-title" className="pub-h2">Your next move.</h2>
        <div className="pub-actions">
          <Link href="#earn" className="btn btn-secondary pub-audience">Start earning</Link>
          <Link href="#business" className="btn btn-secondary pub-audience">For businesses</Link>
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
