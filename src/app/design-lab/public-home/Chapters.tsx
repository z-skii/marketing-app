"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ASSET } from "../mock";
import { PlacementDiagram } from "./PlacementDiagram";

/**
 * Recreate, Post, Drive. On desktop three ordinary document sections sit
 * beside one sticky media stage whose source follows the active chapter
 * (IntersectionObserver; 220ms crossfade). On phone the same chapters
 * stack in normal flow with their own media, no pinning. Reduced motion
 * removes the crossfade; the stage still follows the chapter.
 */
const CHAPTERS = [
  { id: "recreate", title: "Recreate.", line: "Film your version of a business's Reel.", example: "/design-lab/user-home" },
  { id: "post", title: "Post.", line: "Share the supplied Story. Instagram eligibility and required live time apply.", example: "/design-lab/user-home" },
  { id: "drive", title: "Drive.", line: "Carry an ad on your car. Monthly pay follows approved proofs.", example: "/design-lab/user-home" },
];

export function Chapters() {
  const [active, setActive] = useState("recreate");
  const refs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      const best = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (best) setActive((best.target as HTMLElement).dataset.chapter ?? "recreate");
    }, { rootMargin: "-35% 0px -35% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] });
    Object.values(refs.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="earn" className="pub-chapters" aria-label="How you earn">
      <div className="pub-chapter-text">
        {CHAPTERS.map((c) => (
          <article key={c.id} data-chapter={c.id} ref={(el) => { refs.current[c.id] = el; }} className="pub-chapter">
            <h2 className="pub-h2">{c.title}</h2>
            <p className="t-task">{c.line}</p>
            <div className="pub-chapter-media"><Stage chapter={c.id} phone /></div>
            <Link href={c.example} className="btn btn-quiet" style={{ paddingLeft: 0 }}>See an example <ArrowRight size={18} aria-hidden /></Link>
          </article>
        ))}
      </div>
      <div className="pub-sticky" aria-hidden>
        <Stage chapter={active} />
      </div>
    </section>
  );
}

function Stage({ chapter, phone = false }: { chapter: string; phone?: boolean }) {
  return (
    <div className="pub-stage-inner" data-active={chapter}>
      <div className={`pub-scene ${chapter === "recreate" ? "is-on" : ""}`} data-scene="recreate">
        <div className="media contain pub-ref" style={{ background: "var(--tm-underlay)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSET("reference-loopday-01")} alt="Reference still: a latte being poured at a coffee counter" />
          <span className="t-meta pub-label">Reference still · Demo</span>
        </div>
        <div className="media pub-film">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSET("public-filming-01")} alt="A person filming their own version at a coffee counter" />
          <span className="t-meta pub-label">Filming illustration</span>
        </div>
      </div>
      <div className={`pub-scene ${chapter === "post" ? "is-on" : ""}`} data-scene="post">
        <div className="media pub-story" style={{ boxShadow: "var(--tm-shadow-source)", background: "var(--tm-underlay)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSET("story-loopday-01")} alt="The supplied Story creative: Take a coffee break." />
        </div>
        <span className="t-meta pub-label pub-label-below">Supplied creative · Demo</span>
      </div>
      <div className={`pub-scene ${chapter === "drive" ? "is-on" : ""}`} data-scene="drive">
        <div className="media contain pub-car" style={{ background: "var(--tm-underlay)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSET("vehicle-maya-01")} alt="A blue hatchback parked on a residential street, no ad installed" />
          <span className="t-meta pub-label">Demo vehicle · No installed ad</span>
        </div>
        {phone && <div style={{ marginTop: 12 }}><PlacementDiagram width={160} /><p className="t-meta" style={{ margin: "4px 0 0" }}>Rear doors: the named placement zone</p></div>}
      </div>
    </div>
  );
}
