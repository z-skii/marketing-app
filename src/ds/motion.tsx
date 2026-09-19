"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { motion, useInView, useScroll, useTransform, animate, type Variants } from "motion/react";

/**
 * Reduced motion, read after hydration so the server and the first client
 * render agree (motion's own hook reads the media query synchronously on
 * the client and would produce a hydration mismatch). Until the effect
 * runs, motion is assumed on; a reduced-motion user sees at most one
 * settled frame before everything renders still.
 */
const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => { const mq = window.matchMedia(QUERY); mq.addEventListener("change", cb); return () => mq.removeEventListener("change", cb); };
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}

/**
 * The one motion system. Reveals fade and rise a little as they enter the
 * viewport, groups stagger their children, parallax moves imagery and
 * floating objects on scroll, numbers count up once, pages fade in.
 * Everything animates transform and opacity only, once, and respects
 * prefers-reduced-motion (the content simply appears).
 */
export const EASE = [0.22, 1, 0.36, 1] as const;
export const DUR = { fast: 0.16, base: 0.32, slow: 0.64, reveal: 0.7 } as const;

type Base = { children: ReactNode; className?: string; style?: CSSProperties; id?: string };

export function Reveal({ children, className, style, id, delay = 0, y = 24, scale = 0.985, once = true, amount = 0.2 }: Base & { delay?: number; y?: number; scale?: number; once?: boolean; amount?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className} style={style} id={id}>{children}</div>;
  return (
    <motion.div id={id} className={className} style={style} initial={{ opacity: 0, y, scale }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once, amount }} transition={{ duration: DUR.reveal, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

const container = (gap: number): Variants => ({ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: 0.05 } } });
const item: Variants = { hidden: { opacity: 0, y: 20, scale: 0.985 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.slow, ease: EASE } } };

/** A group whose children (each wrapped in <Item>) rise one after another. */
export function Stagger({ children, className, style, id, gap = 0.08, once = true, amount = 0.15 }: Base & { gap?: number; once?: boolean; amount?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className} style={style} id={id}>{children}</div>;
  return <motion.div id={id} className={className} style={style} variants={container(gap)} initial="hidden" whileInView="show" viewport={{ once, amount }}>{children}</motion.div>;
}
export function Item({ children, className, style }: Base) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className} style={style}>{children}</div>;
  return <motion.div className={className} style={style} variants={item}>{children}</motion.div>;
}

/** Moves its content vertically as the viewport scrolls past it: hero imagery, cars, phones, floating cards. */
export function Parallax({ children, className, style, range = [-32, 32], rotate = 0 }: Base & { range?: [number, number]; rotate?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], range);
  const r = useTransform(scrollYProgress, [0, 1], [-rotate, rotate]);
  if (reduced) return <div ref={ref} className={className} style={style}>{children}</div>;
  return <motion.div ref={ref} className={className} style={{ ...style, y, rotate: r }}>{children}</motion.div>;
}

/** Gentle independent motion for floating interface objects. Never loops when motion is reduced. */
export function Float({ children, className, style, amplitude = 8, duration = 6, delay = 0 }: Base & { amplitude?: number; duration?: number; delay?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className} style={style}>{children}</div>;
  return <motion.div className={className} style={style} animate={{ y: [0, -amplitude, 0] }} transition={{ duration, ease: "easeInOut", repeat: Infinity, delay }}>{children}</motion.div>;
}

/** A number that counts up once when it enters the viewport. Formats through `format` (money, counts). */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString("en-US"), duration = 1.4, className }: { value: number; format?: (n: number) => string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, { duration, ease: EASE, onUpdate: (v) => setShown(v) });
    return () => controls.stop();
  }, [inView, value, duration, reduced]);
  // the final value renders directly when motion is reduced or once the count has settled
  const display = reduced || (inView && shown >= value) ? value : shown;
  return <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>{format(display)}</span>;
}

/** Subtle press feedback for any interactive wrapper. */
export const press = { whileTap: { scale: 0.98 }, transition: { duration: DUR.fast, ease: EASE } } as const;
export function Pressable({ children, className, style }: Base) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className} style={style}>{children}</div>;
  return <motion.div className={className} style={style} whileHover={{ y: -2 }} whileTap={{ scale: 0.98, y: 0 }} transition={{ duration: DUR.base, ease: EASE }}>{children}</motion.div>;
}

/** Page transition: a short fade with a small rise, no long loading animation. */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return <motion.div className={className} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: DUR.base, ease: EASE }}>{children}</motion.div>;
}

/** Scroll progress of a section, for sticky storytelling. */
export function useSectionProgress<T extends HTMLElement>(offset: [string, string] = ["start start", "end end"]) {
  const ref = useRef<T>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: offset as ["start start", "end end"] });
  return { ref, progress: scrollYProgress };
}

export { motion, useTransform, useScroll, useInView };
