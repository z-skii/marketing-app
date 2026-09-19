"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Reveal, Stagger, Item } from "@/ds/motion";
import { M } from "@/v3/media";
import { Phone } from "./Devices";
import { PaperPlaneTilt, Hourglass, CheckCircleIcon, Wallet } from "./icons";

/**
 * RECREATE: the business's Reel on one phone, the creator's version
 * appearing beside it, then Submit, business reviews, approved, paid.
 * The creator's version is revealed with a wipe as the pair comes into
 * view (a still from the creative system; no real creator video exists yet).
 */
export function Recreate() {
  return (
    <section id="recreate" className="lp-section env-cream" aria-labelledby="recreate-h">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-chapter-head">
            <p className="eyebrow lp-kicker"><span className="lp-num">2</span>Recreate</p>
            <h2 id="recreate-h" className="t-h1">Film your version of a business's Reel.</h2>
            <p className="t-lead">The business posts a reference. You recreate it your way, at the counter, in your kitchen, on your street. Approved versions pay per video.</p>
          </div>
        </Reveal>
        <div className="lp-story is-flip" style={{ alignItems: "center" }}>
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <Pair />
          </div>
          <Stagger className="lp-flow" gap={0.1} style={{ ["--n" as string]: 2, marginTop: 0 }}>
            {[
              [PaperPlaneTilt, "Submit", "Upload your video. TapMart checks the requirements before the business sees it."],
              [Hourglass, "Business reviews", "The business watches it and approves, or asks for one revision."],
              [CheckCircleIcon, "Approved", "The version is accepted and can be used by the business."],
              [Wallet, "You get paid", "The campaign's pay, less the platform fee, lands in your balance."],
            ].map(([Icon, t, b]) => {
              const I = Icon as typeof PaperPlaneTilt;
              return <Item key={t as string}><div className="lp-flow-step"><span className="icon-square"><I size={20} aria-hidden /></span><span><strong>{t as string}</strong><span className="t-meta">{b as string}</span></span></div></Item>;
            })}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

function Pair() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduced = useReducedMotion();
  return (
    <div ref={ref} className="lp-pair">
      <div>
        <Phone>
          <picture><source type="image/avif" srcSet={M.reference9x16()} /><img src={M.referenceOriginal} alt="" loading="lazy" /></picture>
          <span className="glass-tag is-dark" style={{ position: "absolute", left: "6%", top: "5%", zIndex: 2 }}>Business Reel</span>
        </Phone>
        <p className="lp-pair-label">The reference</p>
      </div>
      <div>
        <Phone large>
          <picture><source type="image/avif" srcSet={`${M.mayaPour(480)} 480w, ${M.mayaPour(800)} 800w`} sizes="260px" /><img src={M.mayaPour(800)} alt="" loading="lazy" /></picture>
          {!reduced && (
            <motion.div className="lp-wipe" aria-hidden initial={{ x: 0 }} animate={inView ? { x: "100%" } : { x: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} />
          )}
          <span className="glass-tag is-dark" style={{ position: "absolute", left: "6%", top: "5%", zIndex: 3 }}>Creator's version</span>
        </Phone>
        <p className="lp-pair-label">Filmed by the creator</p>
      </div>
    </div>
  );
}
