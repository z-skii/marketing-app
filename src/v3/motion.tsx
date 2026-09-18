"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "@phosphor-icons/react";

/**
 * Presentation control for the V3 experience (docs/design-lab-v3/
 * EXPERIENCE_DIRECTION.md, reduced motion). One visible Pause motion /
 * Resume motion control sits on every surface with presentation
 * timelines. Pause freezes timelines and CSS animations without resetting
 * their position (data-motion="paused" on the root); product state
 * changes still render immediately. The system prefers-reduced-motion
 * preference is authoritative: sequences render their ordered states in
 * document flow and Resume cannot re-enable spatial motion.
 */
type Motion = { paused: boolean; reduced: boolean; setPaused: (v: boolean) => void };
const Ctx = createContext<Motion>({ paused: false, reduced: false, setPaused: () => {} });

export function MotionProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    const id = setTimeout(apply, 0);
    mq.addEventListener("change", apply);
    return () => { clearTimeout(id); mq.removeEventListener("change", apply); };
  }, []);
  const value = useMemo(() => ({ paused, reduced, setPaused }), [paused, reduced]);
  return <Ctx.Provider value={value}><div className="x-root" data-motion={paused ? "paused" : "playing"} data-reduced={reduced ? "true" : "false"}>{children}</div></Ctx.Provider>;
}

export function useMotion() { return useContext(Ctx); }

/** True when presentation timelines must not advance: paused or system reduced motion. */
export function useStill() { const m = useContext(Ctx); return m.paused || m.reduced; }

export function PauseControl({ className = "" }: { className?: string }) {
  const { paused, reduced, setPaused } = useMotion();
  return (
    <span className={`x-motion ${className}`}>
      {reduced && <span className="t-note x-reduced-label">Reduced motion</span>}
      <button type="button" className="x-pause t-action" aria-pressed={paused} onClick={() => setPaused(!paused)}>
        {paused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}{paused ? "Resume motion" : "Pause motion"}
      </button>
    </span>
  );
}

/** The compact context line of a surface with motion: an optional label, the motion control, an optional right slot. */
export function MotionStrip({ label, className = "", right }: { label?: string; className?: string; right?: ReactNode }) {
  return (
    <div className={`x-labstrip ${className}`}>
      {label && <span className="t-note x-labstrip-label">{label}</span>}
      <PauseControl />
      {right && <span className="x-labstrip-right">{right}</span>}
    </div>
  );
}

/**
 * A presentation timer that respects Pause and reduced motion: the
 * callback runs after `ms` of unpaused time; pausing keeps the remaining
 * time and resumes from it. Returns nothing; cancel by changing `key`.
 */
export function usePresentationTimer(active: boolean, ms: number, onDone: () => void, key: unknown) {
  const { paused, reduced } = useMotion();
  const remaining = useRef(ms);
  const started = useRef<number | null>(null);
  const cb = useRef(onDone);
  useEffect(() => { cb.current = onDone; }, [onDone]);
  useEffect(() => { remaining.current = ms; started.current = null; }, [key, ms]);
  useEffect(() => {
    if (!active || reduced) return;
    if (paused) return;
    started.current = performance.now();
    const t = window.setTimeout(() => { started.current = null; cb.current(); }, remaining.current);
    return () => {
      window.clearTimeout(t);
      if (started.current !== null) { remaining.current = Math.max(0, remaining.current - (performance.now() - started.current)); started.current = null; }
    };
  }, [active, paused, reduced, key]);
}
