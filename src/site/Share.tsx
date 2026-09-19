"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Reveal } from "@/ds/motion";
import { M } from "@/v3/media";
import { Phone } from "./Devices";
import { StoryScroll, type Step } from "./Story";
import { CheckCircleIcon, Clock, Wallet, InstagramLogo, UploadSimple } from "./icons";

const STEPS: Step[] = [
  { title: "A business launches a Story campaign", body: "The business supplies a finished 9:16 creative and says how long it has to stay live." },
  { title: "You accept and post it", body: "Post the creative to your Instagram Story exactly as supplied. Nothing to design." },
  { title: "Submit proof", body: "A screenshot of the live Story. TapMart reads the time and the handle." },
  { title: "The required time completes", body: "The Story stays up for the agreed hours. The campaign tracks the clock." },
  { title: "Approval and payment", body: "The business approves the proof and the Story's pay lands in your balance." },
];

/** SHARE: a realistic Instagram Story on a phone; the campaign steps pass beside it. */
export function Share() {
  return (
    <section id="share" className="lp-section env-blush" aria-labelledby="share-h">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-chapter-head">
            <p className="eyebrow lp-kicker"><span className="lp-num">3</span>Share</p>
            <h2 id="share-h" className="t-h1">Post a Story. Keep it live. Get paid.</h2>
            <p className="t-lead">Businesses hand you the creative. You post it to your Story, keep it up for the agreed time, and send proof.</p>
          </div>
        </Reveal>
        <StoryScroll steps={STEPS} visual={(i) => <StoryVisual step={i} />} />
      </div>
    </section>
  );
}

function StoryVisual({ step }: { step: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduced = useReducedMotion();
  const pct = step >= 4 ? 100 : step === 3 ? 100 : step === 2 ? 28 : step === 1 ? 8 : 0;
  return (
    <div ref={ref} className="lp-share-phone">
      <Phone large>
        <picture><source type="image/avif" srcSet={`${M.story(480)} 480w, ${M.story(720)} 720w`} sizes="300px" /><img src={M.storyOriginal} alt="" loading="lazy" /></picture>
        <div className="lp-story-bars"><span><motion.i initial={{ width: 0 }} animate={{ width: step >= 1 && inView ? "100%" : 0 }} transition={{ duration: reduced ? 0 : 1.2 }} /></span><span /><span /></div>
        <div className="lp-story-head"><span className="lp-story-avatar"><img src={M.contentCounter()} alt="" /></span><span>loopdaycoffee</span><span style={{ opacity: 0.75, fontWeight: 400 }}>Sponsored</span></div>
        <div className="lp-story-foot"><span>Send message</span><InstagramLogo size={22} color="#fff" aria-hidden /></div>
        {step === 0 && <motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, background: "rgba(15,16,19,0.55)", zIndex: 2, display: "grid", placeItems: "center", padding: 16 }}><span className="glass-panel is-dark lp-glass" style={{ textAlign: "center" }}><span style={{ fontWeight: 600 }}>Story campaign</span><span className="t-meta" style={{ display: "block", color: "var(--env-on-dark-muted)" }}>US$25 · 24h live · 20 spots</span></span></motion.div>}
      </Phone>
      <div style={{ position: "absolute", right: "-22%", bottom: "14%", minWidth: 170 }}>
        {step === 2 && <motion.div key="p" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel lp-glass" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}><UploadSimple size={18} aria-hidden />Proof submitted</motion.div>}
        {step === 3 && <motion.div key="c" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel lp-glass"><span className="lp-obj-label"><Clock size={16} aria-hidden />24h live</span><div style={{ marginTop: 8, height: 6, borderRadius: 3, background: "var(--tm-surface3)", overflow: "hidden" }}><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: reduced ? 0 : 1.6, ease: [0.22, 1, 0.36, 1] }} style={{ height: "100%", background: "var(--tm-red)" }} /></div></motion.div>}
        {step === 4 && <motion.div key="a" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel lp-glass"><span className="lp-obj-label" style={{ color: "var(--tm-success)" }}><CheckCircleIcon size={16} weight="fill" aria-hidden />Approved</span><div className="lp-obj-money" style={{ marginTop: 6 }}>US$25</div><div className="t-meta" style={{ display: "flex", alignItems: "center", gap: 4 }}><Wallet size={14} aria-hidden />To your balance</div></motion.div>}
      </div>
    </div>
  );
}
