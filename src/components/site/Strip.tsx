"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

/**
 * A horizontal strip of frames for phones, with Previous and Next and a
 * position line above it. The strip scrolls natively too; the position
 * follows whichever way it moved. Hidden from 1024px, where the desktop
 * composition takes over.
 */
export function Strip({ children, count, label, className = "" }: { children: ReactNode; count: number; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const items = () => Array.from(el.children) as HTMLElement[];
    const onScroll = () => {
      const x = el.scrollLeft; let best = 0; let dist = Infinity;
      items().forEach((c, i) => { const d = Math.abs(c.offsetLeft - el.offsetLeft - x); if (d < dist) { dist = d; best = i; } });
      setPos(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (dir: -1 | 1) => {
    const el = ref.current; if (!el) return;
    const target = (Array.from(el.children) as HTMLElement[])[Math.min(count - 1, Math.max(0, pos + dir))];
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="site-strip-wrap">
      <div className="site-strip-nav">
        <button type="button" className="fs-icon-btn" onClick={() => go(-1)} disabled={pos === 0} aria-label={`Previous ${label}`}><CaretLeft size={20} aria-hidden /></button>
        <p className="site-meta" aria-live="polite">Screen {pos + 1} of {count}</p>
        <button type="button" className="fs-icon-btn" onClick={() => go(1)} disabled={pos >= count - 1} aria-label={`Next ${label}`}><CaretRight size={20} aria-hidden /></button>
      </div>
      <div className={`site-system-media ${className}`} ref={ref} aria-label={label}>{children}</div>
    </div>
  );
}
