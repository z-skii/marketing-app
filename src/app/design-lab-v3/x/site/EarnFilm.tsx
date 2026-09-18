"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Img } from "../../../design-lab-v2/Img";
import { homeOpportunities, businessPeople, money } from "../../../design-lab-v2/fixtures";
import { liveProgram } from "../../fixtures";
import { Logo } from "../../wallet/Cards";
import { M } from "../media";
import { useMotion } from "../motion";
import { FilmControls, Scene, damped, openEase, tl, useFilm, type Beat, type Film, type Tracks, type Viewport } from "../Film";

/**
 * Scene one of the film (RECOMPOSE_DIRECTION.md, hero and recreate): the
 * hero composition on the dark substrate and the Recreate transformation
 * on one stage. At rest the Loopday reference is the foreground anchor of
 * a composition of real, unequal product objects: Maya's portrait, the
 * Story, the vehicle example, the earning terms, Loopday's own business
 * photograph and the program artwork fragment. The two audience lines are
 * the audience control (?audience=earn|business is native history). Over
 * the first 240px of desktop scroll the reference advances into Recreate
 * while the others recede behind it at different distances; on phone the
 * same handoff runs in the flow slot through the controls. Recreate then
 * transforms one carrier four times: reference, Maya's separate version
 * under a hard boundary (with the submission preview), the approval rail
 * passing over the work, and the opportunity terms opening from the lower
 * edge. Truth per MEDIA_MANIFEST.json: Counter pour has no ledger record,
 * so US$75 stays the reference opportunity's conditional term.
 */
export type Audience = "earn" | "business";
const recreate = homeOpportunities[0];
const maya = businessPeople[0];
const H = 0.14; // the handoff: the first 240px of a 1680px desktop travel
const seg = (a: number, b: number) => [H + a * (1 - H), H + b * (1 - H)] as const;
const [REF0] = seg(0, 0.18);
const [VER0, VER1] = seg(0.18, 0.37);
const [SUB0, SUB1] = seg(0.37, 0.52);
const [APP0, APP1] = seg(0.52, 0.76);
const [END0] = seg(0.76, 1);

export const EARN_BEATS: Beat[] = [
  { key: "hero", label: "TapMart", at: 0, dwell: 900 },
  { key: "reference", label: "Reference", at: REF0, dwell: 1200 },
  { key: "version", label: "Creator version", at: VER1, dwell: 1400 },
  { key: "approved", label: "Approved", at: APP0 + 0.1 * (1 - H), dwell: 1400 },
  { key: "earned", label: "Terms", at: END0 + 0.12 * (1 - H), dwell: 1800 },
];

/** The composition in Astra's top-left viewport coordinates, converted to stage offsets. */
function build(vp: Viewport, aud: Audience): Tracks {
  const biz = aud === "business";
  const P = vp.desktop
    ? { ref: tl(vp, 648, 174, 360, 450), portrait: tl(vp, biz ? 452 : 492, biz ? 330 : 320, 168, 210), work: tl(vp, 270, 360, 200, 250), story: tl(vp, 1000, 246, 190, 338), car: tl(vp, 330, 578, 480, 320), terms: tl(vp, 852, 674, 304, 110), business: tl(vp, 80, 430, 390, 260), loyalty: tl(vp, 1084, 558, 324, 184), refW: 360 }
    : vp.tablet
      ? { ref: tl(vp, 262, 250, 300, 375), portrait: tl(vp, biz ? 120 : 160, biz ? 280 : 300, 140, 175), work: tl(vp, 40, 330, 150, 188), story: tl(vp, 560, 236, 150, 267), car: tl(vp, 80, 620, 400, 267), terms: tl(vp, 440, 700, 290, 96), business: tl(vp, -20, 470, 330, 220), loyalty: tl(vp, 520, 560, 220, 125), refW: 300 }
      : { ref: tl(vp, 76, 282, 244, 305), portrait: tl(vp, biz ? 8 : 20, biz ? 250 : 302, biz ? 110 : 92, biz ? 138 : 115), work: tl(vp, 12, 396, 100, 125), story: tl(vp, 280, 272, 94, 167), car: tl(vp, -24, 540, 238, 159), terms: tl(vp, 84, 650, 290, 80), business: tl(vp, -32, 420, 216, 144), loyalty: tl(vp, 250, 548, 124, 96), refW: 244 };
  // Recreate carrier: 416x520 centered around x=480 of the 1280 stage on desktop; 326 wide centered on phone
  const W = vp.desktop ? 416 : vp.tablet ? 360 : 326;
  const workHeroS = (vp.desktop ? 200 : vp.tablet ? 150 : 100) / W;
  const carrier = vp.desktop ? { x: 80 + 480 - vp.w / 2, y: 0 } : vp.tablet ? { x: -100, y: -30 } : { x: 0, y: -84 };
  const refS = W / P.refW;
  const thumb = vp.desktop ? { x: carrier.x - W / 2 - 60, y: carrier.y - W * 1.25 / 2 + 50 } : vp.tablet ? { x: carrier.x - W / 2 - 50, y: carrier.y - 200 } : { x: carrier.x - W / 2 + 40, y: carrier.y - W * 1.25 / 2 + 48 };
  const thumbS = (vp.desktop ? 80 : 64) / P.refW;
  const railY = carrier.y - W * 1.25 / 2 + 28;
  const sub = vp.desktop ? { x: carrier.x + W / 2 + 190, y: carrier.y + 60 } : vp.tablet ? { x: carrier.x + W / 2 + 150, y: carrier.y + 40 } : { x: 0, y: carrier.y + W * 1.25 / 2 + 8 };
  const endH = vp.desktop ? 176 : 150;
  const end = { x: carrier.x, y: carrier.y + W * 1.25 / 2 - endH / 2 + 24 };
  // recede: foreground travels the whole distance, adjacent context 35%, the rear business photograph 15%
  const dx = carrier.x - P.ref.x; const dy = carrier.y - P.ref.y;
  const recede = (from: { x: number; y: number }, k: number, s = 1, o = 1) => [{ at: 0, pose: { ...from, s, o } }, { at: H, pose: { x: from.x + dx * k, y: from.y + dy * k, s: s * 0.96, o: 0 }, ease: openEase }];
  return {
    ref: [
      { at: 0, pose: { ...P.ref, s: 1 } },
      { at: H, pose: { ...carrier, s: refS }, ease: openEase },
      { at: VER1, pose: { ...carrier, s: refS } },
      { at: VER1 + 0.03, pose: { ...thumb, s: thumbS }, ease: openEase },
      { at: APP1, pose: { ...thumb, s: thumbS } },
    ],
    work: biz ? [{ at: 0, pose: { ...P.work, s: workHeroS, o: 1 } }, { at: H, pose: { x: P.work.x + dx * 0.35, y: P.work.y + dy * 0.35, s: workHeroS, o: 0 }, ease: openEase }, { at: VER0, pose: { ...carrier, o: 1, ci: [0, 100, 0, 0] } }, { at: VER1, pose: { ...carrier, o: 1 } }, { at: APP0, pose: { ...carrier } }, { at: APP0 + 0.05, pose: { ...carrier, y: carrier.y + 24 }, ease: openEase }]
      : [{ at: VER0, pose: { ...carrier, o: 1, ci: [0, 100, 0, 0] } }, { at: VER1, pose: { ...carrier, o: 1 } }, { at: APP0, pose: { ...carrier } }, { at: APP0 + 0.05, pose: { ...carrier, y: carrier.y + 24 }, ease: openEase }],
    boundary: [{ at: VER0, pose: { x: carrier.x - W / 2, y: carrier.y, o: 1 } }, { at: VER1, pose: { x: carrier.x + W / 2, y: carrier.y, o: 1 } }, { at: VER1 + 0.02, pose: { x: carrier.x + W / 2, y: carrier.y, o: 0 } }],
    tagRef: [{ at: 0, pose: { ...P.ref, x: P.ref.x - P.refW / 2 + 8 + 40, y: P.ref.y + P.ref.y * 0 + (vp.desktop ? 450 : vp.tablet ? 375 : 305) / 2 - 8 - 12, o: 1 } }, { at: H, pose: { x: carrier.x - W / 2 + 8 + 40, y: carrier.y + W * 1.25 / 2 - 20, o: 1 }, ease: openEase }, { at: VER0, pose: { x: carrier.x - W / 2 + 48, y: carrier.y + W * 1.25 / 2 - 20, o: 1 } }, { at: VER0 + 0.02, pose: { x: carrier.x - W / 2 + 48, y: carrier.y + W * 1.25 / 2 - 20, o: 0 } }],
    tagVer: [{ at: VER1 - 0.04, pose: { x: carrier.x + W / 2 - 60, y: carrier.y + W * 1.25 / 2 - 20, o: 0 } }, { at: VER1, pose: { x: carrier.x + W / 2 - 60, y: carrier.y + W * 1.25 / 2 - 20, o: 1 } }, { at: APP0, pose: { x: carrier.x + W / 2 - 60, y: carrier.y + W * 1.25 / 2 - 20, o: 1 } }, { at: APP0 + 0.03, pose: { x: carrier.x + W / 2 - 60, y: carrier.y + W * 1.25 / 2 - 20, o: 0 } }],
    submission: [{ at: SUB0, pose: { ...sub, y: sub.y + 48, o: 0 } }, { at: SUB0 + 0.06, pose: { ...sub, o: 1 }, ease: damped }, { at: SUB1, pose: { ...sub, o: 1 } }, { at: APP0, pose: { ...sub, y: sub.y + 24, o: 0 } }],
    rail: [{ at: APP0, pose: { x: carrier.x, y: railY, o: 0 } }, { at: APP0 + 0.05, pose: { x: carrier.x, y: railY, o: 1 } }, { at: END0, pose: { x: carrier.x, y: railY, o: 1 } }, { at: END0 + 0.06, pose: { x: carrier.x, y: railY - 16, o: 0 } }],
    railText: [{ at: APP0 + 0.05, pose: { x: carrier.x, y: railY, o: 0 } }, { at: APP0 + 0.09, pose: { x: carrier.x, y: railY, o: 1 } }, { at: END0, pose: { x: carrier.x, y: railY, o: 1 } }, { at: END0 + 0.06, pose: { x: carrier.x, y: railY - 16, o: 0 } }],
    end: [{ at: END0, pose: { ...end, y: end.y + 48, o: 0 } }, { at: END0 + 0.08, pose: { ...end, o: 1 }, ease: damped }],
    endAmount: [{ at: END0 + 0.06, pose: { ...end, o: 0 } }, { at: END0 + 0.1, pose: { ...end, o: 1 } }],
    portrait: recede(P.portrait, 0.35, biz ? 1.08 : 1),
    story: recede(P.story, 0.35),
    car: recede(P.car, 0.35),
    business: recede(P.business, 0.15),
    loyalty: recede(P.loyalty, 0.35),
    terms: [{ at: 0, pose: { ...P.terms, o: 1 } }, { at: H, pose: { x: P.ref.x + dx * 0.9, y: P.ref.y + dy + W * 1.25 / 2 - 20, s: 0.9, o: 0 }, ease: openEase }],
  };
}

/** The hard comparison boundary: a 1px line with a 44px target; drag scrubs the timeline through the creator version movement. */
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
  const stage = useRef<HTMLDivElement>(null);
  const film = useFilm(EARN_BEATS, (vp) => build(vp, aud), stage, { staticAt, deps: [aud] });
  const beat = staticAt === null ? film.beat : EARN_BEATS.reduce((acc, b, i) => (staticAt >= b.at - 0.015 ? i : acc), 0);
  const business = aud === "business";
  const inHero = beat === 0;
  const preview = "/design-lab-v3/home?open=lab-recreate-loopday-pour";
  return (
    <div className={`x-scene-stage x-earn-stage${inHero ? " x-dark x-earn-hero" : ""}`} ref={stage} data-beat={beat} data-audience={aud}>
      <div className="x-field">
        {/* rear context: Loopday's own business photograph, then the program artwork fragment, the vehicle example, the Story and the creator */}
        <span className="x-obj x-plane x-plane-flat x-earn-business" data-film="business"><img src={M.contentCounter()} alt="Loopday Coffee, the counter, delivered photograph" width={800} height={533} decoding="async" /></span>
        <span className="x-obj x-earn-loyalty" data-film="loyalty">
          <span className="x-earn-loyalty-art"><Img src={M.reference4x5(720)} alt="" position="72% 50%" /></span>
          <span className="x-earn-loyalty-id"><span className="loy-brand-mark"><Logo design={liveProgram.card} size={16} /></span><span className="x-tag x-tag-ink">Loyalty</span></span>
        </span>
        <span className="x-obj x-plane x-earn-car" data-film="car"><img src={M.driveWagon(480)} srcSet={`${M.driveWagon(480)} 480w, ${M.driveWagon(960)} 960w`} sizes="(min-width: 1024px) 480px, 240px" alt="Vehicle example: an oxblood estate wagon in a courtyard, illustrative photograph" width={960} height={640} decoding="async" /><span className="x-tag x-obj-tag">Vehicle example</span></span>
        <span className="x-obj x-plane x-earn-story" data-film="story"><img src={M.story(480)} alt="Story creative, Loopday Coffee: Take a coffee break." width={480} height={853} decoding="async" /></span>
        <span className="x-obj x-plane x-plane-r6 x-earn-portrait" data-film="portrait"><img src={M.portraitMaya(480)} alt={`${maya.name}, fictional creator`} width={480} height={600} decoding="async" />{business && <span className="x-tag x-obj-tag">{maya.name}</span>}</span>
        {/* the creator version: Maya's own Counter pour, beside her portrait in the business lens, the dominant work in Recreate */}
        <span className="x-obj x-plane x-plane-r6 x-plane-fore x-earn-work" data-film="work"><img src={M.mayaPour(800)} alt="Creator version: Maya Chen, Counter pour still" width={800} height={1000} decoding="async" /></span>
        {/* the reference: Loopday's reviewed 4:5 crop, the one object that travels into Recreate */}
        <Link href={preview} className="x-obj x-plane x-plane-r6 x-plane-fore x-earn-ref" data-film="ref" aria-label={`Open preview: ${recreate.title}, ${recreate.business}`}>
          <img src={M.reference4x5(720)} srcSet={`${M.reference4x5(720)} 720w, ${M.reference4x5(1080)} 1080w`} sizes="(min-width: 1024px) 416px, 326px" alt="" width={720} height={900} fetchPriority="high" decoding="async" />
        </Link>
        <span className="x-obj x-tag x-earn-tag" data-film="tagRef">{inHero && business ? "Campaign reference" : inHero ? "Recreate" : "Reference"}</span>
        <span className="x-obj x-tag x-tag-create x-earn-tag" data-film="tagVer">Creator version</span>
        {staticAt === null && beat === 2 && <Boundary film={film} initial={100} />}
        <div className="x-obj x-paper x-earn-terms" data-film="terms">
          {business ? (
            <><span className="t-fact">Find people</span><span className="t-object">{maya.name}</span><span className="x-earn-terms-actions"><Link href="/design-lab-v3/business?person=maya" className="link t-action">View person</Link><Link href="/design-lab-v3/business?person=maya&request=1" className="link t-action">Request</Link></span></>
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
        <div className="x-obj x-inspect x-earn-rail" data-film="rail" aria-hidden><span className="x-rim x-rim-film"><img src={M.mayaPour(480)} alt="" /></span></div>
        <div className="x-obj x-earn-railtext" data-film="railText"><span className="x-inspect-text"><span className="t-object">Approved</span><span className="t-fact-ink">{maya.project.approved}<span aria-hidden> · </span>Counter pour<span aria-hidden> · </span>{recreate.business}<span aria-hidden> · </span>Recorded example</span></span></div>
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
              <span className="x-hero-actions-r"><a href="#find-people" className="btn btn-primary">Explore business</a><Link href="/design-lab-v3/business?person=maya" className="link t-action">View person</Link></span>
            ) : (
              <span className="x-hero-actions-r"><button type="button" className="btn btn-primary" onClick={() => film.go(1)}>Explore earning</button><Link href={preview} className="link t-action">Open preview</Link></span>
            )}
          </div>
        ) : staticAt === null ? (
          <FilmControls film={film} beats={EARN_BEATS} playLabel="Play"><Link href={preview} className="link t-action x-open-preview">Open preview</Link></FilmControls>
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
    <Scene id="top" label="TapMart" beats={EARN_BEATS} track={1.6} phoneHeight={724} className="x-earn" dark={false} anchors={[{ id: "recreate", at: REF0 }]} style={{ ["--extra" as string]: "240px" }} render={(staticAt) => <Stage aud={aud} staticAt={staticAt} choose={choose} />} />
  );
}
