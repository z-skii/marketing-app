"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {useInView} from "motion/react";
import { useReducedMotion } from "@/ds/motion";

/**
 * Sticky storytelling: the visual holds on one side while the steps
 * scroll past on the other; whichever step is nearest the middle of the
 * viewport is the active one and the visual renders for it.
 */
export type Step = { title: string; body: string };

export function StoryScroll({ steps, visual, flip = false, className = "" }: { steps: Step[]; visual: (active: number) => ReactNode; flip?: boolean; className?: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className={`lp-story ${flip ? "is-flip" : ""} ${className}`}>
      <div className="lp-story-visual">{visual(active)}</div>
      <div className="lp-story-steps">
        {steps.map((s, i) => <StepBlock key={s.title} index={i} step={s} active={active === i} onEnter={() => setActive(i)} />)}
      </div>
    </div>
  );
}

function StepBlock({ step, index, active, onEnter }: { step: Step; index: number; active: boolean; onEnter: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px", amount: 0 });
  const reduced = useReducedMotion();
  useEffect(() => { if (inView) onEnter(); }, [inView, onEnter]);
  return (
    <div ref={ref} className={`lp-step ${active || reduced ? "" : "is-dim"}`}>
      <span className="lp-step-n">Step {index + 1}</span>
      <h3 className="t-h3">{step.title}</h3>
      <p className="t-body">{step.body}</p>
    </div>
  );
}
