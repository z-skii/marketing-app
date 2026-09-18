"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Sheet } from "../ui/Sheet";
import { Viewer } from "../ui/Viewer";
import { Img } from "../ui/Img";
import { Money } from "../ui/parts";
import { Plan } from "../Plan";
import { businessCar, businessPeople, profile, money, homeOpportunities } from "../examples";
import { M } from "../media";
import { useMotion, usePresentationTimer } from "../motion";
import { SeqControls, Ordered, useSequence, type Frame } from "../Stage";
import { Chapter } from "./Shell";

/**
 * The business story on one dark media run: Find people, Find cars (the
 * second wow moment, One part of a real car), Create, Review, then back
 * to bright canvas for Monthly content. Every object is a fixture record
 * with its own media; nothing is assigned, accepted, approved or
 * scheduled by scrolling or playback.
 */
const [maya, nora, eli] = businessPeople;
const stills = { maya: [M.mayaPour(480), M.mayaCup()], nora: [M.noraChain(), M.noraWheel()], eli: [M.eliBag(), M.eliCup()] } as const;
const portraits = { maya: M.portraitMaya(480), nora: M.portraitNora(), eli: M.portraitEli() } as const;

// ---------------------------------------------------------- Find people
export function FindPeople() {
  const [sel, setSel] = useState(0);
  return (
    <Chapter id="find-people" verb="Find people" dark>
      <div className="x-fp">
        <div className="x-fp-lead">
          <div className="x-fp-media" data-sel={sel}>
            <span className="media x-fp-portrait"><img src={portraits.maya} alt="" width={480} height={600} decoding="async" loading="lazy" /></span>
            <div className="x-fp-work">
              {stills.maya.map((s, i) => (
                <button key={s} type="button" className={`media x-fp-still${sel === i ? " is-sel" : ""}`} aria-pressed={sel === i} aria-label={`${maya.name}, ${maya.project.title} still ${i + 1}`} onClick={() => setSel(i)}><img src={s} alt="" width={480} height={600} decoding="async" loading="lazy" /></button>
              ))}
            </div>
          </div>
          <div className="x-fp-id">
            <span className="t-object">{maya.name}</span>
            <span className="x-fp-actions">
              <span className="t-fact">Example creator</span>
              <Link href="/sign-up" className="btn btn-primary">Request</Link>
            </span>
          </div>
        </div>
        <div className="x-fp-others">
          {([nora, eli] as const).map((p) => (
            <div key={p.id} className="x-fp-other">
              <span className="media x-fp-other-portrait"><img src={portraits[p.id as "nora" | "eli"]} alt="" width={480} height={600} decoding="async" loading="lazy" /></span>
              <span className="media x-fp-other-work"><img src={stills[p.id as "nora" | "eli"][0]} alt={`${p.name}, ${p.project.title} still`} width={480} height={600} decoding="async" loading="lazy" /></span>
              <span className="x-fp-other-id"><span className="t-object">{p.name}</span><span className="t-fact">Example creator</span></span>
            </div>
          ))}
        </div>
      </div>
    </Chapter>
  );
}

// ------------------------------------------------------------ Find cars
const FC: Frame[] = [{ key: "car", label: "Eli’s car", dur: 1400 }, { key: "plan", label: "Placement plan", dur: 2200 }];
export function FindCars() {
  const { reduced } = useMotion();
  const stage = useRef<HTMLDivElement>(null);
  const seq = useSequence(FC, { stage });
  const open = seq.frame === 1;
  const [zone, setZone] = useState(false);
  // the supported zone fills 680ms into the opening; reduced motion fills immediately
  usePresentationTimer(open && !reduced && !zone, 680, () => setZone(true), open);
  const zoneOn = open && (reduced || zone);
  const carLink = "/sign-up";
  const photo = (
    <span className="x-fc-aperture">
      <img src={M.vehicleEli(800)} srcSet={`${M.vehicleEli(800)} 800w, ${M.vehicleEli(1200)} 1200w`} sizes="(min-width: 1024px) 976px, 100vw" alt="Eli’s car: a silver sedan parked outside a brick workshop" width={800} height={533} decoding="async" loading="lazy" className="x-fc-img" />
    </span>
  );
  const rate = <span className="x-fc-rate"><Money cents={businessCar.askCents} basis="/month" whole inline /><span className="t-fact-ink">Asking rate<span aria-hidden> · </span>Rear doors</span></span>;
  const band = (
    <div className="x-fc-band paper">
      {rate}
      <span className="x-fc-id"><span className="t-object">{businessCar.title}</span><button type="button" className="link t-action" onClick={() => { if (!open) { setZone(false); seq.go(1); } }} aria-pressed={open}>Rear doors</button></span>
      <Link href={carLink} className="btn btn-primary x-fc-view">View</Link>
    </div>
  );
  // Open: the zone, its asking rate and View form one reading group directly beneath the selected zone on the plan.
  const plan = (
    <div className="x-fc-plan paper">
      <span className="t-fact">{businessCar.title}<span aria-hidden> · </span>Placement plan</span>
      <span className={`x-fc-diagram${zoneOn ? " is-on" : ""}`}><Plan selected={zoneOn} /></span>
      <span className={`x-fc-zone t-object${zoneOn ? " x-reveal" : ""}`}>Rear doors</span>
      <span className="x-fc-plan-group">{rate}<Link href={carLink} className="btn btn-primary x-fc-view">View</Link></span>
    </div>
  );
  if (reduced) {
    return <Chapter id="find-cars" verb="Find cars" dark><Ordered id="find-cars" frames={FC} render={(i) => <div className="x-fc" data-frame={i}>{photo}{i === 0 ? band : plan}</div>} /></Chapter>;
  }
  return (
    <Chapter id="find-cars" verb="Find cars" dark>
      <div className={`x-fc${open ? " is-open" : ""}`} data-frame={seq.frame} data-zone={zoneOn ? "true" : "false"} ref={stage}>
        <div className="x-fc-stage">{photo}</div>
        {open ? <div className="x-fc-planwrap" key="plan">{plan}</div> : <div className="x-fc-bandwrap" key="band">{band}</div>}
      </div>
      <SeqControls seq={seq} frames={FC} showPlay={false} />
    </Chapter>
  );
}

// --------------------------------------------------------------- Create
type CKind = "recreate" | "story" | "car";
const CREATE: { k: CKind; label: string; src: string; w: number; h: number; ratio: string }[] = [
  { k: "recreate", label: "Recreate a Reel", src: M.reference4x5(720), w: 720, h: 900, ratio: "4 / 5" },
  { k: "story", label: "Instagram Story ads", src: M.story(480), w: 480, h: 853, ratio: "9 / 16" },
  { k: "car", label: "Car advertising", src: M.vehicleEli(800), w: 800, h: 533, ratio: "3 / 2" },
];
export function CreateThree() {
  const [sel, setSel] = useState<CKind | null>(null);
  const o = sel ? homeOpportunities.find((x) => x.kind === sel)! : null;
  return (
    <Chapter id="create" verb="Create" dark>
      <div className="x-cr" data-sel={sel ?? "none"}>
        {CREATE.map((c) => (
          <div key={c.k} className={`x-cr-obj x-cr-${c.k}${sel && sel !== c.k ? " x-recede" : ""}${sel === c.k ? " is-sel" : ""}`}>
            <button type="button" className="media x-cr-media" style={{ aspectRatio: c.ratio }} aria-pressed={sel === c.k} aria-label={`${c.label}: campaign preview`} onClick={() => setSel(sel === c.k ? null : c.k)}><img src={c.src} alt="" width={c.w} height={c.h} decoding="async" loading="lazy" /></button>
            <span className="x-cr-label"><span className="t-object">{c.label}</span><button type="button" className="link t-action" onClick={() => setSel(c.k)}>Open preview</button></span>
          </div>
        ))}
        {sel && o && (
          <div className="x-cr-preview paper x-open" key={sel}>
            <span className="t-fact">Campaign preview</span>
            <span className="t-object">{CREATE.find((c) => c.k === sel)!.label}</span>
            <dl className="facts x-cr-facts">
              <div><dt>Creator pay</dt><dd>{money(o.netCents)} {o.basis}</dd></div>
              <div><dt>{sel === "car" ? "Placement" : "Deadline"}</dt><dd>{sel === "car" ? "Rear doors" : o.applyBy}</dd></div>
            </dl>
            <span className="t-fact">Create campaigns from your business account.</span>
            <button type="button" className="link t-action" onClick={() => setSel(null)}>Close</button>
          </div>
        )}
      </div>
    </Chapter>
  );
}

// --------------------------------------------------------------- Review
const proofRecord = profile.work[2];
export function Review() {
  const [tab, setTab] = useState<"work" | "proof">("work");
  const isWork = tab === "work";
  return (
    <Chapter id="review" verb="Review" dark>
      <div className="x-rv">
        <div className="x-rv-object">
          {isWork ? <span className="media x-rv-media" key="work"><img src={M.mayaPour(800)} alt="Work: Maya Chen, Counter pour still for Loopday Coffee" width={800} height={1000} decoding="async" loading="lazy" /></span> : <span className="media x-rv-media x-rv-media-proof" key="proof"><img src={M.mayaPlacement()} alt="Proof: rear-door placement on Maya’s car, Spurroom Bikes" width={720} height={480} decoding="async" loading="lazy" /></span>}
        </div>
        <div className="x-rv-rail x-rv-edge">
          <div className="tabs" role="tablist" aria-label="Record">
            <button type="button" role="tab" aria-selected={isWork} onClick={() => setTab("work")}>Work</button>
            <button type="button" role="tab" aria-selected={!isWork} onClick={() => setTab("proof")}>Proof</button>
          </div>
          <span className="t-fact">Recorded example</span>
          <span className="t-object">{isWork ? maya.project.title : proofRecord.title}</span>
          <span className="t-fact">{isWork ? `${maya.name} · ${maya.project.business} · Approved ${maya.project.approved}` : `${profile.name} · ${proofRecord.business} · ${proofRecord.state} ${proofRecord.facts[1].value.replace("Proof approved ", "")}`}</span>
          {/* Both records are already approved: the action inspects the approval, it never invites a second decision. */}
          <Sheet title="Approval record" triggerClass="btn btn-primary" trigger="View approval">
            {isWork ? (
              <><p className="t-body" style={{ marginTop: 8 }}>Counter pour was approved on {maya.project.approved}. Its creator pay and fee are not in this exampleare not in this preview&rsquo;s recordsrsquo;s records.</p></>
            ) : (
              <dl className="facts" style={{ marginTop: 8 }}>
                <div><dt>Creator gross</dt><dd>{money(proofRecord.grossCents, { cents: true })}</dd></div>
                <div><dt>Platform fee</dt><dd>{money(proofRecord.feeCents, { cents: true })}</dd></div>
                <div><dt>Creator net</dt><dd>{money(proofRecord.netCents, { cents: true })}</dd></div>
                <div><dt>Credited</dt><dd>{proofRecord.creditedOn}</dd></div>
              </dl>
            )}
            <p className="t-object" style={{ marginTop: 16 }}>Approval credits earnings.</p>
            <p className="t-object">Payout is separate.</p>
            <p className="t-fact" style={{ marginTop: 8 }}>A recorded example.</p>
          </Sheet>
          <Link href="/sign-up" className="link t-action">Get started</Link>
        </div>
      </div>
    </Chapter>
  );
}

// -------------------------------------------------------------- Content
export function Content() {
  return (
    <Chapter id="content" verb="Monthly content">
      <div className="x-ct">
        <Viewer src="/marketing/v3/content-loopday-counter-01.jpg" alt="Delivered photograph: the Loopday Coffee counter" label="Open delivered photograph: counter" className="media x-ct-lead"><img src={M.contentCounter()} alt="" width={800} height={533} decoding="async" loading="lazy" /></Viewer>
        <Viewer src="/marketing/v3/content-loopday-pour-03.jpg" alt="Delivered photograph: a pour" label="Open delivered photograph: pour" className="media x-ct-tall"><img src={M.contentPour()} alt="" width={480} height={853} decoding="async" loading="lazy" /></Viewer>
        <Viewer src="/marketing/v3/content-loopday-pastry-02.jpg" alt="Delivered photograph: pastry" label="Open delivered photograph: pastry" className="media x-ct-small"><img src={M.contentPastry()} alt="" width={480} height={600} decoding="async" loading="lazy" /></Viewer>
        <div className="x-ct-caption">
          <span className="t-object">Made for you</span>
          <span className="t-fact">Loopday Coffee</span>
          <Link href="/sign-up" className="link t-action">Get started</Link>
          <span className="t-fact">Campaign spending is separate.</span>
        </div>
      </div>
    </Chapter>
  );
}

export { Img };
