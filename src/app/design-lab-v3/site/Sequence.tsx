"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "@phosphor-icons/react";
import { Img } from "../../design-lab-v2/Img";
import { ASSET } from "../../design-lab-v2/fixtures";
import { Sheet } from "../../design-lab-v2/Sheet";
import { AppleCard, Logo, PlatformLabel, type CardData } from "../wallet/Cards";
import { Marks } from "../Progress";
import { liveProgram, type Member } from "../fixtures";
import { Entry } from "../../design-lab-v2/site/Site";

/**
 * The public Loyalty sequence: eight frames on one coded stage inside the
 * ink business chapter, with a stationary From Jasmine control and the
 * fictional replay label. Get attention (a matched Story), turn them into
 * customers (a deliberate tap, a read only signup excerpt, the card), bring
 * them back (dated visits, the fifth visit, then the business side receipt).
 * Film style controls sit below the object with an eight segment scrubber.
 * The sequence uses its own replay state and cannot change the business's
 * counts. Desktop maps a bounded native scroll to the storyboard; phone
 * plays on a tap; reduced motion shows the frames as labelled sections.
 */
const FRAMES = [
  { key: "source", act: "Get attention.", dur: 1400 },
  { key: "tap", act: "Turn them into customers.", dur: 600 },
  { key: "join", act: "Turn them into customers.", dur: 1600 },
  { key: "card", act: "Turn them into customers.", dur: 1200 },
  { key: "first", act: "Bring them back.", dur: 1100 },
  { key: "days", act: "Bring them back.", dur: 2400 },
  { key: "fifth", act: "Bring them back.", dur: 1100 },
  { key: "receipt", act: "Bring them back.", dur: 1800 },
] as const;
const TOTAL = FRAMES.reduce((a, f) => a + f.dur, 0);
const DAYS: { iso: string; n: number; label: string }[] = [{ iso: "2026-09-08", n: 1, label: "First visit" }, { iso: "2026-09-10", n: 2, label: "Came back" }, { iso: "2026-09-13", n: 3, label: "Visit counted" }, { iso: "2026-09-16", n: 4, label: "Visit counted" }];
const SARA_RECEIPT: Member = { id: "replay", memberId: "LD-001", firstName: "Sara", contactKind: "phone", contactNorm: "+12025550142", contactMasked: "••42", code: "LMQ-7K2P-SARA", joinedAt: "2026-09-08T08:50:00-05:00", agreedAt: "2026-09-08T08:50:00-05:00", source: { type: "STORY", creatorId: "jasmine", campaign: "Morning loop", label: "Jasmine", sub: "Morning loop · Story campaign", linkCode: "link-jasmine-story", confidence: "link" }, progress: 0, ready: 1, redeemed: 0, lifetime: 5, visitDays: ["2026-09-08", "2026-09-10", "2026-09-13", "2026-09-16", "2026-09-17"], lastCountedAt: "2026-09-17T10:00:00-05:00", lastAttemptAt: null, wallet: "apple", walletAt: null };

function frameAt(t: number): number { let acc = 0; for (let i = 0; i < FRAMES.length; i++) { acc += FRAMES[i].dur; if (t < acc) return i; } return FRAMES.length - 1; }

export function Sequence() {
  const [frame, setFrame] = useState(0);
  const [dayIx, setDayIx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)"); const dq = window.matchMedia("(min-width: 1024px)");
    const apply = () => { setReduced(mq.matches); setDesktop(dq.matches); };
    const id = setTimeout(apply, 0);
    mq.addEventListener("change", apply); dq.addEventListener("change", apply);
    return () => { clearTimeout(id); mq.removeEventListener("change", apply); dq.removeEventListener("change", apply); };
  }, []);

  useEffect(() => {
    if (!desktop || reduced) return;
    const el = wrap.current; if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect(); const top = 88;
      const travel = el.offsetHeight - window.innerHeight; if (travel <= 0) return;
      const k = Math.min(1, Math.max(0, (top - r.top) / travel));
      if (k <= 0 || k >= 1) return;
      setPlaying(false); setStarted(true);
      const t = k * (TOTAL - 1); const f = frameAt(t); setFrame(f);
      if (f === 5) { const local = t - FRAMES.slice(0, 5).reduce((a, x) => a + x.dur, 0); setDayIx(Math.min(3, 1 + Math.floor((local / FRAMES[5].dur) * 3))); } else setDayIx(f >= 6 ? 3 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [desktop, reduced]);

  useEffect(() => {
    if (!playing) { if (timer.current) window.clearTimeout(timer.current); return; }
    const step = (f: number, d: number) => {
      setFrame(f); setDayIx(f === 5 ? d : f >= 6 ? 3 : 0);
      if (f === 5 && d < 3) { timer.current = window.setTimeout(() => step(5, d + 1), FRAMES[5].dur / 3); return; }
      if (f >= FRAMES.length - 1) { setPlaying(false); return; }
      timer.current = window.setTimeout(() => step(f + 1, f + 1 === 5 ? 1 : 0), FRAMES[f].dur);
    };
    const startFrame = frame >= FRAMES.length - 1 ? 0 : frame;
    timer.current = window.setTimeout(() => step(startFrame, startFrame === 5 ? Math.max(1, dayIx) : 0), 0);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const go = (f: number) => { setPlaying(false); setStarted(true); const n = Math.max(0, Math.min(FRAMES.length - 1, f)); setFrame(n); setDayIx(n === 5 ? 1 : n >= 6 ? 3 : 0); };
  const f = FRAMES[frame];
  const visits = frame <= 3 ? 0 : frame === 4 ? 1 : frame === 5 ? DAYS[dayIx]?.n ?? 2 : 5;
  const card: CardData = { design: liveProgram.card, program: liveProgram, firstName: "Sara", memberId: "LD-001", code: "LMQ-7K2P-SARA", qr: "tapmart-demo-member:loopday:q7n4k9r2m6t8", progress: frame >= 6 ? 5 : visits, ready: frame >= 6 ? 1 : 0, state: frame >= 6 ? "ready" : "collecting", publicSubset: true };
  const date = frame === 4 ? "2026-09-08" : frame === 5 ? DAYS[dayIx].iso : frame >= 6 ? "2026-09-17" : null;
  const bandLabel = frame === 4 ? "First visit" : frame === 5 ? DAYS[dayIx].label : frame === 6 ? "Visit counted" : null;

  const Context = (
    <div className="seq-context">
      <Sheet title="From Jasmine" variant="menu" triggerClass="link link-plain t-fact-ink seq-from" trigger="From Jasmine">
        <p className="t-body" style={{ marginTop: 8 }}>Morning loop · Story campaign.</p>
        <p className="t-fact" style={{ marginTop: 8 }}>Jasmine is a fictional source identity. The Loopday Story is a matched fixture creative. This replay keeps its own state and cannot change the business preview’s counts.</p>
      </Sheet>
      <span className="t-note">Design Lab · Fictional replay</span>
    </div>
  );

  const Source = (tapped: boolean) => (
    <div className="seq-source">
      <span className="media seq-story"><Img src={ASSET("story-loopday-01")} alt="Loopday Story creative, fixture media" fallback="Media unavailable" /></span>
      <span className="seq-source-band"><span className="t-object">Jasmine</span><span className="t-fact">Morning loop · Story campaign</span><span className={`seq-join-link t-action${tapped ? " is-tapped" : ""}`}>Join Loopday{tapped && <span className="seq-tap" aria-hidden />}</span></span>
    </div>
  );
  const Excerpt = (
    <div className="seq-signup fade-in">
      <span className="seq-signup-brand"><span className="loy-brand-mark" style={{ width: 28, height: 28, color: "var(--v2-ink)" }}><Logo design={liveProgram.card} size={20} /></span><span className="t-object">Loopday Coffee</span></span>
      <span className="t-title">Free coffee</span>
      <span className="t-fact-ink">5 visits</span>
      <span className="t-fact">One counted visit per day.</span>
      <span className="seq-field"><span className="t-fact">First name</span><span className="t-body">Sara</span></span>
      <span className="seq-field"><span className="t-fact">Phone</span><span className="t-body">+12025550142</span></span>
      <span className="btn btn-primary seq-btn" aria-hidden>Create my card</span>
    </div>
  );
  const Pass = (c: CardData, iso: string | null, band: string | null, arrive: boolean) => (
    <div className="seq-card">
      {iso && <span className="seq-date t-fact-ink"><time dateTime={iso}>{iso}</time>{band && <span aria-hidden> · </span>}{band}</span>}
      <div className="wc-wrap">
        <PlatformLabel platform="apple" />
        <div className={arrive ? "seq-card-arrive" : undefined}><AppleCard d={c} width={375} className="wc-fit" /></div>
        <PlatformLabel platform="apple" above={false} />
      </div>
    </div>
  );
  const Receipt = (
    <div className="seq-receipt">
      <span className="t-name">Sara</span>
      <Marks m={SARA_RECEIPT} p={liveProgram} size="l" />
      <span className="seq-receipt-visits">5 of 5 visits</span>
      <span className="seq-receipt-ready">Reward ready</span>
      <span className="seq-receipt-reward">Free coffee</span>
      <span className="t-fact">Wallet update · simulated</span>
      <div className="seq-receipt-actions"><Link href="/design-lab-v3/business/loyalty" className="btn btn-primary">Open loyalty preview</Link><Entry label="Get started" className="link t-action" business /></div>
    </div>
  );

  if (reduced) {
    const stills: { i: number; node: React.ReactNode }[] = [
      { i: 0, node: Source(false) }, { i: 2, node: Excerpt }, { i: 3, node: Pass({ ...card, progress: 0, ready: 0, state: "collecting" }, null, null, false) },
      { i: 5, node: Pass({ ...card, progress: 4, ready: 0, state: "collecting" }, "2026-09-16", "Sep 8 first visit · Sep 10 came back · Sep 13 · Sep 16", false) },
      { i: 7, node: Receipt },
    ];
    return (
      <div className="seq seq-reduced">
        {Context}
        {stills.map(({ i, node }) => <section key={FRAMES[i].key} className="seq-section" id={`seq-${FRAMES[i].key}`}><span className="t-verb">{FRAMES[i].act}</span>{node}</section>)}
      </div>
    );
  }

  const Stage = (
    <div className={`seq-stage seq-frame-${f.key}`} data-frame={frame} aria-live="polite">
      <div className="seq-left">{Context}{(frame <= 3 || frame === 7) && <span className="seq-act t-verb">{f.act}</span>}{frame >= 4 && frame <= 6 && <span className="seq-act t-verb seq-act-quiet">{f.act}</span>}</div>
      <div className="seq-object">
        {frame <= 1 && Source(frame === 1)}
        {frame === 2 && Excerpt}
        {frame >= 3 && frame <= 6 && Pass(card, date, bandLabel, frame === 3)}
        {frame === 7 && Receipt}
      </div>
      <div className="seq-controls">
        <button type="button" className="icon-btn" aria-label="Previous" onClick={() => go(frame - 1)} disabled={frame === 0}><SkipBack size={18} /></button>
        <button type="button" className="link t-action seq-play" aria-label={playing ? "Pause" : !started ? "Play sequence" : frame >= FRAMES.length - 1 ? "Replay sequence" : "Play"} onClick={() => { setStarted(true); setPlaying((v) => !v); }}>{playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}{!started && <span>Play sequence</span>}</button>
        <button type="button" className="icon-btn" aria-label="Next" onClick={() => go(frame + 1)} disabled={frame === FRAMES.length - 1}><SkipForward size={18} /></button>
        <span className="seq-scrub" role="tablist" aria-label="Frames">{FRAMES.map((x, i) => <button key={x.key} type="button" role="tab" aria-selected={i === frame} aria-label={`Frame ${i + 1}`} onClick={() => go(i)} />)}</span>
      </div>
    </div>
  );

  if (desktop) return <div className="seq seq-desktop" ref={wrap}><div className="seq-sticky">{Stage}</div></div>;
  return <div className="seq seq-phone">{Stage}</div>;
}
