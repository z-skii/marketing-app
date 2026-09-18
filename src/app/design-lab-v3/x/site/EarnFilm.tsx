"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { preload } from "react-dom";
import { Img } from "../../../design-lab-v2/Img";
import { homeOpportunities, businessPeople, money } from "../../../design-lab-v2/fixtures";
import { liveProgram } from "../../fixtures";
import { Logo } from "../../wallet/Cards";
import { M } from "../media";
import { useMotion } from "../motion";
import { FilmControls, Scene, damped, openEase, tl, useFilm, type Beat, type Film, type Tracks, type Viewport } from "../Film";

/**
 * Scene one of the film (RECOMPOSE_DIRECTION.md, hero and recreate, and
 * the director's pass 1 fixes): the hero composition on the dark
 * substrate and the Recreate transformation on one stage. At rest the
 * Loopday reference is the foreground anchor of a composition of real,
 * unequal product objects, with the opportunity terms in contact with its
 * lower edge. The two audience lines are the audience control
 * (?audience=earn|business is native history). On the handoff the
 * supporting planes converge behind the advancing reference and the terms
 * retract beneath its edge; nothing dissolves on the page. Recreate then
 * transforms one carrier four times: Loopday's reference wipes away under
 * a hard boundary to expose Maya's separate version registered beneath
 * it, the reference contracts into a labelled source thumbnail, the
 * approval rail (the one lens) passes over the work, and the opaque terms
 * open from the work's lower edge. Truth per MEDIA_MANIFEST.json: Counter
 * pour has no ledger record, so US$75 stays the reference opportunity's
 * conditional term.
 */
export type Audience = "earn" | "business";
const recreate = homeOpportunities[0];
const maya = businessPeople[0];
const H = 0.14; // the handoff: the first 240px of a 1680px desktop travel
const seg = (a: number, b: number) => [H + a * (1 - H), H + b * (1 - H)] as const;
const [REF0] = seg(0, 0.18);
const [VER0, VER1] = seg(0.18, 0.37);
const [SUB0, SUB1] = seg(0.37, 0.52);
const [APP0] = seg(0.52, 0.76);
const [END0] = seg(0.76, 1);
const THUMB1 = VER1 + 0.04;

export const EARN_BEATS: Beat[] = [
  { key: "hero", label: "TapMart", at: 0, dwell: 900 },
  { key: "reference", label: "Reference", at: REF0, dwell: 1200 },
  { key: "version", label: "Creator version", at: THUMB1 + 0.03, dwell: 1400 },
  { key: "approved", label: "Approved", at: APP0 + 0.1 * (1 - H), dwell: 1400 },
  { key: "earned", label: "Terms", at: END0 + 0.16, dwell: 1800 },
];

/** The composition in the director's top-left viewport coordinates, converted to stage offsets. */
function build(vp: Viewport, aud: Audience): Tracks {
  const biz = aud === "business";
  const P = vp.desktop
    ? { ref: tl(vp, 648, 174, 360, 450), portrait: tl(vp, biz ? 452 : 492, biz ? 330 : 320, 168, 210), work: tl(vp, 452, 556, 168, 210), story: tl(vp, 1000, 246, 190, 338), car: tl(vp, 420, 560, 440, 293), cartag: tl(vp, 432, 818, 108, 22), terms: biz ? tl(vp, 620, 612, 304, 96) : tl(vp, 760, 622, 304, 110), business: tl(vp, 80, 430, 390, 260), loyalty: tl(vp, 1084, 574, 324, 184), refW: 360, refH: 450 }
    : vp.tablet
      ? { ref: tl(vp, 262, 250, 300, 375), portrait: tl(vp, biz ? 100 : 150, biz ? 280 : 300, 140, 175), work: tl(vp, 100, 470, 140, 175), story: tl(vp, 560, 236, 150, 267), car: tl(vp, 300, 640, 380, 253), cartag: tl(vp, 312, 860, 108, 22), terms: tl(vp, 350, 623, 290, 96), business: tl(vp, -20, 470, 330, 220), loyalty: tl(vp, 530, 560, 220, 125), refW: 300, refH: 375 }
      : { ref: tl(vp, 104, 262, 244, 305), portrait: tl(vp, 8, biz ? 262 : 290, 92, 115), work: tl(vp, 8, 386, 92, 115), story: tl(vp, 296, 262, 94, 167), car: tl(vp, 140, 630, 240, 160), cartag: tl(vp, 16, 708, 108, 22), terms: biz ? tl(vp, 16, 568, 274, 84) : tl(vp, 100, 556, 274, 100), business: tl(vp, -32, 420, 216, 144), loyalty: tl(vp, 8, biz ? 664 : 590, 124, 96), refW: 244, refH: 305 };
  // Recreate carrier: 416x520 on the stage's inspection datum on desktop; 326 wide centered on phone
  const W = vp.desktop ? 416 : vp.tablet ? 360 : 326;
  const Hc = W * 1.25;
  const carrier = vp.desktop ? { x: 0, y: -8 } : vp.tablet ? { x: -60, y: -30 } : { x: 0, y: -vp.stageH / 2 + 100 + Hc / 2 };
  const refS = W / P.refW;
  // the source thumbnail: a quiet attached edge, labelled; left of the work on desktop, the work's top right on phone
  const thumbW = vp.desktop ? 80 : 64;
  const thumb = vp.desktop ? { x: carrier.x - W / 2 - 14 - thumbW / 2, y: carrier.y - Hc / 2 + 50 } : vp.tablet ? { x: carrier.x - W / 2 - 50 - thumbW / 2, y: carrier.y - Hc / 2 + 50 } : { x: carrier.x + W / 2 - 14 - thumbW / 2, y: carrier.y - Hc / 2 + 92 + thumbW * 1.25 / 2 };
  const thumbS = thumbW / P.refW;
  const railY = carrier.y - Hc / 2 + 36;
  const sub = vp.desktop ? { x: carrier.x + W / 2 + 170, y: carrier.y + 40 } : vp.tablet ? { x: carrier.x + W / 2 + 150, y: carrier.y + 40 } : { x: 0, y: carrier.y + Hc / 2 + 16 + 100 };
  // the terms: attached to the work's lower edge; the work rises so the finished cup stays in view
  const endS = vp.desktop ? 0.86 : vp.tablet ? 0.9 : 1;
  const rise = vp.desktop ? 95 : vp.tablet ? 70 : 0;
  const endH = vp.desktop ? 190 : 176;
  const end = { x: carrier.x, y: carrier.y - rise + Hc * endS / 2 + endH / 2 - 1 };
  // handoff: supporting planes converge behind the advancing reference at different distances and are occluded by it before they leave; the terms retract beneath its lower edge
  const dx = carrier.x - P.ref.x; const dy = carrier.y - P.ref.y;
  const behind = (from: { x: number; y: number }, k: number, s = 1) => [
    { at: 0, pose: { ...from, s, o: 1 } },
    { at: H * 0.7, pose: { x: from.x + dx * k + (carrier.x - from.x) * 0.55, y: from.y + dy * k + (carrier.y - from.y) * 0.55, s: s * 0.72, o: 1 }, ease: openEase },
    { at: H, pose: { x: carrier.x + (from.x - carrier.x) * 0.12, y: carrier.y + (from.y - carrier.y) * 0.12, s: s * 0.5, o: 0 }, ease: openEase },
  ];
  const refRest = { ...P.ref, s: 1 };
  return {
    ref: [
      { at: 0, pose: refRest },
      { at: H, pose: { ...carrier, s: refS }, ease: openEase },
      { at: VER0, pose: { ...carrier, s: refS } },
      // the hard reveal: the reference wipes away from the left, exposing Maya's registered version beneath
      { at: VER1, pose: { ...carrier, s: refS, ci: [0, 0, 0, 100] } },
      { at: THUMB1, pose: { ...thumb, s: thumbS, ci: [0, 0, 0, 0] }, ease: openEase },
      { at: END0 + 0.04, pose: { ...thumb, s: thumbS } },
      { at: END0 + 0.1, pose: { x: thumb.x + (carrier.x - thumb.x) * (1 - endS), y: thumb.y - rise + (carrier.y - thumb.y) * (1 - endS), s: thumbS }, ease: damped },
    ],
    work: [
      ...(biz ? [{ at: 0, pose: { ...P.work, s: 1, o: 1 } }, { at: H * 0.7, pose: { x: P.work.x + (carrier.x - P.work.x) * 0.55, y: P.work.y + (carrier.y - P.work.y) * 0.55, s: 0.72, o: 1 }, ease: openEase }, { at: H, pose: { ...carrier, s: 0.5, o: 0 } }] : [{ at: H, pose: { ...carrier, s: 1, o: 0 } }]),
      { at: VER0 - 0.001, pose: { ...carrier, s: 1, o: 0 } },
      { at: VER0, pose: { ...carrier, s: 1, o: 1 } },
      { at: APP0, pose: { ...carrier, s: 1, o: 1 } },
      { at: APP0 + 0.05, pose: { ...carrier, y: carrier.y + 24, s: 1 }, ease: openEase },
      { at: END0 + 0.04, pose: { ...carrier, y: carrier.y + 24, s: 1 } },
      { at: END0 + 0.1, pose: { ...carrier, y: carrier.y - rise, s: endS }, ease: damped },
    ],
    boundary: [{ at: VER0, pose: { x: carrier.x - W / 2, y: carrier.y, o: 1 } }, { at: VER1, pose: { x: carrier.x + W / 2, y: carrier.y, o: 1 } }, { at: VER1 + 0.01, pose: { x: carrier.x + W / 2, y: carrier.y, o: 0 } }],
    tagRef: [
      { at: 0, pose: { x: P.ref.x - P.refW / 2 + 8 + 40, y: P.ref.y + P.refH / 2 - 20, o: 1 } },
      { at: H, pose: { x: carrier.x - W / 2 + 48, y: carrier.y + Hc / 2 - 20, o: 1 }, ease: openEase },
      { at: VER0, pose: { x: carrier.x - W / 2 + 48, y: carrier.y + Hc / 2 - 20, o: 1 } },
      { at: VER0 + 0.02, pose: { x: carrier.x - W / 2 + 48, y: carrier.y + Hc / 2 - 20, o: 0 } },
      { at: THUMB1 - 0.01, pose: { x: thumb.x, y: thumb.y + thumbW * 1.25 / 2 + 12, o: 0 } },
      { at: THUMB1 + 0.02, pose: { x: thumb.x, y: thumb.y + thumbW * 1.25 / 2 + 12, o: 1 } },
      { at: END0 + 0.04, pose: { x: thumb.x, y: thumb.y + thumbW * 1.25 / 2 + 12, o: 1 } },
      { at: END0 + 0.1, pose: { x: thumb.x + (carrier.x - thumb.x) * (1 - endS), y: thumb.y + thumbW * 1.25 / 2 + 12 - rise + (carrier.y - thumb.y) * (1 - endS), o: 1 }, ease: damped },
    ],
    tagVer: [
      { at: VER1 - 0.02, pose: { x: carrier.x, y: carrier.y + Hc / 2 - 20, o: 0 } },
      { at: VER1 + 0.01, pose: { x: carrier.x, y: carrier.y + Hc / 2 - 20, o: 1 } },
      { at: APP0, pose: { x: carrier.x, y: carrier.y + Hc / 2 - 20, o: 1 } },
      { at: APP0 + 0.03, pose: { x: carrier.x, y: carrier.y + Hc / 2 - 20, o: 0 } },
    ],
    submission: [{ at: SUB0, pose: { ...sub, y: sub.y + 48, o: 0 } }, { at: SUB0 + 0.012, pose: { ...sub, y: sub.y + 36, o: 1 } }, { at: SUB0 + 0.06, pose: { ...sub, o: 1 }, ease: damped }, { at: SUB1, pose: { ...sub, o: 1 } }, { at: APP0, pose: { ...sub, y: sub.y + 24, o: 0 } }],
    rail: [{ at: APP0, pose: { x: carrier.x, y: railY, o: 0 } }, { at: APP0 + 0.03, pose: { x: carrier.x, y: railY, o: 1 } }, { at: END0 + 0.04, pose: { x: carrier.x, y: railY, o: 1 } }, { at: END0 + 0.1, pose: { x: carrier.x, y: railY - rise + (carrier.y - railY) * (1 - endS), o: 1, s: endS }, ease: damped }],
    railText: [{ at: APP0 + 0.03, pose: { x: carrier.x, y: railY, o: 0 } }, { at: APP0 + 0.07, pose: { x: carrier.x, y: railY, o: 1 } }, { at: END0 + 0.04, pose: { x: carrier.x, y: railY, o: 1 } }, { at: END0 + 0.1, pose: { x: carrier.x, y: railY - rise + (carrier.y - railY) * (1 - endS), o: 1, s: endS }, ease: damped }],
    end: [{ at: END0 + 0.04, pose: { ...end, y: end.y + 48, o: 0 } }, { at: END0 + 0.05, pose: { ...end, y: end.y + 46, o: 1 } }, { at: END0 + 0.12, pose: { ...end, o: 1 }, ease: damped }],
    endAmount: [{ at: END0 + 0.1, pose: { o: 0 } }, { at: END0 + 0.13, pose: { o: 1 } }],
    portrait: behind(P.portrait, 0.35),
    story: behind(P.story, 0.35),
    car: behind(P.car, 0.35),
    cartag: [{ at: 0, pose: { ...P.cartag, o: 1 } }, { at: H * 0.3, pose: { ...P.cartag, o: 0 } }],
    business: behind(P.business, 0.15),
    loyalty: behind(P.loyalty, 0.35),
    terms: [{ at: 0, pose: { ...P.terms, o: 1 } }, { at: H * 0.8, pose: { x: carrier.x, y: carrier.y + Hc / 2 - 100, o: 1 }, ease: openEase }, { at: H, pose: { x: carrier.x, y: carrier.y, o: 1 } }, { at: H + 0.001, pose: { x: carrier.x, y: carrier.y, o: 0 } }],
  };
}

/** The hard comparison boundary: a 1px line with a 44px target on the actual reveal edge; drag scrubs the timeline through the reveal. */
function Boundary({ film, initial }: { film: Film; initial: number }) {
  const { reduced } = useMotion();
  const [pct, setPct] = useState(initial);
  const dragging = useRef<{ x0: number; p0: number; w: number } | null>(null);
  const set = (n: number) => { const v = Math.max(0, Math.min(100, Math.round(n))); setPct(v); film.scrub(VER0 + (v / 100) * (VER1 - VER0)); };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); set(pct + 10); }
    if (e.key === "ArrowLeft") { e.preventDefault(); set(pct - 10); }
    if (e.key === "Home") { e.preventDefault(); set(0); } if (e.key === "End") { e.preventDefault(); set(100); }
  };
  return (
    <button type="button" className="x-obj x-earn-boundary" data-film="boundary" aria-label="Comparison boundary" role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${pct} percent creator version`} onKeyDown={onKey}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => { if (reduced) return; const w = (e.currentTarget.parentElement?.querySelector(".x-earn-work") as HTMLElement | null)?.offsetWidth ?? 326; dragging.current = { x0: e.clientX, p0: pct, w }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { const d = dragging.current; if (!d) return; set(d.p0 + ((e.clientX - d.x0) / d.w) * 100); }}
      onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; }}>
      <span className="x-earn-boundary-line" aria-hidden /><span className="x-earn-boundary-grip" aria-hidden />
    </button>
  );
}

function Stage({ aud, staticAt, choose }: { aud: Audience; staticAt: number | null; choose: (a: Audience) => void }) {
  // the reference is the only high priority image: the browser starts it before hydration
  preload(M.reference4x5(720), { as: "image", fetchPriority: "high", imageSrcSet: `${M.reference4x5(720)} 720w, ${M.reference4x5(1080)} 1080w`, imageSizes: "(min-width: 1024px) 416px, 326px" });
  const stage = useRef<HTMLDivElement>(null);
  const film = useFilm(EARN_BEATS, (vp) => build(vp, aud), stage, { staticAt, deps: [aud] });
  const beat = staticAt === null ? film.beat : EARN_BEATS.reduce((acc, b, i) => (staticAt >= b.at - 0.015 ? i : acc), 0);
  const business = aud === "business";
  const inHero = beat === 0;
  const preview = "/design-lab-v3/home?open=lab-recreate-loopday-pour";
  return (
    <div className={`x-scene-stage x-earn-stage${inHero ? " x-dark x-earn-hero" : ""}`} ref={stage} data-beat={beat} data-audience={aud} data-stage-tone={inHero ? "dark" : "inspection"}>
      <div className="x-field">
        {/* rear context: Loopday's own business photograph, then the program object, the vehicle example, the Story and the creator */}
        <span className="x-obj x-plane x-plane-flat x-earn-business" data-film="business"><img src={M.contentCounter()} alt="Loopday Coffee, the counter, delivered photograph" width={800} height={533} decoding="async" fetchPriority="low" /></span>
        <span className="x-obj x-earn-loyalty" data-film="loyalty">
          <span className="x-earn-loyalty-head"><span className="x-earn-loyalty-mark"><Logo design={liveProgram.card} size={16} /></span><span className="x-earn-loyalty-name">{liveProgram.card.businessName}</span></span>
          <span className="x-earn-loyalty-art"><Img src={M.reference4x5(720)} alt="" position="72% 50%" /></span>
          <span className="x-tag x-tag-ink x-earn-loyalty-tag">Loyalty</span>
        </span>
        <span className="x-obj x-plane x-earn-car" data-film="car"><img src={M.driveWagon(480)} srcSet={`${M.driveWagon(480)} 480w, ${M.driveWagon(640)} 640w, ${M.driveWagon(960)} 960w`} sizes="(min-width: 1024px) 440px, 240px" alt="Vehicle example: an oxblood estate wagon in a courtyard, illustrative photograph" width={960} height={640} decoding="async" fetchPriority="low" /></span>
        <span className="x-obj x-tag x-earn-cartag" data-film="cartag">Vehicle example</span>
        <span className="x-obj x-plane x-earn-story" data-film="story"><img src={M.story(480)} alt="Story creative, Loopday Coffee: Take a coffee break." width={480} height={853} decoding="async" fetchPriority="low" /></span>
        <span className="x-obj x-plane x-plane-r6 x-earn-portrait" data-film="portrait"><img src={M.portraitMaya(480)} alt={`${maya.name}, fictional creator`} width={480} height={600} decoding="async" fetchPriority="low" />{business && <span className="x-tag x-obj-tag">{maya.name}</span>}</span>
        {/* Maya's own Counter pour: beside her portrait in the business lens, the dominant work in Recreate, registered beneath the reference */}
        <span className="x-obj x-plane x-plane-r6 x-plane-fore x-earn-work" data-film="work"><img src={M.mayaPour(800)} alt="Creator version: Maya Chen, Counter pour still" width={800} height={1000} decoding="async" loading="lazy" /></span>
        {/* the reference: Loopday's reviewed 4:5 crop, the one object that travels into Recreate */}
        <Link href={preview} className="x-obj x-plane x-plane-r6 x-plane-fore x-earn-ref" data-film="ref" aria-label={`Open preview: ${recreate.title}, ${recreate.business}`}>
          <img src={M.reference4x5(720)} srcSet={`${M.reference4x5(720)} 720w, ${M.reference4x5(1080)} 1080w`} sizes="(min-width: 1024px) 416px, 326px" alt="" width={720} height={900} fetchPriority="high" decoding="async" />
        </Link>
        <span className="x-obj x-tag x-earn-tag" data-film="tagRef">{inHero && business ? "Campaign reference" : inHero ? "Recreate" : "Reference"}</span>
        <span className="x-obj x-tag x-earn-tag x-earn-tagver" data-film="tagVer">Creator version<span aria-hidden> · </span>Counter pour<span aria-hidden> · </span>{maya.name}</span>
        {staticAt === null && (beat === 1 || beat === 2) && <Boundary film={film} initial={beat === 2 ? 100 : 0} />}
        <div className="x-obj x-paper x-earn-terms" data-film="terms">
          {business ? (
            <><span className="t-object">{maya.name}</span><span className="x-earn-terms-actions"><Link href="/design-lab-v3/business?person=maya" className="link t-action">View person</Link><Link href="/design-lab-v3/business?person=maya&request=1" className="link t-action">Request</Link></span></>
          ) : (
            <><span className="t-fact">{recreate.business}</span><span className="x-earn-terms-money"><span className="x-money-hero">{money(recreate.netCents)}</span><span className="t-fact-ink">On approval</span></span></>
          )}
        </div>
        <div className="x-obj x-paper x-earn-sub" data-film="submission">
          <span className="t-fact">Submission preview</span>
          <span className="t-object">Counter pour</span>
          <span className="t-fact">{recreate.business}<span aria-hidden> · </span>Recreate</span>
          <ul className="x-rc-reqs t-fact-ink">{recreate.requirements.slice(0, 3).map((r) => <li key={r}>{r}</li>)}</ul>
          <span className="btn btn-primary x-rc-submit" aria-disabled="true">Submit</span>
          <span className="t-fact">Preview mode. Nothing is submitted.</span>
        </div>
        <div className="x-obj x-inspect x-earn-rail" data-film="rail" aria-hidden />
        <div className="x-obj x-earn-railtext" data-film="railText"><span className="x-inspect-text x-earn-railtext-in"><span className="x-earn-rail-l1"><span className="t-object">Approved</span><span className="t-fact-ink">{maya.project.approved}</span></span><span className="t-fact">Counter pour<span aria-hidden> · </span>{maya.name}<span aria-hidden> · </span>{recreate.business}<span aria-hidden> · </span>Recorded example</span></span></div>
        <div className="x-obj x-paper x-earn-end" data-film="end">
          <span className="t-fact">Reference<span aria-hidden> · </span>{recreate.business}</span>
          <span className="x-earn-end-money" data-film="endAmount" data-opacity-only><span className="x-money-end">{money(recreate.netCents)}</span><span className="t-fact-ink">On approval</span></span>
          <span className="x-earn-end-lines t-fact-ink"><span>Approval earns.</span><span>Ledger example unavailable.</span><span>Payout is separate.</span></span>
        </div>
      </div>
      <div className="x-stage-head">
        {inHero ? (
          <div className="x-earn-lines" role="tablist" aria-label="Audience">
            <button type="button" role="tab" aria-selected={!business} className="x-line x-line-1" onClick={() => choose("earn")}>Make money</button>
            <button type="button" role="tab" aria-selected={business} className="x-line x-line-2" onClick={() => choose("business")}>Grow your business</button>
          </div>
        ) : <h2 className="x-film-title x-reveal" id="recreate-h">Recreate</h2>}
      </div>
      <div className="x-stage-foot">
        {inHero && staticAt === null ? (
          <div className="x-hero-actions x-reveal" key="hero-actions">
            {business ? (
              <span className="x-hero-actions-r"><a href="#find-people" className="btn btn-primary">Explore business</a></span>
            ) : (
              <span className="x-hero-actions-r"><button type="button" className="btn btn-primary" onClick={() => film.go(1)}>Explore earning</button><Link href={preview} className="link t-action">Open preview</Link></span>
            )}
          </div>
        ) : staticAt === null ? (
          <><FilmControls film={film} beats={EARN_BEATS} playLabel="Play" /><div className="x-stage-actions"><Link href={preview} className="link t-action x-open-preview">Open preview</Link></div></>
        ) : <span className="x-frame-label">{beat + 1} of {EARN_BEATS.length}<span aria-hidden> · </span>{EARN_BEATS[beat].label}</span>}
      </div>
    </div>
  );
}

export function EarnFilm({ initial }: { initial: Audience }) {
  const [aud, setAud] = useState<Audience>(initial);
  useEffect(() => {
    const onPop = () => setAud(new URLSearchParams(location.search).get("audience") === "business" ? "business" : "earn");
    window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop);
  }, []);
  const choose = (a: Audience) => {
    if (a === aud) return;
    const u = new URL(location.href); if (a === "earn") u.searchParams.delete("audience"); else u.searchParams.set("audience", a);
    history.pushState(null, "", u); setAud(a);
  };
  return (
    <Scene id="top" label="TapMart" beats={EARN_BEATS} track={1.6} phoneHeight={940} className="x-earn" dark={false} anchors={[{ id: "recreate", at: REF0 }]} style={{ ["--extra" as string]: "240px" }} render={(staticAt) => <Stage aud={aud} staticAt={staticAt} choose={choose} />} />
  );
}
