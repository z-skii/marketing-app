"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * An interactive island that exists on the first load only as its
 * fallback: the island's code and its hydration are deferred until the
 * fallback comes within `margin` of the viewport. Offscreen sequences
 * therefore cost nothing on first paint, and the swap happens well before
 * a reader can see it. The fallback must occupy the same height as the
 * island, so nothing visible moves when it is replaced.
 */
export function Near({ children, fallback, margin = 1200 }: { children: ReactNode; fallback: ReactNode; margin?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near) return;
    const el = ref.current; if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: `${margin}px 0px` });
    io.observe(el); return () => io.disconnect();
  }, [near, margin]);
  // the sentinel is a real 1px box (an element with display contents has no box for the observer), pulled up so it costs no space
  return near ? <>{children}</> : <><div ref={ref} aria-hidden style={{ height: 1, marginTop: -1, pointerEvents: "none" }} />{fallback}</>;
}
