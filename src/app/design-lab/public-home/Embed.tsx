"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * A live, coded screen at its logical size (390x844 phone, 1440x900
 * desktop) scaled as one object to the width of its container. The DOM
 * inside is the real prototype, so states, fonts and media are the real
 * thing; nothing is a picture. Inert for the visitor: pointer events are
 * off and the screen is presentational (the page provides its own Open
 * example control).
 */
export function Embed({ width, height, children, className = "", label }: { width: number; height: number; children: ReactNode; className?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => setScale(el.clientWidth / width);
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={ref} className={`embed ${className}`} role="img" aria-label={label} style={{ width: "100%", height: Math.round(height * scale), overflow: "hidden", position: "relative" }}>
      <div aria-hidden style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none", userSelect: "none" }}>
        {children}
      </div>
    </div>
  );
}
