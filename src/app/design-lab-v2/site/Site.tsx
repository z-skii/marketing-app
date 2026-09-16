"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowsOutSimple, List, Plus } from "@phosphor-icons/react";
import { Sheet } from "../Sheet";
import { Viewer } from "../Viewer";
import { Preview } from "../Preview";
import { Edge, Money, Wordmark } from "../parts";
import { Img } from "../Img";
import { ASSET, money, plans, publicExamples } from "../fixtures";

/**
 * V2 Public Homepage, Open Cut: everyday before interface. Photography of the
 * three everyday activities opens along the earning edge into their coded
 * paid work previews. Desktop (1024 and up) uses a bounded native scroll
 * stage for the earning chapter; phone and tablet stack the same content.
 * Nothing here authenticates, sends or moves money.
 */

const PAYOUT_MINIMUM_CENTS = 2500; // src/lib/settings.ts default minimum_payout_cents
const PLATFORM_FEE_PCT = 15; // src/lib/settings.ts default platform_fee_pct

/** Entry boundary: no accounts are created here; the two lab previews are the useful alternative. */
export function Entry({ label, className = "btn btn-primary", business = false, plan }: { label: string; className?: string; business?: boolean; plan?: string | null }) {
  return (
    <Sheet title="Outside this preview" triggerClass={className} trigger={label}>
      <p className="t-body" style={{ marginTop: 8 }}>This preview does not create accounts, send requests or move money.</p>
      {plan && <p className="t-fact" style={{ marginTop: 8 }}>{plan} selected</p>}
      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        {!business && <Link href="/design-lab-v2/home" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Personal preview</Link>}
        <Link href="/design-lab-v2/business" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Business preview</Link>
        {business && <Link href="/design-lab-v2/home" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Personal preview</Link>}
      </div>
    </Sheet>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <a href="#top" aria-label="TapMart"><Wordmark size={22} className="site-wordmark" /></a>
      <nav className="site-nav" aria-label="Public">
        <a href="#earn">Earn</a><a href="#business">For businesses</a><a href="#how">How it works</a><a href="#pricing">Pricing</a>
      </nav>
      <span className="site-header-actions">
        <Entry label="Sign in" className="link link-plain t-action site-signin" />
        <span className="site-only-desktop"><Entry label="Start earning" /></span>
        <span className="site-only-phone">
          <Sheet title="Menu" variant="full" triggerClass="link link-plain t-action site-menu" trigger={<><List size={20} aria-hidden />Menu</>}>
            <nav className="site-menu-list" aria-label="Menu">
              <a href="#earn" className="sheet-row">Earn</a><a href="#business" className="sheet-row">For businesses</a><a href="#how" className="sheet-row">How it works</a><a href="#pricing" className="sheet-row">Pricing</a>
            </nav>
            <div style={{ marginTop: 24 }}><Entry label="Start earning" /></div>
          </Sheet>
        </span>
      </span>
    </header>
  );
}

/** Media sources: provenance on demand, not a caption under every image. */
export function Sources({ trigger, className = "link t-note" }: { trigger: string; className?: string }) {
  return (
    <Sheet title="Media sources" triggerClass={className} trigger={trigger}>
      <p className="t-body" style={{ marginTop: 8 }}>People, businesses and amounts in product previews are fictional.</p>
      <dl className="facts" style={{ marginTop: 16, gridTemplateColumns: "1fr" }}>
        <div><dt>Supplied campaign imagery</dt><dd>The three hero photographs: filming, a photographed Story, a wrapped car.</dd></div>
        <div><dt>Generated fixture media</dt><dd>Portraits, work stills and the Loopday and Spurroom assets.</dd></div>
        <div><dt>Real product capture</dt><dd style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Viewer src="/marketing/frames/user-home-390.webp" alt="Real product capture: Personal Home" label="Personal Home" className="link t-action" style={{ minHeight: 44 }}>Personal Home</Viewer>
          <Viewer src="/marketing/frames/business-home-1440.webp" alt="Real product capture: Business Home" label="Business Home" className="link t-action" style={{ minHeight: 44 }}>Business Home</Viewer>
        </dd></div>
      </dl>
    </Sheet>
  );
}

export function Hero() {
  return (
    <section className="site-hero" id="top">
      <h1 className="t-display site-headline">Your everyday<br />can earn.</h1>
      <div className="site-hero-actions"><Entry label="Start earning" /><a href="#business" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>For businesses</a></div>
      <div className="site-deck">
        <figure className="site-deck-item site-deck-creator">
          <Viewer src="/uploads/seed/tapmart-recreate.jpg" alt="Campaign imagery: a creator filming inside a coffee shop" label="Expand media" className="media site-deck-media" style={{ aspectRatio: "4 / 5" }}><Img src="/uploads/seed/tapmart-recreate.jpg" alt="" /></Viewer>
          <figcaption className="t-action">Recreate</figcaption>
        </figure>
        <figure className="site-deck-item site-deck-story">
          <Viewer src="/uploads/seed/tapmart-story.jpg" alt="Campaign imagery: a finished Story ad shown on a phone" label="Expand media" className="media site-deck-media" style={{ aspectRatio: "4 / 5" }}><Img src="/uploads/seed/tapmart-story.jpg" alt="" /></Viewer>
          <figcaption className="t-action">Post</figcaption>
        </figure>
        <figure className="site-deck-item site-deck-car">
          <Viewer src="/uploads/seed/tapmart-car.jpg" alt="Campaign imagery: a car with an advertising wrap" label="Expand media" className="media site-deck-media" style={{ aspectRatio: "3 / 2" }}><Img src="/uploads/seed/tapmart-car.jpg" alt="" position="50% 68%" /></Viewer>
          <figcaption className="t-action">Drive</figcaption>
        </figure>
        <Edge style={{ gridArea: "edge" }} />
      </div>
      <div><Sources trigger="Campaign imagery" /></div>
    </section>
  );
}

type Kind = "recreate" | "story" | "car";
const ORDER: Kind[] = ["recreate", "story", "car"];
const VERB: Record<Kind, string> = { recreate: "Recreate", story: "Post", car: "Drive" };

function ExampleDetail({ kind }: { kind: Kind }) {
  const e = publicExamples[kind];
  return (
    <div>
      <div className="op-band" style={{ marginTop: 16 }}>
        <div><Money cents={e.netCents} basis={e.basis} whole inline={kind === "car"} /></div>
        <Viewer src={e.media} alt={e.alt} label="Expand media" className="link t-action" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }}><ArrowsOutSimple size={18} aria-hidden />Expand media</Viewer>
      </div>
      <h3 className="t-object" style={{ marginTop: 12 }}>{e.title}</h3>
      <p className="t-fact" style={{ marginTop: 4 }}>{e.business}{kind === "recreate" && <><span aria-hidden> · </span>Reference frame</>}</p>
      <dl className="facts" style={{ marginTop: 24 }}>
        <div><dt>Deadline</dt><dd>{kind === "recreate" ? "Sep 30, 2026, 5:00 PM CDT" : kind === "story" ? "Oct 2, 2026, 5:00 PM CDT" : "Oct 1 to Dec 31, 2026"}</dd></div>
        {kind === "recreate" && <div><dt>Spots</dt><dd>3</dd></div>}
        {kind === "story" && <><div><dt>Live for</dt><dd>24 hours</dd></div><div><dt>Followers</dt><dd>1,000 minimum</dd></div></>}
        {kind === "car" && <><div><dt>City</dt><dd>Austin</dd></div><div><dt>Placement</dt><dd>Rear doors</dd></div></>}
      </dl>
      {kind === "story" && <><p className="state due" style={{ marginTop: 16, fontSize: 16, lineHeight: "24px" }}>Not posted</p><p className="t-fact" style={{ marginTop: 4 }}>Posting is not simulated in this preview.</p><p className="t-body" style={{ marginTop: 12 }}>Instagram connection required</p></>}
      {kind === "car" && <><p className="t-body" style={{ marginTop: 16 }}>Listed vehicle required</p><p className="t-body" style={{ marginTop: 8 }}>Proof approval required</p></>}
      <p className="t-body" style={{ marginTop: 16 }}>Requirements unavailable</p>
      <div className="preview-actions">
        <span className="t-fact">Applications are unavailable in this preview.</span>
      </div>
    </div>
  );
}

/** One earning example: a distinct composition per kind, media meeting the edge, money and one View. */
export function Example({ kind, stage = false }: { kind: Kind; stage?: boolean }) {
  const e = publicExamples[kind];
  return (
    <Preview id={`site-${kind}${stage ? "-stage" : ""}`} title={e.title} eyebrow="Fictional product preview" media={e.media} mediaRatio={e.ratio} mediaAlt={e.alt} content={<ExampleDetail kind={kind} />}>
      {(open) => (
        <article className={`obj op site-ex site-ex-${kind}`} aria-labelledby={`site-${kind}${stage ? "-stage" : ""}-h`}>
          {!stage && <h3 className="t-verb site-chapter-h">{VERB[kind]}</h3>}
          {!stage && <p className="t-note" style={{ marginTop: 4 }}>Fictional product preview</p>}
          <div className="site-ex-body">
            <button type="button" className="media-btn" onClick={open} aria-label={`View ${e.title}, ${e.business}`}>
              <span className="media op-media" style={{ aspectRatio: e.ratio }}><Img src={e.media} alt="" fit={kind === "recreate" ? "contain" : "cover"} /></span>
              {kind === "recreate" && <span className="t-fact" style={{ display: "block", marginTop: 8 }}>Reference frame</span>}
            </button>
            <Edge />
            <div className="site-ex-band">
              <div className="op-money"><Money cents={e.netCents} basis={e.basis} whole inline={kind === "car"} size="money" /></div>
              <h4 id={`site-${kind}${stage ? "-stage" : ""}-h`} className="t-object" style={{ marginTop: 12 }}>{e.title}</h4>
              <p className="t-fact" style={{ marginTop: 4 }}>{e.business}</p>
              <p className="t-fact" style={{ marginTop: 12 }}>{e.facts.map((f, i) => <span key={f}>{i > 0 && <span aria-hidden> · </span>}{f}</span>)}{kind === "car" && <span className="fact-line" style={{ display: "block", marginTop: 8 }}>Proof approval required</span>}</p>
              <button type="button" className="btn btn-primary op-view" style={{ marginTop: 16 }} onClick={open}>View</button>
            </div>
          </div>
        </article>
      )}
    </Preview>
  );
}

/** Desktop earning stage: a 92svh stage across 160svh of document; native scroll picks Recreate, Story, Car. Below 1024 or with reduced motion: stacked sections. */
export function EarnStage() {
  const [active, setActive] = useState<Kind>("recreate");
  const [enhanced, setEnhanced] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    const apply = () => setEnhanced(mq.matches);
    apply(); mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  useEffect(() => {
    if (!enhanced) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrap.current; if (!el) return;
        const r = el.getBoundingClientRect();
        const span = el.offsetHeight - window.innerHeight;
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, span)));
        setActive(p < 0.34 ? "recreate" : p < 0.67 ? "story" : "car");
      });
    };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [enhanced]);
  const jump = (k: Kind) => {
    const el = wrap.current; if (!el) { setActive(k); return; }
    const span = el.offsetHeight - window.innerHeight;
    const i = ORDER.indexOf(k);
    window.scrollTo({ top: el.offsetTop + span * (i / 3 + 0.05), behavior: "smooth" });
    setActive(k);
  };
  if (!enhanced) {
    return <div className="site-earn-stack">{ORDER.map((k) => <Example key={k} kind={k} />)}</div>;
  }
  return (
    <div ref={wrap} className="site-earn-wrap">
      <div className="site-earn-stage">
        <div className="site-earn-controls">
          <span className="t-note">Fictional product preview</span>
          <div role="tablist" aria-label="Earning examples" className="tabs">
            {ORDER.map((k) => <button key={k} type="button" role="tab" aria-selected={active === k} onClick={() => jump(k)}>{VERB[k]}</button>)}
          </div>
        </div>
        {ORDER.map((k) => (
          <div key={k} className="site-earn-panel" data-active={active === k ? "true" : "false"} aria-hidden={active !== k}>
            <h3 className="t-verb site-chapter-h">{VERB[k]}</h3>
            <Example kind={k} stage />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="site-how" id="how" aria-labelledby="how-h">
      <h2 id="how-h" className="v2-sr">How it works</h2>
      <ol className="site-steps">
        <li><span className="t-fact" aria-hidden>1</span><span className="t-body">Apply or accept</span></li>
        <li><span className="t-fact" aria-hidden>2</span><span className="t-body">Work or proof</span></li>
        <li><span className="t-fact" aria-hidden>3</span><span className="t-body">Business approval</span></li>
      </ol>
      <p className="t-body" style={{ marginTop: 24 }}>Approved work earns. Payout is separate.</p>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 8 }}>
        <Sheet title="Payout details" triggerClass="link t-action" triggerStyle={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} trigger="Payout details">
          <dl className="facts" style={{ marginTop: 8 }}>
            <div><dt>Payout minimum</dt><dd>{money(PAYOUT_MINIMUM_CENTS, { cents: true })}</dd></div>
            <div><dt>Payout fee</dt><dd>Not available</dd></div>
            <div><dt>Platform fee</dt><dd>{PLATFORM_FEE_PCT}% of gross</dd></div>
          </dl>
          <p className="t-body" style={{ marginTop: 16 }}>Approval creates earnings, not a completed payout.</p>
        </Sheet>
        <Link href="/design-lab-v2/home" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Open preview</Link>
      </div>
    </section>
  );
}

type BizStage = "people" | "cars" | "create" | "review";
const BIZ: { key: BizStage; label: string }[] = [{ key: "people", label: "Find people" }, { key: "cars", label: "Find cars" }, { key: "create", label: "Create campaign" }, { key: "review", label: "Review work" }];

function PersonRequest({ className = "btn btn-primary" }: { className?: string }) {
  const [choice, setChoice] = useState<string | null>(null);
  return (
    <Sheet title="Request" triggerClass={className} trigger="Request">
      {choice ? (
        <div style={{ marginTop: 8 }}><p className="t-object">{choice}</p><p className="t-body" style={{ marginTop: 12 }}>Outside this preview</p><p className="t-fact" style={{ marginTop: 4 }}>This preview does not create accounts, send requests or move money.</p><button type="button" className="link t-action" style={{ marginTop: 16, minHeight: 44 }} onClick={() => setChoice(null)}>Back</button></div>
      ) : (
        <div style={{ marginTop: 8 }}>
          <button type="button" className="sheet-row" onClick={() => setChoice("Recreate a Reel")}><span>Recreate a Reel</span></button>
          <button type="button" className="sheet-row" onClick={() => setChoice("Instagram Story ads")}><span>Instagram Story ads</span></button>
        </div>
      )}
    </Sheet>
  );
}

function ApprovalPreview() {
  return (
    <Sheet title="Approval preview" triggerClass="link t-action" triggerStyle={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} trigger="Preview approval">
      <dl className="facts" style={{ marginTop: 8 }}>
        <div><dt>Creator earnings</dt><dd>{money(publicExamples.recreate.netCents)}</dd></div>
        <div><dt>Platform fee</dt><dd>Not available</dd></div>
        <div><dt>Campaign debit</dt><dd>Not available</dd></div>
      </dl>
      <p className="t-body" style={{ marginTop: 16 }}>Approval is unavailable until exact fees and campaign debit are known.</p>
      <p className="t-body" style={{ marginTop: 8 }}>Approval creates earnings, not a completed payout.</p>
    </Sheet>
  );
}

function BizPanel({ k, heading }: { k: BizStage; heading?: boolean }) {
  const label = BIZ.find((b) => b.key === k)!.label;
  const work = ASSET("work-maya-loopday-01");
  return (
    <div className={`site-biz-panel site-biz-panel-${k}`}>
      {heading && <h3 className="t-object" style={{ marginBottom: 16 }}>{label}</h3>}
      {k === "people" && (
        <div className="site-biz-people">
          <div className="obj site-biz-person">
            <div className="site-biz-person-media">
              <Viewer src={ASSET("portrait-maya-01")} alt="Maya Chen, fictional creator" label="Expand media" className="media site-biz-portrait" style={{ aspectRatio: "4 / 5", display: "block" }}><Img src={ASSET("portrait-maya-01")} alt="" /></Viewer>
              <Viewer src={work} alt="Work sample: coffee handoff" label="Expand media" className="media site-biz-work" style={{ aspectRatio: "9 / 16", display: "block" }}><Img src={work} alt="" fallback="Work unavailable" /></Viewer>
            </div>
            <Edge />
            <div className="op-band" style={{ alignItems: "center" }}>
              <div><p className="t-object">Maya Chen</p><p className="t-fact">Austin</p></div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}><Entry label="View person" className="link t-action" business /><PersonRequest /></div>
            </div>
          </div>
          <div className="obj site-biz-car-teaser">
            <span className="media" style={{ aspectRatio: "3 / 2", display: "block" }}><Img src={ASSET("vehicle-eli-01")} alt="Eli’s car, a silver sedan outside a brick workshop" /></span>
            <Edge />
            <div className="op-band"><div><span className="t-fact-ink" style={{ display: "block" }}>From</span><Money cents={240_00} basis="/month" whole inline onInk /></div><Entry label="View" business /></div>
            <p className="t-fact" style={{ marginTop: 4 }}>Eli<span aria-hidden> · </span>Austin</p>
          </div>
        </div>
      )}
      {k === "cars" && (
        <div className="site-biz-cars obj">
          <span className="media" style={{ aspectRatio: "3 / 2", display: "block", maxWidth: 560 }}><Img src={ASSET("vehicle-eli-01")} alt="Eli’s car, a silver sedan outside a brick workshop" /></span>
          <Edge style={{ maxWidth: 560 }} />
          <div className="op-band" style={{ maxWidth: 560 }}><div><span className="t-fact-ink" style={{ display: "block" }}>From</span><Money cents={240_00} basis="/month" whole inline onInk /><span className="t-fact" style={{ display: "block", marginTop: 4 }}>Rear doors<span aria-hidden> · </span>Placement</span></div><Entry label="View" business /></div>
        </div>
      )}
      {k === "create" && (
        <div className="site-biz-create">
          <div className="site-biz-create-row">
            {([["Recreate a Reel", ASSET("reference-loopday-01"), "4 / 5"], ["Instagram Story ads", ASSET("story-loopday-01"), "9 / 16"], ["Car advertising", ASSET("vehicle-eli-01"), "3 / 2"]] as const).map(([l, src, ratio]) => (
              <div key={l} className="site-biz-choice"><span className="media" style={{ aspectRatio: ratio, display: "block" }}><Img src={src} alt="" /></span><span className="t-action" style={{ display: "block", marginTop: 8 }}>{l}</span></div>
            ))}
          </div>
          <div style={{ marginTop: 24 }}><Entry label="Create campaign" className="btn btn-lime" business /></div>
        </div>
      )}
      {k === "review" && (
        <div className="site-biz-review">
          <span className="media" style={{ aspectRatio: "9 / 16", display: "block", width: 200 }}><Img src={work} alt="Work sample: coffee handoff" fallback="Work unavailable" /></span>
          <div><p className="t-fact" style={{ marginBottom: 8 }}>Work sample</p><p className="t-object">Recreate this Reel</p><p className="t-fact" style={{ marginTop: 4 }}>Loopday Coffee</p><div style={{ marginTop: 16 }}><ApprovalPreview /></div></div>
        </div>
      )}
    </div>
  );
}

export function Business() {
  const [stage, setStage] = useState<BizStage>("people");
  return (
    <section className="site-biz on-ink" id="business" aria-labelledby="biz-h">
      <div className="site-inner">
        <h2 id="biz-h" className="t-verb site-chapter-h">For businesses</h2>
        <p className="t-note" style={{ color: "var(--v2-inverse-muted)", marginTop: 4 }}>Fictional product preview</p>
        <div className="site-biz-stage">
          <div role="tablist" aria-label="Business stages" className="tabs site-biz-tabs">
            {BIZ.map((b) => <button key={b.key} type="button" role="tab" aria-selected={stage === b.key} onClick={() => setStage(b.key)}>{b.label}</button>)}
          </div>
          <div className="site-biz-active fade-in" key={stage}><BizPanel k={stage} /></div>
        </div>
        <div className="site-biz-stack">{BIZ.map((b) => <BizPanel key={b.key} k={b.key} heading />)}</div>
        <div style={{ marginTop: 32 }}><Link href="/design-lab-v2/business" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Open preview</Link></div>
      </div>
    </section>
  );
}

export function Pricing() {
  const [plan, setPlan] = useState<string | null>(null);
  const chosen = plans.find((p) => p.id === plan) ?? null;
  return (
    <section className="site-pricing" id="pricing" aria-labelledby="pricing-h">
      <h2 id="pricing-h" className="t-verb site-chapter-h">Monthly Content</h2>
      <div className="site-pricing-grid">
        <div>
          <div className="site-shoots">
            {["shoot-counter", "shoot-pour", "shoot-window"].map((s) => <span key={s} className="media" style={{ aspectRatio: "4 / 3", display: "block" }}><Img src={`/marketing/${s}.webp`} alt="" /></span>)}
          </div>
          <p className="t-fact" style={{ marginTop: 8 }}>Shoot samples</p>
        </div>
        <div>
          <div role="radiogroup" aria-label="Plans" className="site-plans">
            {plans.map((p) => (
              <label key={p.id} className="site-plan" data-selected={plan === p.id ? "true" : "false"}>
                <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} className="v2-sr" />
                <span className="site-plan-name t-title">{p.name}</span>
                <span className="t-body" style={{ display: "block" }}>{p.cadence}</span>
                <span className="t-body" style={{ display: "block" }}>{p.line}</span>
                <span className="site-plan-price"><Money cents={p.priceCents} basis="/month" whole inline /></span>
              </label>
            ))}
          </div>
          <p className="t-body" style={{ marginTop: 16 }}>Campaign spending is separate.</p>
          {chosen && (
            <div className="site-plan-summary settle" role="status">
              <p className="t-object">{chosen.name}</p>
              <p className="t-fact" style={{ marginTop: 4 }}>Subscription<span aria-hidden> · </span>{money(chosen.priceCents)} /month<span aria-hidden> · </span>{chosen.cadence}, {chosen.line}</p>
              <p className="t-fact" style={{ marginTop: 8 }}>Campaign spending is separate. No subscription starts in this preview.</p>
            </div>
          )}
          <div style={{ marginTop: 16 }}><Entry label="Get started" business plan={chosen?.name ?? null} /></div>
        </div>
      </div>
    </section>
  );
}

function Legal({ label }: { label: string }) {
  return <Sheet title={label} triggerClass="link link-plain t-fact-ink" triggerStyle={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} trigger={label}><p className="t-body" style={{ marginTop: 8 }}>Terms unavailable in this preview.</p></Sheet>;
}

export function Footer() {
  return (
    <footer className="site-footer">
      <hr className="divider" />
      <div className="site-footer-row">
        <Wordmark size={22} />
        <Entry label="Start earning" />
      </div>
      <div className="site-footer-links">
        <Legal label="Terms" /><Legal label="Privacy" /><Legal label="Creator terms" /><Legal label="Campaign rules" /><Sources trigger="Media sources" className="link link-plain t-fact-ink" />
      </div>
    </footer>
  );
}

export function PlusIcon() { return <Plus size={18} aria-hidden />; }
export function Section({ children }: { children: ReactNode }) { return <div className="site-inner">{children}</div>; }
