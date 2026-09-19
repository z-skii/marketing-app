"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import {motion, useMotionValue, useScroll, useSpring, useTransform} from "motion/react";
import { useReducedMotion } from "@/ds/motion";
import { CARS, type CarName } from "@/ds/photos";

/**
 * The car presentation: an isolated car that exists in the page. A
 * perspective stage, the car on a soft floor shadow with a faint
 * reflection, pointer parallax on desktop, scroll linked rotation, a gentle
 * automatic drift, and campaign artwork that can sit on a placement zone
 * (rear door, front door, rear window, full side). Phones get the same
 * composition with reduced range; reduced motion renders it still.
 */
export type Zone = "rear_door" | "front_door" | "rear_window" | "full_side";

/** Placement zones as fractions of the car image (three quarter view, nose to the right). */
const ZONES: Record<CarName, Record<Zone, { x: number; y: number; w: number; h: number; skew: number }>> = {
  wagon: {
    rear_door: { x: 0.285, y: 0.33, w: 0.13, h: 0.36, skew: -8 },
    front_door: { x: 0.425, y: 0.32, w: 0.15, h: 0.38, skew: -8 },
    rear_window: { x: 0.17, y: 0.16, w: 0.2, h: 0.2, skew: -10 },
    full_side: { x: 0.14, y: 0.3, w: 0.44, h: 0.4, skew: -8 },
  },
  sedan: {
    rear_door: { x: 0.2, y: 0.33, w: 0.14, h: 0.34, skew: -8 },
    front_door: { x: 0.35, y: 0.32, w: 0.16, h: 0.36, skew: -8 },
    rear_window: { x: 0.12, y: 0.14, w: 0.18, h: 0.2, skew: -10 },
    full_side: { x: 0.08, y: 0.3, w: 0.45, h: 0.38, skew: -8 },
  },
  hatch: {
    rear_door: { x: 0.2, y: 0.33, w: 0.14, h: 0.34, skew: -8 },
    front_door: { x: 0.36, y: 0.32, w: 0.16, h: 0.36, skew: -8 },
    rear_window: { x: 0.1, y: 0.14, w: 0.2, h: 0.2, skew: -10 },
    full_side: { x: 0.08, y: 0.3, w: 0.46, h: 0.38, skew: -8 },
  },
};

export const ZONE_LABEL: Record<Zone, string> = { rear_door: "Rear door", front_door: "Front door", rear_window: "Rear window", full_side: "Full side" };

export function CarStage({
  car = "wagon", zone = null, artwork = null, artworkLabel = "Campaign artwork", className = "", style, priority = false, tilt = 8, drift = true, scrollTurn = 6, children, floor = "light", label,
}: {
  car?: CarName; zone?: Zone | null; artwork?: string | null; artworkLabel?: string; className?: string; style?: CSSProperties; priority?: boolean;
  tilt?: number; drift?: boolean; scrollTurn?: number; children?: ReactNode; floor?: "light" | "dark"; label?: string;
}) {
  const asset = CARS[car];
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // read once on the client; it only affects pointer handlers, never the rendered markup
  const [pointer] = useState(() => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches);

  const mx = useMotionValue(0); const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [tilt * 0.6, -tilt * 0.6]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-tilt, tilt]), { stiffness: 120, damping: 18 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const sy = useTransform(scrollYProgress, [0, 1], [-scrollTurn, scrollTurn]);
  const sx = useTransform(scrollYProgress, [0, 1], [-14, 14]);

  const onMove = (e: React.PointerEvent) => {
    if (!pointer || reduced) return;
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  const z = zone ? ZONES[car][zone] : null;
  const still = Boolean(reduced);
  const carStyle: CSSProperties = { width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 18px 24px rgba(0, 0, 0, 0.22))" };

  return (
    <div ref={ref} className={`car-stage-3d ${className}`} style={{ perspective: 1400, ...style }} onPointerMove={onMove} onPointerLeave={onLeave} aria-label={label ?? `${asset.name}, isolated`} role="img">
      <motion.div style={{ rotateX: still ? 0 : rx, rotateY: still ? 0 : ry, transformStyle: "preserve-3d", position: "relative" }}>
        <motion.div style={{ rotateY: still ? 0 : sy, x: still ? 0 : sx, transformStyle: "preserve-3d", position: "relative" }}>
          <motion.div animate={drift && !still ? { y: [0, -6, 0] } : undefined} transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }} style={{ position: "relative" }}>
            {/* floor shadow */}
            <div aria-hidden style={{ position: "absolute", left: "8%", right: "8%", bottom: "-4%", height: "18%", borderRadius: "50%", background: floor === "dark" ? "radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 45%, transparent 72%)" : "radial-gradient(ellipse at center, rgba(18,20,23,0.42) 0%, rgba(18,20,23,0.16) 45%, transparent 72%)", filter: "blur(10px)", transform: "translateZ(-40px)" }} />
            <div style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.src} srcSet={`${asset.small} 900w, ${asset.src} 1600w`} sizes="(min-width: 1024px) 720px, 100vw" width={asset.width} height={asset.height} alt="" style={carStyle} loading={priority ? "eager" : "lazy"} decoding="async" fetchPriority={priority ? "high" : undefined} />
              {/* highlight sweep */}
              <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.18) 48%, rgba(255,255,255,0) 60%)", mixBlendMode: "screen", pointerEvents: "none", WebkitMaskImage: `url(${asset.src})`, maskImage: `url(${asset.src})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }} />
              {z && (
                <div aria-label={`${ZONE_LABEL[zone as Zone]} placement`} style={{ position: "absolute", left: `${z.x * 100}%`, top: `${z.y * 100}%`, width: `${z.w * 100}%`, height: `${z.h * 100}%`, transform: `skewY(${z.skew}deg)`, borderRadius: 6, overflow: "hidden", boxShadow: artwork ? "inset 0 0 0 1px rgba(255,255,255,0.25)" : "inset 0 0 0 2px var(--tm-red), 0 0 0 3px rgba(224,33,43,0.25)", background: artwork ? undefined : "rgba(224, 33, 43, 0.22)", mixBlendMode: artwork ? "multiply" : "normal", transition: "all var(--tm-t-base) var(--tm-ease)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {artwork && <img src={artwork} alt={artworkLabel} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.92 }} />}
                </div>
              )}
            </div>
            {/* reflection */}
            <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: "100%", height: "40%", overflow: "hidden", opacity: floor === "dark" ? 0.22 : 0.14, pointerEvents: "none", transform: "translateY(-6%)", WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), transparent 70%)", maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9), transparent 70%)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.small} alt="" style={{ width: "100%", height: "auto", display: "block", transform: "scaleY(-1)", filter: "blur(2px)" }} loading="lazy" decoding="async" />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
      {children}
    </div>
  );
}
