"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type ChapterStep = { title: string; body: string; media: ReactNode; caption?: string };

/**
 * One earning chapter. The markup is one list of steps, each with its text
 * and its real frame. Under 1024px the stylesheet lays the steps out as a
 * horizontal strip with the frame above the words. From 1024px the frames
 * share one sticky stage beside the steps and the active one is the step
 * closest to the middle of the viewport, found with IntersectionObserver.
 * No scroll position is ever changed by the page; reduced motion swaps
 * frames without the crossfade.
 */
export function Chapter({ id, tone, num, name, title, lead, steps }: { id: string; tone: "graphite" | "canvas" | "underlay"; num: string; name: string; title: string; lead: string; steps: ChapterStep[] }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

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
    return () => { mq.removeEventListener("change", start); observer?.disconnect(); };
  }, []);

  return (
    <section ref={ref} id={id} className={`site-section tone-${tone}${tone === "graphite" ? " fs-on-dark" : ""}`} aria-labelledby={`${id}-title`}>
      <div className="site-wrap site-steps" style={{ "--n": steps.length } as React.CSSProperties}>
        <div className="site-section-head" data-reveal>
          <p className="site-kicker"><span className="site-num">{num}</span>{name}</p>
          <h2 id={`${id}-title`} className="site-h2">{title}</h2>
          <p className="site-lead">{lead}</p>
        </div>
        <div className="site-step-list">
          {steps.map((step, i) => (
            <div key={step.title} className="site-step">
              <div className="site-step-text" style={{ gridRow: i + 2 }}>
                <p className="site-step-num" aria-hidden>{String(i + 1).padStart(2, "0")}</p>
                <h3 className="site-step-title"><span className="fs-sr">Step {i + 1}: </span>{step.title}</h3>
                <p className="site-step-body">{step.body}</p>
              </div>
              <div className={`site-step-media${i === active ? " is-active" : ""}`} style={{ "--row": i + 2 } as React.CSSProperties} aria-hidden={i !== active ? true : undefined}>
                <figure>
                  {step.media}
                  {step.caption && <figcaption className="site-caption">{step.caption}</figcaption>}
                </figure>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
