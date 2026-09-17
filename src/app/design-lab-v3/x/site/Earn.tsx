"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Sheet } from "../../../design-lab-v2/Sheet";
import { Img } from "../../../design-lab-v2/Img";
import { Money } from "../../../design-lab-v2/parts";
import { homeOpportunities, profile, money } from "../../../design-lab-v2/fixtures";
import { M } from "../media";
import { useMotion } from "../motion";
import { SeqControls, Ordered, useSequence, type Frame } from "../Stage";
import { Chapter } from "./Shell";
import { Plan } from "../Plan";

/**
 * The earning story: Recreate, Post, Drive, Get paid. Each act is a coded
 * sequence over real product objects, not a caption under a screenshot.
 * Recreate carries the first wow moment, The work changes hands: a hard
 * comparison boundary between two separately authored objects, the same
 * creator work expanding into the submission preview, the supplied
 * approval snapshot under a stationary rail, and the truthful earnings
 * relationship. Ownership per docs/design-lab-v3/MEDIA_MANIFEST.json.
 */
const recreate = homeOpportunities[0];
const story = homeOpportunities[1];
const car = homeOpportunities[2];
const latte = profile.work[0];
const PAYOUT_MINIMUM_CENTS = 2500; // src/lib/settings.ts default minimum_payout_cents
const PLATFORM_FEE_PCT = 15; // src/lib/settings.ts default platform_fee_pct

// ------------------------------------------------------------- Recreate
const RC: Frame[] = [
  { key: "reference", label: "Reference", dur: 1400 },
  { key: "creator", label: "Creator version", dur: 1600 },
  { key: "submit", label: "Submit", dur: 1800 },
  { key: "approved", label: "Approved example", dur: 1800 },
  { key: "earnings", label: "Earnings", dur: 1600 },
];

/** Two separately authored layers under one hard boundary. Drag maps linearly; buttons expose one layer; reduced motion uses the buttons only. */
function Comparison({ pct, setPct, active }: { pct: number; setPct: (n: number) => void; active: boolean }) {
  const { reduced } = useMotion();
  const stage = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const fromEvent = (e: PointerEvent<HTMLElement>) => {
    const r = stage.current?.getBoundingClientRect(); if (!r) return;
    setPct(Math.round(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))));
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); setPct(Math.max(0, pct - 5)); }
    if (e.key === "ArrowRight") { e.preventDefault(); setPct(Math.min(100, pct + 5)); }
    if (e.key === "Home") { e.preventDefault(); setPct(0); } if (e.key === "End") { e.preventDefault(); setPct(100); }
  };
  return (
    <div className="x-cmp">
      <div ref={stage} className="x-cmp-stage" onPointerMove={(e) => { if (dragging.current && !reduced) fromEvent(e); }} onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}>
        <span className="media x-cmp-layer x-cmp-ref"><img src={M.reference4x5(720)} srcSet={`${M.reference4x5(720)} 720w, ${M.reference4x5(1080)} 1080w`} sizes="(min-width: 1024px) 560px, 100vw" alt="Reference: milk poured into a green cup at a coffee counter" width={720} height={900} decoding="async" loading="lazy" /></span>
        <span className="media x-cmp-layer x-cmp-creator" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }} aria-hidden={pct === 0}><img src={M.mayaPour(800)} alt="Creator version: Maya Chen, Counter pour still" width={800} height={1000} decoding="async" loading="lazy" /></span>
        {!reduced && active && (
          <button type="button" className="x-cmp-handle" style={{ left: `${pct}%` }} aria-label="Comparison boundary" role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={pct === 0 ? "Reference" : pct === 100 ? "Creator version" : `${pct} percent creator version`} onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); fromEvent(e); }} onKeyDown={onKey}>
            <span className="x-cmp-grip lens" aria-hidden />
          </button>
        )}
        <span className="x-cmp-label x-cmp-label-l t-fact-ink" aria-hidden>Creator version</span>
        <span className="x-cmp-label x-cmp-label-r t-fact-ink" aria-hidden>Reference</span>
      </div>
      <div className="x-cmp-buttons" role="group" aria-label="Compare">
        <button type="button" className="link link-plain t-action" aria-pressed={pct === 0} onClick={() => setPct(0)}>Reference</button>
        <button type="button" className="link link-plain t-action" aria-pressed={pct === 100} onClick={() => setPct(100)}>Creator version</button>
      </div>
    </div>
  );
}

export function Recreate() {
  const { reduced } = useMotion();
  const seq = useSequence(RC);
  const [pct, setPct] = useState(0);
  const f = seq.frame;
  useEffect(() => { if (f === 0) setPct(0); if (f === 1) setPct(100); }, [f]);
  const source = <span className="media x-rc-source"><Img src={M.reference4x5(720)} alt="Reference" /><span className="t-fact x-rc-source-l">Reference</span></span>;
  const work = (cls = "") => <span className={`media x-rc-work ${cls}`}><img src={M.mayaPour(800)} alt="Creator version: Maya Chen, Counter pour still" width={800} height={1000} decoding="async" loading="lazy" /></span>;
  const money75 = <Money cents={recreate.netCents} basis="On approval" whole inline />;
  const Submission = (
    <div className="x-rc-sub">
      <span className="x-rc-workwrap">{work()}{source}</span>
      <div className="x-rc-task paper">
        <span className="t-fact">Submission preview</span>
        <span className="t-object">Counter pour</span>
        <span className="t-fact">{recreate.business}<span aria-hidden> · </span>Recreate</span>
        <ul className="x-rc-reqs t-fact-ink">{recreate.requirements.slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul>
        <span className="btn btn-primary x-rc-submit" aria-disabled="true">Submit</span>
        <span className="t-fact">Preview mode. Nothing is submitted.</span>
      </div>
    </div>
  );
  const Approval = (
    <div className="x-rc-approve">
      <div className="x-rc-under">{work("x-rc-work-under")}</div>
      <div className="x-rc-rail lens lens-rail" aria-label="Approval">
        <span className="x-rim" aria-hidden><img src={M.mayaPour(480)} alt="" /></span>
        <span className="t-fact">Approved example</span>
        <span className="t-object">Approved</span>
        <span className="t-fact-ink">Sep 10, 2026<span aria-hidden> · </span>{recreate.business}</span>
        <span className="t-fact">Recorded example</span>
      </div>
    </div>
  );
  const Ledger = (
    <div className="x-rc-ledger">
      {work("x-rc-work-small")}
      <div className="x-rc-ledger-lines paper">
        <span className="t-fact">Earnings</span>
        <span className="t-object">Approval earns.</span>
        <span className="t-object">Payout is separate.</span>
        <span className="t-fact">Ledger example unavailable for Counter pour. A recorded example follows under Get paid.</span>
      </div>
    </div>
  );
  const Actions = <Link href="/design-lab-v3/home?open=lab-recreate-loopday-pour" className="link t-action x-open-preview">Open preview</Link>;
  if (reduced) {
    return (
      <Chapter id="recreate" verb="Recreate">
        <Ordered id="recreate" frames={RC} render={(i) => i <= 1 ? <><Comparison pct={i === 0 ? 0 : 100} setPct={setPct} active={false} /><div className="x-rc-edge paper">{money75}<span className="t-fact">{recreate.business}</span></div></> : i === 2 ? Submission : i === 3 ? Approval : Ledger} />
        <div className="x-controls">{Actions}</div>
      </Chapter>
    );
  }
  return (
    <Chapter id="recreate" verb="Recreate">
      <div className="x-rc" data-frame={f}>
        {f <= 1 && <div className="x-rc-frame" key="cmp"><Comparison pct={pct} setPct={(n) => { setPct(n); }} active /><div className="x-rc-edge paper">{money75}<span className="t-fact">{recreate.business}</span></div></div>}
        {f === 2 && <div className="x-rc-frame x-open" key="submit">{Submission}</div>}
        {f === 3 && <div className="x-rc-frame" key="approve">{Approval}</div>}
        {f === 4 && <div className="x-rc-frame x-settle" key="ledger">{Ledger}</div>}
      </div>
      <SeqControls seq={seq} frames={RC} playLabel="Play">{Actions}</SeqControls>
    </Chapter>
  );
}

// ----------------------------------------------------------------- Post
const PO: Frame[] = [
  { key: "creative", label: "Creative", dur: 1400 },
  { key: "handoff", label: "Handoff preview", dur: 1600 },
  { key: "proof", label: "Proof", dur: 1600 },
  { key: "earnings", label: "Earnings", dur: 1400 },
];
export function Post() {
  const { reduced } = useMotion();
  const seq = useSequence(PO);
  const f = seq.frame;
  const creative = <span className="media x-po-creative"><img src={M.story(480)} srcSet={`${M.story(480)} 480w, ${M.story(720)} 720w`} sizes="(min-width: 1024px) 288px, 238px" alt="Story creative, Loopday Coffee" width={480} height={853} decoding="async" loading="lazy" /></span>;
  const rail = (
    <div className="x-po-rail paper">
      <Money cents={story.netCents} basis="On approval" whole />
      <span className="t-object">{story.title}</span>
      <span className="t-fact">{story.business}</span>
      <span className="t-fact">{story.facts[0]}</span>
    </div>
  );
  const handoff = (
    <div className="x-po-handoff">
      <span className="t-fact">Handoff preview</span>
      <span className="t-object">{story.title}</span>
      <Sheet title="Outside this preview" triggerClass="btn btn-primary" trigger="Post"><p className="t-body" style={{ marginTop: 8 }}>The Instagram handoff is not simulated. Opening a handoff is not proof of posting.</p><p className="t-fact" style={{ marginTop: 8 }}>Nothing is sent from this preview.</p></Sheet>
      <span className="t-fact-ink">Proof required</span>
    </div>
  );
  const proof = (
    <div className="x-po-proof paper">
      <span className="t-fact">Proof</span>
      <span className="t-object">Proof required</span>
      <ul className="x-rc-reqs t-fact-ink"><li>{story.requirements[0]}</li><li>{story.requirements[3]}</li><li>Proof by {story.extra?.[1].value}</li></ul>
      <span className="t-fact-ink">Approval required</span>
    </div>
  );
  const earnings = (
    <div className="x-po-earn paper">
      <span className="t-fact">Earnings</span>
      <Money cents={story.netCents} basis="On approval" whole inline />
      <span className="t-object">Approval earns.</span>
      <span className="t-object">Payout is separate.</span>
    </div>
  );
  const Actions = <Link href="/design-lab-v3/home?open=lab-story-loopday-24h" className="link t-action x-open-preview">Open preview</Link>;
  if (reduced) {
    return <Chapter id="post" verb="Post"><Ordered id="post" frames={PO} render={(i) => <div className="x-po" data-frame={i}>{creative}{i === 0 ? rail : i === 1 ? handoff : i === 2 ? proof : earnings}</div>} /><div className="x-controls">{Actions}</div></Chapter>;
  }
  return (
    <Chapter id="post" verb="Post">
      <div className="x-po" data-frame={f}>
        <div className={`x-po-stage${f >= 1 ? " x-po-viewport" : ""}`}>{creative}{f >= 1 && <span className="x-po-vp-label t-fact x-reveal">Handoff preview</span>}</div>
        {f === 0 && <div key="rail" className="x-po-side">{rail}</div>}
        {f === 1 && <div key="handoff" className="x-po-side x-open">{handoff}</div>}
        {f === 2 && <div key="proof" className="x-po-side x-po-side-proof">{proof}</div>}
        {f === 3 && <div key="earn" className="x-po-side x-reveal">{earnings}</div>}
      </div>
      <SeqControls seq={seq} frames={PO} playLabel="Play">{Actions}</SeqControls>
    </Chapter>
  );
}

// ---------------------------------------------------------------- Drive
const DR: Frame[] = [
  { key: "car", label: "Real car", dur: 1400 },
  { key: "placement", label: "Placement", dur: 1600 },
  { key: "campaign", label: "Campaign", dur: 1600 },
  { key: "monthly", label: "Monthly opportunity", dur: 1400 },
];
export function Drive() {
  const { reduced } = useMotion();
  const seq = useSequence(DR);
  const f = seq.frame;
  const photo = <span className="media x-dr-photo"><img src={M.vehicleEli(800)} srcSet={`${M.vehicleEli(800)} 800w, ${M.vehicleEli(1200)} 1200w`} sizes="(min-width: 1024px) 900px, 100vw" alt="Vehicle example: a silver sedan parked outside a brick workshop" width={800} height={533} decoding="async" loading="lazy" /><span className="t-note x-dr-caption">Vehicle example</span></span>;
  const band = (
    <div className="x-dr-band paper">
      <span className="x-dr-band-l"><Money cents={car.netCents} basis="/month" whole inline /><span className="t-fact-ink">Monthly approval</span></span>
      <span className="x-dr-band-r"><span className="t-object">{car.title}</span><span className="t-fact">{car.business}</span><span className="t-fact">{car.facts[0]}<span aria-hidden> · </span>{car.facts[1]}</span></span>
    </div>
  );
  const plan = (on: boolean) => (
    <div className={`x-dr-plan paper${on ? " is-on" : ""}`}>
      <span className="t-fact">Placement preview</span>
      <span className="x-plan-img" role="img" aria-label="Placement plan: the rear doors of a car, drawn as a side elevation"><Plan selected={on} /></span>
      <span className="t-object">Rear doors</span>
    </div>
  );
  const campaign = (
    <div className="x-dr-campaign paper">
      <span className="t-fact">Campaign</span>
      <span className="t-object">{car.extra?.[0].value}</span>
      <ul className="x-rc-reqs t-fact-ink"><li>{car.requirements[0]}</li><li>{car.requirements[2]}</li><li>{car.requirements[3]}</li></ul>
    </div>
  );
  const monthly = (
    <div className="x-dr-monthly paper">
      <Money cents={car.netCents} basis="/month" whole inline />
      <span className="t-object">Monthly approval</span>
      <span className="t-fact-ink">{car.requirements[4]}</span>
    </div>
  );
  const Actions = <Link href="/design-lab-v3/home?open=lab-car-spurroom-rear-doors" className="link t-action x-open-preview">View campaign</Link>;
  if (reduced) {
    return <Chapter id="drive" verb="Drive"><Ordered id="drive" frames={DR} render={(i) => <div className="x-dr" data-frame={i}>{photo}{i === 0 ? band : i === 1 ? plan(true) : i === 2 ? campaign : monthly}</div>} /><div className="x-controls">{Actions}</div></Chapter>;
  }
  return (
    <Chapter id="drive" verb="Drive">
      <div className="x-dr" data-frame={f}>
        <div className={`x-dr-stage${f >= 1 ? " is-wide" : ""}`}>{photo}</div>
        {f === 0 && <div key="band" className="x-dr-side">{band}</div>}
        {f === 1 && <div key="plan" className="x-dr-side x-open">{plan(true)}</div>}
        {f === 2 && <div key="campaign" className="x-dr-side x-open">{campaign}</div>}
        {f === 3 && <div key="monthly" className="x-dr-side x-settle">{monthly}</div>}
      </div>
      <SeqControls seq={seq} frames={DR} playLabel="Play">{Actions}</SeqControls>
    </Chapter>
  );
}

// ------------------------------------------------------------- Get paid
export function GetPaid() {
  return (
    <Chapter id="get-paid" verb="Get paid">
      <div className="x-gp">
        <span className="media x-gp-work"><img src={M.mayaLatte(480)} alt="Approved work: Latte take, hands placing an iced latte on a cafe counter" width={480} height={600} decoding="async" loading="lazy" /></span>
        <div className="x-gp-source">
          <span className="t-fact">Recorded example</span>
          <span className="t-object">{latte.title}</span>
          <span className="t-fact">{latte.business}<span aria-hidden> · </span>{latte.state} {latte.facts[0].value}</span>
        </div>
        <div className="x-gp-ledger paper">
          <span className="t-fact">Earnings</span>
          <Money cents={latte.netCents} basis={`Credited ${latte.creditedOn}`} />
          <span className="t-fact">Gross {money(latte.grossCents, { cents: true })}<span aria-hidden> · </span>Fee {money(latte.feeCents, { cents: true })}</span>
          <span className="t-object">Approval earns.</span>
          <span className="t-object">Payout is separate.</span>
          <Sheet title="Payout details" triggerClass="link t-action x-gp-payout" trigger="Payout details">
            <dl className="facts" style={{ marginTop: 8 }}>
              <div><dt>Payout minimum</dt><dd>{money(PAYOUT_MINIMUM_CENTS, { cents: true })}</dd></div>
              <div><dt>Platform fee</dt><dd>{PLATFORM_FEE_PCT}% of gross</dd></div>
              <div><dt>Payout fee</dt><dd>Not available</dd></div>
            </dl>
            <p className="t-body" style={{ marginTop: 16 }}>Approval creates earnings, not a completed payout. No payout runs in this preview.</p>
          </Sheet>
        </div>
      </div>
    </Chapter>
  );
}
