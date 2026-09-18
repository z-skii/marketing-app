"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { ArrowCounterClockwise, CaretDown, Pause, Play, SkipBack, SkipForward } from "@phosphor-icons/react";
import { Sheet } from "../../design-lab-v2/Sheet";
import { useMotion } from "./motion";

/**
 * The film engine for the recomposed public homepage (docs/design-lab-v3/
 * recompose/RECOMPOSE_DIRECTION.md, scroll model). One stage coordinate
 * system per scene; every object is a persistent element whose pose
 * (translate, scale, rotate, opacity, clip) is keyed on a 0 to 1 timeline
 * and written straight to the element: compositor work only, one write per
 * animation frame. Three modes:
 *   scroll  desktop and tablet: the stage is pinned beneath the navigation
 *           stack and native scrolling drives the timeline (no wheel
 *           interception, no snapping, no automatic scrolling except Play).
 *   steps   phone: no pinning. The composition sits in ordinary flow and
 *           Previous, Next, Steps, Replay and Play move the timeline with a
 *           timed tween; Pause motion freezes it in place.
 *   static  reduced motion: each beat rendered as a stationary composition.
 * Playback never submits, approves, redeems or advances the working clock:
 * it changes presentation state only.
 */
/** x, y offsets (px), s scale, r rotation (deg), o opacity, ci clip inset (%), d depth (unused by apply), b blur (px, depth of field for far planes). */
export type Pose = { x?: number; y?: number; s?: number; r?: number; o?: number; ci?: [number, number, number, number]; d?: number; b?: number };
export type Key = { at: number; pose: Pose; ease?: Ease };
export type Track = Key[];
export type Tracks = Record<string, Track>;
export type Ease = (t: number) => number;
export type Beat = { key: string; label: string; at: number; dwell?: number };
export type Viewport = { w: number; h: number; phone: boolean; tablet: boolean; desktop: boolean; stageH: number };
export type Mode = "scroll" | "steps" | "static";

export const STAGE_TOP = 120;
export const easeOut: Ease = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const linear: Ease = (t) => t;
/** The open easing as a function: cubic-bezier(0.16, 1, 0.3, 1), sampled. */
export const openEase: Ease = (t) => 1 - Math.pow(1 - t, 3.4);
/** Critically damped sheet: no overshoot, settles by the end of the segment. */
export const damped: Ease = (t) => 1 - (1 + 6 * t) * Math.exp(-6 * t);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const DEF: Required<Pose> = { x: 0, y: 0, s: 1, r: 0, o: 1, ci: [0, 0, 0, 0], d: 0, b: 0 };
const full = (p: Pose): Required<Pose> => ({ ...DEF, ...p, ci: p.ci ?? DEF.ci });
const mix = (a: Required<Pose>, b: Required<Pose>, t: number): Required<Pose> => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), s: lerp(a.s, b.s, t), r: lerp(a.r, b.r, t), o: lerp(a.o, b.o, t), d: lerp(a.d, b.d, t), b: lerp(a.b, b.b, t), ci: [0, 1, 2, 3].map((i) => lerp(a.ci[i], b.ci[i], t)) as [number, number, number, number] });

/** The pose of a track at progress p: holds before the first key and after the last; eases each segment. */
export function poseAt(track: Track, p: number): Required<Pose> {
  if (!track.length) return { ...DEF };
  if (p <= track[0].at) return full(track[0].pose);
  for (let i = 1; i < track.length; i++) {
    const k = track[i];
    if (p <= k.at) { const a = track[i - 1]; const span = k.at - a.at || 1; const t = (k.ease ?? easeInOut)(clamp((p - a.at) / span, 0, 1)); return mix(full(a.pose), full(k.pose), t); }
  }
  return full(track[track.length - 1].pose);
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function apply(el: HTMLElement | SVGElement, p: Required<Pose>) {
  if (el.dataset.opacityOnly !== undefined) { el.style.opacity = String(r2(p.o)); el.style.visibility = p.o <= 0.001 ? "hidden" : ""; return; }
  // a travelling object: x and y are fractions of its own CSS travel (--x0 to --x1, --y0 to --y1), never a transform
  if (el.dataset.travel !== undefined) { el.style.setProperty("--fx", String(r2(p.x))); el.style.setProperty("--fy", String(r2(p.y))); el.style.opacity = String(r2(p.o)); el.style.visibility = p.o <= 0.001 ? "hidden" : ""; return; }
  // an in place object keeps its own CSS position and takes only the offset; a stage object is centered on its pose
  el.style.transform = el.dataset.inplace !== undefined ? `translate3d(${r2(p.x)}px, ${r2(p.y)}px, 0) rotate(${r2(p.r)}deg) scale(${r2(p.s)})` : `translate3d(calc(-50% + ${r2(p.x)}px), calc(-50% + ${r2(p.y)}px), 0) rotate(${r2(p.r)}deg) scale(${r2(p.s)})`;
  el.style.opacity = String(r2(p.o));
  const c = p.ci; el.style.clipPath = c[0] || c[1] || c[2] || c[3] ? `inset(${r2(c[0])}% ${r2(c[1])}% ${r2(c[2])}% ${r2(c[3])}%)` : "";
  el.style.visibility = p.o <= 0.001 ? "hidden" : "";
  el.style.pointerEvents = p.o <= 0.001 ? "none" : "";
  el.style.filter = p.b > 0.05 ? `blur(${r2(p.b)}px)` : "";
}

/** The stage: beneath the 120px navigation stack; pinned on desktop at most 796px tall; the phone composition slot is the rest of the first viewport. */
export function viewport(): Viewport {
  const w = window.innerWidth; const h = window.innerHeight; const phone = w < 768;
  return { w, h, phone, tablet: w >= 768 && w < 1024, desktop: w >= 1024, stageH: phone ? Math.max(560, h - STAGE_TOP) : Math.min(796, h - STAGE_TOP) };
}
export function modeFor(vp: Viewport, reduced: boolean): Mode { return reduced ? "static" : vp.phone ? "steps" : "scroll"; }
/** Astra's top-left viewport coordinates (navigation stack included) to a centered stage offset. */
export function tl(vp: Viewport, x: number, y: number, w: number, h: number): { x: number; y: number } { return { x: x + w / 2 - vp.w / 2, y: y - STAGE_TOP + h / 2 - vp.stageH / 2 }; }

export type Film = {
  beat: number; atEnd: boolean; started: boolean; playing: boolean; mode: Mode;
  go: (i: number) => void; next: () => void; prev: () => void; play: () => void; stop: () => void; replay: () => void;
  retrack: () => void; scrub: (p: number) => void;
};

/**
 * @param stageRef   the caller's ref to the stage element; objects inside it register with data-film="id"
 * @param o.staticAt when set, the stage is not pinned: poses are applied once at this progress (reduced motion)
 * @param o.deps     values whose change rebuilds the tracks with a settled blend from the current poses
 */
export function useFilm(beats: readonly Beat[], build: (vp: Viewport) => Tracks, stageRef: RefObject<HTMLDivElement | null>, o: { staticAt?: number | null; deps?: unknown[] } = {}): Film {
  const { paused, reduced } = useMotion();
  // the timeline lives in refs written from effects, frames and handlers; every value is replaced whole, never mutated in place
  const els = useRef(new Map<string, HTMLElement | SVGElement>());
  const tracks = useRef<Tracks>({});
  const buildRef = useRef(build);
  const beatsRef = useRef(beats);
  const prog = useRef(0);
  const blend = useRef<{ from: Record<string, Required<Pose>>; t0: number } | null>(null);
  const tween = useRef<{ from: number; to: number; t0: number; ms: number; then?: () => void } | null>(null);
  const raf = useRef(0);
  const modeRef = useRef<Mode>("steps");
  const beatRef = useRef(0);
  const playingRef = useRef(false);
  const dwell = useRef(0);
  const frozen = useRef<{ tw: { from: number; to: number; t0: number; ms: number; then?: () => void } | null } | null>(null);
  const [mode, setMode] = useState<Mode>("steps");
  const [beat, setBeat] = useState(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const staticAt = o.staticAt ?? null;
  const depsKey = JSON.stringify(o.deps ?? []);
  useLayoutEffect(() => { buildRef.current = build; beatsRef.current = beats; });

  const paint = useCallback(() => {
    const st = stageRef.current; if (!st) return;
    const p = prog.current;
    const bl = blend.current; let k = 1;
    if (bl) { k = clamp((performance.now() - bl.t0) / 480, 0, 1); if (k >= 1) blend.current = null; }
    const ks = openEase(k);
    for (const [id, el] of els.current) {
      const tr = tracks.current[id]; if (!tr) continue;
      let pose = poseAt(tr, p);
      if (bl && bl.from[id]) pose = mix(bl.from[id], pose, ks);
      apply(el, pose);
    }
    st.style.setProperty("--p", String(r2(p)));
    const bs = beatsRef.current;
    let i = 0; for (let n = 0; n < bs.length; n++) if (p >= bs[n].at - 0.015) i = n;
    if (i !== beatRef.current) { beatRef.current = i; setBeat(i); }
    st.dataset.beat = String(i);
  }, [stageRef]);

  const scrollable = useCallback(() => {
    const st = stageRef.current; const sc = st?.parentElement as HTMLElement | null;
    if (!sc || !st) return { top: 0, len: 1 };
    const r = sc.getBoundingClientRect(); return { top: window.scrollY + r.top - STAGE_TOP, len: Math.max(1, sc.offsetHeight - st.offsetHeight) };
  }, [stageRef]);

  // the timed tween used by steps mode, Play dwell and blends
  const loop = useCallback(() => {
    function frame() {
      const tw = tween.current;
      if (tw) {
        const t = clamp((performance.now() - tw.t0) / tw.ms, 0, 1);
        prog.current = lerp(tw.from, tw.to, openEase(t));
        if (t >= 1) { tween.current = null; paint(); tw.then?.(); } else paint();
      } else paint();
      if (tween.current || blend.current) raf.current = requestAnimationFrame(frame);
    }
    cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(frame);
  }, [paint]);
  const tweenTo = useCallback((to: number, ms: number, then?: () => void) => { tween.current = { from: prog.current, to, t0: performance.now(), ms, then }; loop(); }, [loop]);

  const measure = useCallback(() => {
    if (staticAt !== null) { prog.current = staticAt; paint(); return; }
    if (modeRef.current !== "scroll") { paint(); return; }
    const { top, len } = scrollable();
    prog.current = clamp((window.scrollY - top) / len, 0, 1); paint();
  }, [paint, scrollable, staticAt]);

  // registered objects are collected on every rebuild and whenever the beat changes (an object can mount with a beat)
  const collect = useCallback(() => { const st = stageRef.current; if (!st) return; els.current = new Map(Array.from(st.querySelectorAll<HTMLElement | SVGElement>("[data-film]")).map((el) => [el.dataset.film as string, el])); }, [stageRef]);
  useEffect(() => { collect(); const vp = viewport(); if (stageRef.current) vp.stageH = stageRef.current.offsetHeight; tracks.current = buildRef.current(vp); paint(); }, [collect, paint, beat, stageRef]);

  // tracks and mode for the viewport; rebuilt on resize, and with a settled blend when the caller's dependencies change
  useEffect(() => {
    const rebuild = () => { collect(); const vp = viewport(); if (stageRef.current) vp.stageH = stageRef.current.offsetHeight; tracks.current = buildRef.current(vp); const m = staticAt !== null ? "static" : modeFor(vp, reduced); if (m !== modeRef.current) { modeRef.current = m; setMode(m); } if (m === "steps" && !tween.current) prog.current = Math.max(prog.current, beatsRef.current[0].at); measure(); };
    rebuild();
    window.addEventListener("resize", rebuild);
    return () => window.removeEventListener("resize", rebuild);
  }, [collect, measure, reduced, staticAt, stageRef]);
  const firstDeps = useRef(depsKey);
  useEffect(() => {
    if (firstDeps.current === depsKey) return;
    firstDeps.current = depsKey;
    const from: Record<string, Required<Pose>> = {};
    for (const [id] of els.current) { const tr = tracks.current[id]; if (tr) from[id] = poseAt(tr, prog.current); }
    const vp = viewport(); if (stageRef.current) vp.stageH = stageRef.current.offsetHeight;
    tracks.current = buildRef.current(vp);
    blend.current = { from, t0: performance.now() }; loop();
  }, [depsKey, loop, stageRef]);

  // scroll drives the film on desktop
  useEffect(() => {
    if (staticAt !== null) return;
    let ticking = false;
    const onScroll = () => { if (modeRef.current !== "scroll" || ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; measure(); }); };
    window.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => window.removeEventListener("scroll", onScroll);
  }, [measure, staticAt]);

  // Pause motion freezes any tween where it is; Resume continues from the current frame
  useEffect(() => {
    if (paused) { frozen.current = { tw: tween.current }; cancelAnimationFrame(raf.current); tween.current = null; return; }
    const f = frozen.current; frozen.current = null;
    if (f?.tw) { const span = Math.max(0.0001, Math.abs(f.tw.to - f.tw.from)); tween.current = { ...f.tw, from: prog.current, t0: performance.now(), ms: Math.max(120, f.tw.ms * Math.abs(f.tw.to - prog.current) / span) }; loop(); }
  }, [paused, loop]);

  const stop = useCallback(() => { playingRef.current = false; setPlaying(false); const tw = tween.current; if (tw?.then) tween.current = { ...tw, then: undefined }; }, []);

  // Play: steps mode travels beat to beat with a dwell; scroll mode moves the page at a steady pace; a wheel, touch or key stops it
  const playFrom = useCallback((i: number) => {
    function run(n: number) {
      const bs = beatsRef.current;
      if (n >= bs.length - 1) { stop(); return; }
      const to = bs[n + 1];
      tweenTo(to.at, 520, () => { if (!playingRef.current) return; dwell.current = window.setTimeout(() => { if (playingRef.current) run(n + 1); }, to.dwell ?? 1100); });
    }
    run(i);
  }, [stop, tweenTo]);
  useEffect(() => () => window.clearTimeout(dwell.current), []);
  useEffect(() => {
    if (!playing || modeRef.current !== "scroll") return;
    const { top, len } = scrollable();
    const from = window.scrollY; const to = top + len;
    const ms = Math.max(1200, ((to - from) / len) * beatsRef.current.length * 1900);
    const t0 = performance.now(); let id = 0;
    function step() {
      if (!playingRef.current) return;
      if (paused) { id = requestAnimationFrame(step); return; }
      const t = clamp((performance.now() - t0) / ms, 0, 1);
      window.scrollTo(0, from + (to - from) * t);
      if (t >= 1) { stop(); return; }
      id = requestAnimationFrame(step);
    }
    id = requestAnimationFrame(step);
    const cancel = () => stop();
    window.addEventListener("wheel", cancel, { passive: true }); window.addEventListener("touchstart", cancel, { passive: true }); window.addEventListener("keydown", cancel);
    return () => { cancelAnimationFrame(id); window.removeEventListener("wheel", cancel); window.removeEventListener("touchstart", cancel); window.removeEventListener("keydown", cancel); };
  }, [playing, paused, stop, scrollable]);

  const go = (i: number) => {
    const bs = beatsRef.current; const n = clamp(i, 0, bs.length - 1);
    stop(); window.clearTimeout(dwell.current); setStarted(true);
    if (modeRef.current === "scroll") { const { top, len } = scrollable(); window.scrollTo({ top: Math.round(top + bs[n].at * len), behavior: reduced ? "auto" : "smooth" }); }
    else tweenTo(bs[n].at, reduced ? 0 : 480);
  };
  const next = () => go(beatRef.current + 1);
  const prev = () => go(beatRef.current - 1);
  const play = () => {
    if (reduced) return; setStarted(true);
    const bs = beatsRef.current; let i = beatRef.current;
    if (i >= bs.length - 1) { i = 0; if (modeRef.current === "scroll") { const { top } = scrollable(); window.scrollTo({ top, behavior: "auto" }); } else prog.current = 0; }
    playingRef.current = true; setPlaying(true);
    if (modeRef.current !== "scroll") { paint(); playFrom(i); }
  };
  const replay = () => { stop(); if (modeRef.current === "scroll") { const { top } = scrollable(); window.scrollTo({ top, behavior: "auto" }); } else prog.current = 0; setStarted(true); paint(); if (!reduced) { playingRef.current = true; setPlaying(true); if (modeRef.current !== "scroll") playFrom(0); } };
  const retrack = () => { const vp = viewport(); if (stageRef.current) vp.stageH = stageRef.current.offsetHeight; tracks.current = buildRef.current(vp); paint(); };
  /** Direct manipulation (a comparison boundary): set the timeline position now, by scroll on desktop and directly on phone. */
  const scrub = (p: number) => {
    stop();
    if (modeRef.current === "scroll") { const { top, len } = scrollable(); window.scrollTo({ top: Math.round(top + clamp(p, 0, 1) * len), behavior: "auto" }); }
    else { prog.current = clamp(p, 0, 1); paint(); }
  };

  return { beat, atEnd: beat >= beats.length - 1, started, playing, mode, go, next, prev, play, stop, replay, retrack, scrub };
}

/** Presentation controls for a scene: Previous, Play or Pause, Next, Replay and Steps. */
export function FilmControls({ film, beats, playLabel = "Play", className = "", children }: { film: Film; beats: readonly Beat[]; playLabel?: string; className?: string; children?: ReactNode }) {
  const { reduced } = useMotion();
  const b = beats[film.beat];
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); film.next(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); film.prev(); }
    if (e.key === "Home") { e.preventDefault(); film.go(0); }
    if (e.key === "End") { e.preventDefault(); film.go(beats.length - 1); }
  };
  return (
    <div className={`x-controls x-film-controls ${className}`} role="group" aria-label="Sequence controls" onKeyDown={onKey}>
      <button type="button" className="icon-btn" aria-label="Previous" onClick={film.prev} disabled={film.beat === 0}><SkipBack size={18} /></button>
      {!reduced && !film.atEnd && (
        <button type="button" className="link link-plain t-action" aria-label={film.playing ? "Pause" : film.started ? "Play" : playLabel} onClick={() => (film.playing ? film.stop() : film.play())}>
          {film.playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}{!film.started && <span>{playLabel}</span>}
        </button>
      )}
      <button type="button" className="icon-btn" aria-label="Next" onClick={film.next} disabled={film.atEnd}><SkipForward size={18} /></button>
      {!reduced && (film.atEnd || film.started) && <button type="button" className="link link-plain t-action" onClick={film.replay}><ArrowCounterClockwise size={16} aria-hidden />Replay</button>}
      <span className="x-frame-label" aria-live="polite">{film.beat + 1} of {beats.length}<span aria-hidden> · </span>{b.label}</span>
      <Sheet title="Steps" variant="menu" triggerClass="link link-plain t-action x-steps-trigger" trigger={<>Steps<CaretDown size={14} aria-hidden /></>}>
        <div className="x-steps-list" role="list">
          {beats.map((x, i) => (
            <button key={x.key} type="button" role="listitem" aria-current={i === film.beat ? "true" : undefined} onClick={(e) => { film.go(i); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}><span>{i + 1}. {x.label}</span></button>
          ))}
        </div>
      </Sheet>
      {children}
    </div>
  );
}

/** An anchor inside a scene at a beat's position, so menu links land on that beat (desktop); on phone the scene is one block. */
export function BeatAnchor({ id, at }: { id: string; at: number }) {
  return <span id={id} className="x-scene-anchor" style={{ top: `calc(${at} * (100% - var(--stage-h)))` }} aria-hidden />;
}

/**
 * A scene: on desktop a tall scroller (`track` viewport heights of travel
 * beneath a pinned stage), on phone an ordinary block, under reduced motion
 * one stationary block per beat. `render` draws the whole stage for a film.
 */
export function Scene({ id, label, beats, track, phoneHeight, className = "", dark = false, anchors, render, style }: {
  id: string; label: string; beats: readonly Beat[]; track: number; phoneHeight: number; className?: string; dark?: boolean;
  anchors?: { id: string; at: number }[]; render: (staticAt: number | null) => ReactNode; style?: React.CSSProperties;
}) {
  const { reduced } = useMotion();
  if (reduced) {
    return (
      <section id={id} className={`x-scene x-scene-static ${className}`} aria-label={label} data-stage-dark={dark ? "true" : undefined} style={style}>
        {beats.map((b, i) => <div key={b.key} className="x-scene-static-beat" id={anchors?.find((a) => a.at === b.at && a.id !== id)?.id ?? (i === 0 ? undefined : undefined)}>{render(b.at)}</div>)}
      </section>
    );
  }
  return (
    <section id={id} className={`x-scene ${className}`} aria-label={label} data-stage-dark={dark ? "true" : undefined} style={{ ["--track" as string]: track, ["--phone-h" as string]: `${phoneHeight}px`, ...style }}>
      {anchors?.map((a) => <BeatAnchor key={a.id} id={a.id} at={a.at} />)}
      {render(null)}
    </section>
  );
}
