"use client";

import { AnimatePresence, motion } from "motion/react";
import { CarStage, type Zone } from "@/ds/car/CarStage";
import { Reveal } from "@/ds/motion";
import { CheckCircleIcon, CameraIcon, PinIcon, SealCheck } from "./icons";
import { M } from "@/v3/media";
import { StoryScroll, type Step } from "./Story";

const STEPS: Step[] = [
  { title: "Scan your car", body: "Add your car with a few guided photos. TapMart checks them and marks the car ready for placements." },
  { title: "Get matched with local businesses", body: "Businesses near you post car campaigns with the placement they want and what they pay per month." },
  { title: "Install approved advertising", body: "Once you are accepted, the business's artwork goes on the placement you agreed to: a door, the rear window, or the full side." },
  { title: "Upload proof", body: "A photo of the installed placement, then a monthly check while the campaign runs." },
  { title: "Get paid monthly", body: "Each approved month releases the campaign's pay to your balance. Request a payout whenever you are over the minimum." },
];

const ZONE: (Zone | null)[] = [null, "rear_door", "rear_door", "rear_door", "rear_door"];

/** DRIVE: the signature car moment. The car holds on one side; the placement, the proof and the pay arrive as the steps pass. */
export function Drive() {
  return (
    <section id="drive" className="lp-section lp-drive" data-nav-dark aria-labelledby="drive-h">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-chapter-head">
            <p className="eyebrow lp-kicker"><span className="lp-num">1</span>Drive</p>
            <h2 id="drive-h" className="t-h1">Your car earns while you drive.</h2>
            <p className="t-lead">Register your car, take a local campaign, install the approved artwork, upload proof, get paid every month.</p>
          </div>
        </Reveal>
        <StoryScroll steps={STEPS} visual={(i) => <DriveVisual step={i} />} />
      </div>
    </section>
  );
}

function DriveVisual({ step }: { step: number }) {
  return (
    <div className="lp-car-wrap">
      <CarStage car="wagon" zone={ZONE[step]} artwork={step >= 2 ? "/uploads/seed/demo-car-artwork.png" : null} floor="dark" tilt={7} scrollTurn={8} label="A wagon on a dark stage with a campaign placement" priority>
        {step === 0 && <div className="lp-scan" aria-hidden />}
      </CarStage>
      <AnimatePresence mode="popLayout">
        {step === 0 && (
          <motion.div key="s0" className="lp-car-annot" style={{ left: "4%", top: "0%" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}>
            <span className="glass-panel is-dark lp-glass" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px" }}><CameraIcon size={20} aria-hidden />6 of 6 photos · <span style={{ color: "#8FE3B0" }}>Verified</span></span>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div key="s1" className="lp-car-annot" style={{ right: "-4%", top: "-2%", display: "grid", gap: 8 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}>
            {[["Loopday Coffee", "Rear door · US$110 a month"], ["Spur Room Barbers", "Rear window · US$90 a month"]].map(([n, l], k) => (
              <span key={n} className="glass-panel is-dark lp-glass" style={{ padding: "10px 14px", display: "block", transform: `translateX(${k * 10}px)` }}><span style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 14 }}><PinIcon size={16} aria-hidden />{n}</span><span className="t-meta" style={{ color: "var(--env-on-dark-muted)" }}>{l}</span></span>
            ))}
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="s2" className="lp-car-annot" style={{ left: "26%", top: "-4%" }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <span className="glass-tag is-dark" style={{ height: 34, padding: "0 12px", fontSize: 13 }}>Rear door · approved artwork</span>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="s3" className="lp-car-annot" style={{ right: "2%", bottom: "8%", width: "36%", maxWidth: 220 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <div className="card" style={{ padding: 8 }}>
              <div className="media-frame is-sm" style={{ aspectRatio: "4 / 3" }}><img src={M.driveWagon(480)} alt="" loading="lazy" /></div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 4px 2px", fontSize: 13, fontWeight: 600, color: "var(--tm-success)" }}><CheckCircleIcon size={16} weight="fill" aria-hidden />Proof accepted</div>
            </div>
          </motion.div>
        )}
        {step === 4 && (
          <motion.div key="s4" className="lp-car-annot" style={{ left: "4%", bottom: "6%" }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <div className="glass-panel lp-glass" style={{ color: "var(--tm-text)" }}>
              <span className="lp-obj-label" style={{ color: "var(--tm-success)" }}><SealCheck size={16} weight="fill" aria-hidden />Month 1 approved</span>
              <div className="lp-obj-money" style={{ marginTop: 6 }}>US$110.00</div>
              <div className="t-meta">Released to your balance</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
