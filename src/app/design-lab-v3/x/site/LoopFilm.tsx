"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Sheet } from "../../../design-lab-v2/Sheet";
import { AppleCard, GoogleCard, Logo, PlatformLabel, type CardData } from "../../wallet/Cards";
import { liveProgram } from "../../fixtures";
import { M } from "../media";
import { FilmControls, Scene, openEase, tl, useFilm, type Beat, type Tracks, type Viewport } from "../Film";

/**
 * The Business to Loyalty scene (RECOMPOSE_DIRECTION.md, loyalty): one
 * relationship across three depths. Jasmine's typographic source marker
 * stays outside every customer and Wallet object while the Loopday Story
 * becomes a trusted campaign link, Sara's recorded September 8 signup, a
 * distinct member card, the dated returns and the labelled September 17
 * example continuation. At the end the card yields the foreground and
 * the same marker advances onto the attribution datum, where the three
 * recorded aggregates (4 joined, 3 came back, 1 redeemed) open as ledges
 * from its underline. An independent replay: nothing here touches the
 * working Loyalty store, and the preview keeps its 10/6/1/2 baseline.
 */
export const LOOP_BEATS: Beat[] = [
  { key: "story", label: "Story", at: 0, dwell: 1000 },
  { key: "signup", label: "Signup", at: 0.16, dwell: 1100 },
  { key: "card", label: "Member card", at: 0.28, dwell: 700 },
  { key: "sep8", label: "September 8", at: 0.36, dwell: 800 },
  { key: "sep10", label: "September 10", at: 0.46, dwell: 550 },
  { key: "sep13", label: "September 13", at: 0.54, dwell: 550 },
  { key: "sep16", label: "September 16", at: 0.62, dwell: 550 },
  { key: "sep17", label: "Reward", at: 0.7, dwell: 1100 },
  { key: "attribution", label: "Attribution", at: 0.985, dwell: 2000 },
];
const ACT = (b: number) => (b === 0 ? "Attention" : b <= 2 ? "Customer" : b <= 7 ? "Return customer" : "Attribution");
const EVENT: Record<number, { iso: string; label: string; visits: number; ready: boolean } | undefined> = {
  2: { iso: "2026-09-08", label: "Joined", visits: 0, ready: false }, 3: { iso: "2026-09-08", label: "First visit", visits: 1, ready: false }, 4: { iso: "2026-09-10", label: "Came back", visits: 2, ready: false },
  5: { iso: "2026-09-13", label: "3 of 5", visits: 3, ready: false }, 6: { iso: "2026-09-16", label: "4 of 5", visits: 4, ready: false }, 7: { iso: "2026-09-17", label: "Example continuation", visits: 5, ready: true }, 8: { iso: "2026-09-17", label: "Example continuation", visits: 5, ready: true },
};
const fmt = (iso: string) => new Date(`${iso}T12:00:00-05:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/Chicago" });
function card(visits: number, ready: boolean): CardData {
  return { design: liveProgram.card, program: liveProgram, firstName: "Sara", memberId: "LD-001", code: "LMQ-7K2P-SARA", qr: "tapmart-demo-member:loopday:q7n4k9r2m6t8", progress: ready ? 5 : visits, ready: ready ? 1 : 0, state: ready ? "ready" : "collecting", publicSubset: true };
}

function build(vp: Viewport): Tracks {
  const cardW = vp.desktop ? 375 : vp.tablet ? 360 : 334;
  const cardH = Math.round(cardW * 1.6);
  const P = vp.desktop
    ? { source: tl(vp, 156, 220, 300, 72), sourceEnd: tl(vp, 352, 242, 300, 72), story: tl(vp, 580, 200, 214, 380), link: tl(vp, 600, 596, 176, 74), signup: tl(vp, 512, 184, 350, 380), card: tl(vp, 500, 200, cardW, cardH), event: tl(vp, 940, 220, 300, 96), ledges: tl(vp, 352, 356, 760, 220), cardEnd: { dx: 480, dy: 24, s: 1 } }
    : vp.tablet
      ? { source: tl(vp, 24, 140, 300, 72), sourceEnd: tl(vp, 24, 160, 300, 72), story: tl(vp, 277, 230, 214, 380), link: tl(vp, 296, 620, 176, 74), signup: tl(vp, 197, 220, 374, 380), card: tl(vp, 204, 230, cardW, cardH), event: tl(vp, 24, 224, 300, 96), ledges: tl(vp, 24, 300, 760, 220), cardEnd: { dx: 250, dy: 40, s: 0.6 } }
      : { source: tl(vp, 16, 184, 358, 52), sourceEnd: tl(vp, 16, 184, 358, 52), story: tl(vp, 88, 300, 214, 380), link: tl(vp, 107, 690, 176, 74), signup: tl(vp, 16, 290, 358, 380), card: tl(vp, 28, 356, cardW, cardH), event: tl(vp, 16, 246, 358, 96), ledges: tl(vp, 16, 296, 358, 220), cardEnd: { dx: 109, dy: 9, s: 0.42 } };
  // the name is set at its final size (40 phone, 48 desktop) and shown at 16px through a scale, so it stays crisp at the end
  const nameS = 16 / (vp.desktop ? 48 : 40);
  const nameGrow = (vp.desktop ? 52 : 44) + 12 - 24;
  return {
    // the source advances first while the reward ready card is still in place; the card then yields beside the ledges (whole on desktop, reduced on tablet and phone) so source and member stay visible together; the ledges open last
    source: [{ at: 0, pose: { ...P.source } }, { at: 0.86, pose: { ...P.source } }, { at: 0.905, pose: { ...P.sourceEnd }, ease: openEase }],
    name: [{ at: 0, pose: { s: nameS } }, { at: 0.86, pose: { s: nameS } }, { at: 0.905, pose: { s: 1 }, ease: openEase }],
    sub: [{ at: 0, pose: { y: 0 } }, { at: 0.86, pose: { y: 0 } }, { at: 0.905, pose: { y: nameGrow }, ease: openEase }],
    story: [{ at: 0, pose: { ...P.story, o: 1 } }, { at: 0.12, pose: { ...P.story, o: 1 } }, { at: 0.16, pose: { ...P.story, y: P.story.y - 24, s: 0.96, o: 0.6 }, ease: openEase }, { at: 0.24, pose: { ...P.story, y: P.story.y - 24, s: 0.96, o: 0.6 } }, { at: 0.28, pose: { ...P.story, y: P.story.y - 40, s: 0.92, o: 0 } }],
    link: [{ at: 0, pose: { ...P.link, o: 1 } }, { at: 0.12, pose: { ...P.link, o: 1 } }, { at: 0.15, pose: { ...P.link, y: P.link.y + 16, o: 0 } }],
    signup: [{ at: 0.12, pose: { ...P.signup, y: P.signup.y + 24, o: 0 } }, { at: 0.16, pose: { ...P.signup, o: 1 }, ease: openEase }, { at: 0.24, pose: { ...P.signup, o: 1 } }, { at: 0.27, pose: { ...P.signup, y: P.signup.y - 16, o: 0 } }],
    card: [{ at: 0.24, pose: { ...P.card, y: P.card.y + 16, o: 0 } }, { at: 0.28, pose: { ...P.card, o: 1 }, ease: openEase }, { at: 0.89, pose: { ...P.card, o: 1 } }, { at: 0.94, pose: { x: P.card.x + P.cardEnd.dx, y: P.card.y + P.cardEnd.dy, s: P.cardEnd.s, o: 1 }, ease: openEase }],
    event: [{ at: 0.24, pose: { ...P.event, o: 0 } }, { at: 0.28, pose: { ...P.event, o: 1 } }, { at: 0.86, pose: { ...P.event, o: 1 } }, { at: 0.9, pose: { ...P.event, o: 0 } }],
    ledges: [{ at: 0.93, pose: { ...P.ledges, o: 0 } }, { at: 0.94, pose: { ...P.ledges, o: 1 } }],
    ledgeA: [{ at: 0.94, pose: { ci: [0, 100, 0, 0] } }, { at: 0.97, pose: { ci: [0, 0, 0, 0] }, ease: openEase }],
    ledgeB: [{ at: 0.945, pose: { ci: [0, 100, 0, 0] } }, { at: 0.975, pose: { ci: [0, 0, 0, 0] }, ease: openEase }],
    ledgeC: [{ at: 0.95, pose: { ci: [0, 100, 0, 0] } }, { at: 0.98, pose: { ci: [0, 0, 0, 0] }, ease: openEase }],
    values: [{ at: 0.965, pose: { o: 0 } }, { at: 0.985, pose: { o: 1 } }],
  };
}

function Stage({ staticAt, platform, setPlatform }: { staticAt: number | null; platform: "apple" | "google"; setPlatform: (p: "apple" | "google") => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const film = useFilm(LOOP_BEATS, build, stage, { staticAt });
  const beat = staticAt === null ? film.beat : LOOP_BEATS.reduce((acc, b, i) => (staticAt >= b.at - 0.015 ? i : acc), 0);
  const ev = EVENT[beat] ?? EVENT[2]!;
  const c = card(ev.visits, ev.ready);
  const preview = "/design-lab-v3/business/loyalty";
  const WalletOptions = (
    <Sheet title="Wallet options" variant="menu" triggerClass="link link-plain t-action x-lp-wallet" trigger="Wallet options">
      <div className="tabs" role="tablist" aria-label="Platform" style={{ marginTop: 8 }}>
        <button type="button" role="tab" aria-selected={platform === "apple"} onClick={() => setPlatform("apple")}>Apple Wallet concept</button>
        <button type="button" role="tab" aria-selected={platform === "google"} onClick={() => setPlatform("google")}>Google Wallet concept</button>
      </div>
      <p className="t-fact" style={{ marginTop: 12 }}>No pass is issued. The source stays outside the pass.</p>
    </Sheet>
  );
  return (
    <div className="x-scene-stage x-loop-stage" ref={stage} data-beat={beat} data-act={ACT(beat)}>
      <div className="x-field">
        {/* the source marker: opaque typography on the stage, the same element from the first frame to the attribution datum */}
        <div className="x-obj x-lp2-source" data-film="source">
          <span className="t-fact">Joined from</span>
          <span className="x-lp2-name">
            <span className="x-lp2-name-scale" data-film="name" data-inplace>
            <Sheet title="Jasmine" variant="menu" triggerClass="link link-plain x-lp2-name-btn" trigger="Jasmine">
              <p className="t-body" style={{ marginTop: 8 }}>Morning loop · Story campaign.</p>
              <p className="t-fact" style={{ marginTop: 8 }}>Jasmine is a fictional source identity with no portrait. This replay keeps its own state and cannot change the business preview&rsquo;s counts.</p>
            </Sheet>
            </span>
          </span>
          <span className="t-fact x-lp2-sub" data-film="sub" data-inplace>Morning loop<span aria-hidden> · </span>Story campaign</span>
        </div>
        {/* the campaign: the existing Loopday Story and its trusted link */}
        <span className="x-obj x-plane x-lp2-story" data-film="story"><img src={M.story(480)} srcSet={`${M.story(480)} 480w, ${M.story(720)} 720w`} sizes="214px" alt="Loopday Story creative: Take a coffee break." width={480} height={853} decoding="async" loading="lazy" /></span>
        <span className="x-obj x-paper x-lp2-link" data-film="link"><span className="t-fact">Story</span><span className="t-action x-lp-join">Join Loopday</span><span className="t-fact">Trusted campaign link</span></span>
        {/* the customer: Sara's recorded signup replay, unchanged fields */}
        <div className="x-obj x-paper x-lp2-signup" data-film="signup">
          <span className="t-fact">Signup replay<span aria-hidden> · </span>{fmt("2026-09-08")}</span>
          <span className="x-lp-brand"><span className="loy-brand-mark" style={{ width: 28, height: 28, color: "var(--v3-ink)" }}><Logo design={liveProgram.card} size={20} /></span><span className="t-object">Loopday Coffee</span></span>
          <span className="t-title">Free coffee</span>
          <span className="t-fact-ink">5 visits</span>
          <span className="seq-field"><span className="t-fact">First name</span><span className="t-body">Sara</span></span>
          <span className="seq-field"><span className="t-fact">Contact</span><span className="t-body">••42</span></span>
          <span className="t-fact">Agreed to the demo program terms and privacy notice.</span>
          <span className="t-fact-ink x-lp-replayed">Card created<span aria-hidden> · </span>recorded {fmt("2026-09-08")}</span>
        </div>
        {/* the member card: opaque, its QR never beneath anything */}
        <div className="x-obj x-lp2-card" data-film="card">
          <PlatformLabel platform={platform} />
          {platform === "apple" ? <AppleCard d={c} width={375} className="wc-fit" /> : <GoogleCard d={c} width={375} className="wc-fit" />}
        </div>
        {/* the event band: member identity, the dated event and the reward state on their own lines, natural height */}
        <div className="x-obj x-lp2-event" data-film="event">
          <span className="t-fact-ink">Sara<span aria-hidden> · </span>member LD-001</span>
          <span className="x-lp2-date"><time dateTime={ev.iso} className="t-object">{fmt(ev.iso)}</time><span className="t-fact-ink">{ev.label}</span></span>
          {ev.ready && <span className="x-tag x-tag-create">Reward ready</span>}
        </div>
        {/* the opaque reading plane the card yields behind at attribution */}
        {/* attribution: the three recorded aggregates as ledges from the source's underline */}
        <div className="x-obj x-lp2-ledges" data-film="ledges">
          {([["ledgeA", 4, "Joined", 1], ["ledgeB", 3, "Came back", 0.75], ["ledgeC", 1, "Redeemed", 0.25]] as const).map(([id, n, label, k]) => (
            <span key={id} className="x-lp2-ledge">
              <span className="x-lp2-ledge-bar" data-film={id} data-inplace style={{ ["--k" as string]: k }} />
              <span className="x-lp2-ledge-value" data-film="values" data-opacity-only><span className="x-lp2-ledge-n">{n}</span><span className="x-lp2-ledge-l">{label}</span></span>
            </span>
          ))}
          <span className="t-fact">Recorded aggregates<span aria-hidden> · </span>Unique members</span>
        </div>
      </div>
      <div className="x-stage-head"><h2 className="x-film-title" id="loyalty-h">Loyalty</h2><span className="x-lp2-act"><span className="t-object">{ACT(beat)}</span><span className="t-note">Design Lab · Simulated sequence</span></span></div>
      <div className="x-stage-foot">
        {staticAt === null ? <FilmControls film={film} beats={LOOP_BEATS} playLabel="Play sequence">{WalletOptions}<Link href={preview} className="link t-action x-open-preview">Open loyalty preview</Link></FilmControls> : <span className="x-frame-label">{beat + 1} of {LOOP_BEATS.length}<span aria-hidden> · </span>{LOOP_BEATS[beat].label}</span>}
      </div>
    </div>
  );
}

export function LoopFilm() {
  const [platform, setPlatform] = useState<"apple" | "google">("apple");
  return <Scene id="loyalty" label="Loyalty" beats={LOOP_BEATS} track={2.4} phoneHeight={990} className="x-loop" render={(staticAt) => <Stage staticAt={staticAt} platform={platform} setPlatform={setPlatform} />} />;
}
