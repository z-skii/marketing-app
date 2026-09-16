"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Inspect } from "@/components/site/Inspect";

/** A source-to-commitment plane beside a frame: the amount and the conditions of the demo record shown. */
export type Plane = { amount: string; basis: string; lines: string[]; tone: "accent" | "surface" };
export type ChapterStep = {
  title: string; body: string; media: ReactNode;
  /** Provenance, in words: what record and state the frame shows. */
  caption: string;
  plane?: Plane;
  inspect?: { src: string; alt: string; size: "phone" | "desktop" | "photo"; width: number; height: number; label: string };
};

const STEP_W = 232 + 12;

/**
 * One earning chapter. The markup is one list of steps, each with its text
 * and its real frame, its provenance caption and a way to inspect it. Under
 * 1024px the stylesheet lays the steps out as a horizontal strip with
 * Previous and Next controls and a position line. From 1024px the frames
 * share one sticky stage beside the head and the steps; the active frame is
 * the step closest to the middle of the viewport, found with
 * IntersectionObserver. No scroll position is ever changed by the page;
 * reduced motion swaps frames without the crossfade.
 */
export function Chapter({ id, tone, num, name, title, lead, note, cta, steps }: { id: string; tone: "graphite" | "canvas" | "underlay"; num: string; name: string; title: string; lead: string; note: string; cta: { href: string; label: string }; steps: ChapterStep[] }) {
  const ref = useRef<HTMLElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const texts = Array.from(root.querySelectorAll<HTMLElement>(".site-step-text"));
    const mq = window.matchMedia("(min-width: 1024px)");
    let observer: IntersectionObserver | null = null;
    const start = () => {
      observer?.disconnect();
      observer = null;
      if (!mq.matches) { setActive(0); return; }
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(texts.indexOf(entry.target as HTMLElement));
        }
      }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
      texts.forEach((t) => observer!.observe(t));
    };
    start();
    mq.addEventListener("change", start);
    const strip = list.current;
    const onStrip = () => { if (strip) setPos(Math.min(steps.length - 1, Math.max(0, Math.round(strip.scrollLeft / STEP_W)))); };
    strip?.addEventListener("scroll", onStrip, { passive: true });
    return () => { mq.removeEventListener("change", start); observer?.disconnect(); strip?.removeEventListener("scroll", onStrip); };
  }, [steps.length]);

  const go = (dir: -1 | 1) => {
    const strip = list.current; if (!strip) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left: Math.max(0, (pos + dir) * STEP_W), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section ref={ref} id={id} className={`site-section tone-${tone}${tone === "graphite" ? " fs-on-dark" : ""}`} aria-labelledby={`${id}-title`}>
      <div className="site-wrap site-steps" style={{ "--n": steps.length } as React.CSSProperties}>
        <div className="site-section-head" data-reveal>
          <p className="site-kicker"><span className="site-num">{num}</span>{name}</p>
          <h2 id={`${id}-title`} className="site-h2">{title}</h2>
          <p className="site-lead">{lead}</p>
          <p className="site-meta" style={{ marginTop: 12 }}>{note}</p>
          <Link href={cta.href} className="fs-btn fs-btn-secondary site-chapter-cta">{cta.label}</Link>
        </div>
        <div className="site-step-list" ref={list}>
          {steps.map((step, i) => (
            <div key={step.title} className="site-step">
              <div className="site-step-text" style={{ gridRow: i + 2 }}>
                <p className="site-step-num" aria-hidden>{String(i + 1).padStart(2, "0")}</p>
                <h3 className="site-step-title"><span className="fs-sr">Step {i + 1}: </span>{step.title}</h3>
                <p className="site-step-body">{step.body}</p>
              </div>
              <div className={`site-step-media${i === active ? " is-active" : ""}`} style={{ "--row": i + 2 } as React.CSSProperties} aria-hidden={i !== active ? true : undefined}>
                <figure>
                  <div className="site-source-row">
                    {step.media}
                    {step.plane && (
                      <div className={`site-plane is-${step.plane.tone}`}>
                        <p className="site-money site-plane-amount">{step.plane.amount}</p>
                        <p className="site-plane-basis">{step.plane.basis}</p>
                        {step.plane.lines.map((l) => <p key={l} className="site-plane-line">{l}</p>)}
                      </div>
                    )}
                  </div>
                  <figcaption>
                    <p className="site-caption">{step.caption}</p>
                    {step.inspect && <Inspect {...step.inspect} />}
                  </figcaption>
                </figure>
              </div>
            </div>
          ))}
        </div>
        <div className="site-strip-nav">
          <button type="button" className="fs-icon-btn" onClick={() => go(-1)} disabled={pos === 0} aria-label="Previous step"><CaretLeft size={20} aria-hidden /></button>
          <p className="site-meta" aria-live="polite">Step {pos + 1} of {steps.length}</p>
          <button type="button" className="fs-icon-btn" onClick={() => go(1)} disabled={pos >= steps.length - 1} aria-label="Next step"><CaretRight size={20} aria-hidden /></button>
        </div>
      </div>
    </section>
  );
}
