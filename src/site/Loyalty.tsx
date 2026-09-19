"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Reveal, Stagger, Item } from "@/ds/motion";
import { AppleCard, type CardData } from "@/v3/wallet/Cards";
import { defaultCard, liveProgram } from "@/v3/examples";
import { QrCode, Users, Stamp, ArrowsClockwise, Gift, Check } from "./icons";

const EXAMPLE: CardData = { design: defaultCard, program: liveProgram, firstName: "Jasmine", memberId: "LD-0042", code: "example-jasmine", progress: 3, ready: 0, state: "collecting" };

/**
 * LOYALTY: an Apple Wallet style pass for a local business, the customer
 * joining by QR, stamps filling with each visit, the creator who referred
 * them credited. A planned feature: the pass is an example design and
 * nothing is issued to any Wallet today.
 */
export function Loyalty() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  return (
    <section id="loyalty" className="lp-section env-ice" aria-labelledby="loyalty-h">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-chapter-head">
            <p className="eyebrow lp-kicker"><span className="lp-num">4</span>Loyalty and referrals <span className="badge is-ink" style={{ marginLeft: 6 }}>Coming soon</span></p>
            <h2 id="loyalty-h" className="t-h1">A loyalty card in the customer's Wallet.</h2>
            <p className="t-lead">A business runs a stamp card in Apple Wallet or Google Wallet. Customers join with one scan, come back, and the creator who sent them gets credited. Planned; no pass is issued today.</p>
          </div>
        </Reveal>
        <div className="lp-story" style={{ alignItems: "center" }}>
          <div ref={ref} style={{ display: "flex", justifyContent: "center" }}>
            <div className="lp-pass-wrap">
              <motion.div initial={reduced ? false : { rotate: -4, y: 24, opacity: 0 }} animate={inView ? { rotate: 0, y: 0, opacity: 1 } : undefined} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} style={{ boxShadow: "var(--tm-shadow-float)", borderRadius: 12 }}>
                <div className="v3" style={{ background: "transparent" }}><AppleCard d={EXAMPLE} width={340} /></div>
              </motion.div>
              <div className="glass-panel lp-glass" style={{ position: "absolute", right: "-10%", top: "40%", padding: "12px 14px" }}>
                <span className="t-meta">Visits</span>
                <div className="lp-stamps" aria-label="3 of 5 visits">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.span key={i} className={`lp-stamp ${inView && i < 3 ? "is-on" : ""}`} initial={false} transition={{ delay: reduced ? 0 : 0.5 + i * 0.25 }} style={{ transitionDelay: reduced ? "0s" : `${0.5 + i * 0.25}s` }}>{inView && i < 3 && <Check size={16} weight="bold" aria-hidden />}</motion.span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Stagger className="lp-flow" gap={0.1} style={{ ["--n" as string]: 1, marginTop: 0 }}>
            {[
              [QrCode, "QR scan", "A code at the counter, on the receipt or in a creator's Story."],
              [Users, "Customer joins", "One tap adds the business's card to their Wallet."],
              [Stamp, "Stamps and points", "Each qualifying visit is recorded on the card."],
              [ArrowsClockwise, "Repeat visit", "The reward unlocks; the card updates in the Wallet."],
              [Gift, "Creator referral credited", "Customers who joined through a creator's link stay attributed to that creator."],
            ].map(([Icon, t, b]) => { const I = Icon as typeof QrCode; return <Item key={t as string}><div className="lp-flow-step"><span className="icon-square is-ice"><I size={20} aria-hidden /></span><span><strong>{t as string}</strong><span className="t-meta">{b as string}</span></span></div></Item>; })}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
