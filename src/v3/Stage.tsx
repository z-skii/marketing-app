"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { ArrowCounterClockwise, CaretDown, Pause, Play, SkipBack, SkipForward } from "@phosphor-icons/react";
import { Sheet } from "./ui/Sheet";
import { useMotion } from "./motion";

/**
 * The shared presentation engine for every V3 sequence (public hero
 * chapters, the car moment, the Loyalty loop). Frames are named states
 * with a duration; playback runs once and rests; Previous, Next, Replay
 * and Steps give direct access; Pause motion freezes the timeline in
 * place; system reduced motion renders the ordered states in document
 * flow instead (the caller decides that layout). Playback never submits,
 * approves, redeems or advances the working clock: it changes
 * presentation state only.
 */
export type Frame = { key: string; label: string; dur: number; unavailable?: string };

export function useSequence(frames: readonly Frame[], opts: { stage?: RefObject<HTMLDivElement | null> } = {}) {
  const { paused, reduced } = useMotion();
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [tick, setTick] = useState(0);
  const remaining = useRef(frames[0]?.dur ?? 0);
  const startedAt = useRef<number | null>(null);
  const autoplayed = useRef(false);
  // The caller's stage element: a deliberate step keeps its reading anchor beneath the navigation, and playback stops when it leaves view.
  const stage = opts.stage;
  useEffect(() => {
    const el = stage?.current; if (!el) return;
    const io = new IntersectionObserver((es) => { if (!es[0].isIntersecting) setPlaying(false); }, { threshold: 0 });
    io.observe(el); return () => io.disconnect();
  }, [stage]);
  // timer for the current frame, pause aware
  useEffect(() => {
    if (!playing || reduced) return;
    if (paused) return;
    startedAt.current = performance.now();
    const t = window.setTimeout(() => {
      startedAt.current = null;
      setFrame((f) => {
        if (f >= frames.length - 1) { setPlaying(false); return f; }
        remaining.current = frames[f + 1].dur; return f + 1;
      });
      setTick((n) => n + 1);
    }, remaining.current);
    return () => {
      window.clearTimeout(t);
      if (startedAt.current !== null) { remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt.current)); startedAt.current = null; }
    };
  }, [playing, paused, reduced, frames, tick]);

  // Plain handlers: they read the stage ref on a click, so they are not memoized by hand (the compiler handles them).
  const go = (n: number) => {
    const i = Math.max(0, Math.min(frames.length - 1, n));
    setPlaying(false); setStarted(true); setFrame(i); remaining.current = frames[i].dur; setTick((x) => x + 1);
    // Re-anchor beneath the navigation stack only when the new object would sit above the viewport; a stage in view is never moved under the finger.
    const el = stage?.current;
    if (el) requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const top = window.innerWidth < 1024 ? 128 : 136;
      if (r.top < top - 8) window.scrollTo({ top: window.scrollY + r.top - top, behavior: reduced ? "auto" : "smooth" });
    });
  };
  const play = useCallback(() => {
    setStarted(true);
    setFrame((f) => { const s = f >= frames.length - 1 ? 0 : f; remaining.current = frames[s].dur; return s; });
    setPlaying(true); setTick((x) => x + 1);
  }, [frames]);
  const stop = useCallback(() => setPlaying(false), []);
  const replay = useCallback(() => { setFrame(0); remaining.current = frames[0].dur; setPlaying(true); setStarted(true); setTick((x) => x + 1); }, [frames]);
  const next = () => go(frame + 1);
  const prev = () => go(frame - 1);
  const autoplay = useCallback(() => { if (autoplayed.current || reduced) return; autoplayed.current = true; play(); }, [play, reduced]);
  return { frame, playing, started, go, play, stop, replay, next, prev, autoplay, atEnd: frame >= frames.length - 1 };
}

export type Seq = ReturnType<typeof useSequence>;

/** Presentation controls: Previous, Play/Pause or Next, Replay, and Steps (a labelled frame list for direct access). */
export function SeqControls({ seq, frames, playLabel = "Play sequence", showPlay = true, className = "", children }: { seq: Seq; frames: readonly Frame[]; playLabel?: string; showPlay?: boolean; className?: string; children?: ReactNode }) {
  const f = frames[seq.frame];
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); seq.next(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); seq.prev(); }
    if (e.key === "Home") { e.preventDefault(); seq.go(0); }
    if (e.key === "End") { e.preventDefault(); seq.go(frames.length - 1); }
  };
  return (
    <div className={`x-controls ${className}`} role="group" aria-label="Sequence controls" onKeyDown={onKey}>
      <button type="button" className="icon-btn" aria-label="Previous" onClick={seq.prev} disabled={seq.frame === 0}><SkipBack size={18} /></button>
      {showPlay && !seq.atEnd && (
        <button type="button" className="link link-plain t-action" aria-label={seq.playing ? "Pause" : seq.started ? "Play" : playLabel} onClick={() => (seq.playing ? seq.stop() : seq.play())}>
          {seq.playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}{!seq.started && <span>{playLabel}</span>}
        </button>
      )}
      <button type="button" className="icon-btn" aria-label="Next" onClick={seq.next} disabled={seq.atEnd}><SkipForward size={18} /></button>
      {(seq.atEnd || seq.started) && <button type="button" className="link link-plain t-action" onClick={seq.replay}><ArrowCounterClockwise size={16} aria-hidden />Replay</button>}
      <span className="x-frame-label" aria-live="polite">{seq.frame + 1} of {frames.length}<span aria-hidden> · </span>{f.label}</span>
      <Sheet title="Steps" variant="menu" triggerClass="link link-plain t-action x-steps-trigger" trigger={<>Steps<CaretDown size={14} aria-hidden /></>}>
        <div className="x-steps-list" role="list">
          {frames.map((x, i) => (
            <button key={x.key} type="button" role="listitem" aria-current={i === seq.frame ? "true" : undefined} disabled={Boolean(x.unavailable)} onClick={(e) => { seq.go(i); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}>
              <span>{i + 1}. {x.label}</span>{x.unavailable && <span className="t-fact">{x.unavailable}</span>}
            </button>
          ))}
        </div>
      </Sheet>
      {children}
    </div>
  );
}

/** Ordered sections for reduced motion: every frame as a labelled stationary section. */
export function Ordered({ frames, render, id }: { frames: readonly Frame[]; render: (i: number) => ReactNode; id: string }) {
  return (
    <div className="x-ordered">
      {frames.map((f, i) => f.unavailable ? null : <section key={f.key} className="x-ordered-section" id={`${id}-${f.key}`} aria-label={f.label}><span className="x-frame-label">{i + 1} of {frames.length}<span aria-hidden> · </span>{f.label}</span>{render(i)}</section>)}
    </div>
  );
}
