"use client";

import { useEffect } from "react";

/**
 * The desktop scroll enhancement switch. Only at 1200px wide and 800px
 * tall or more, and only without reduced motion, the page gets the
 * pub-enh class: chapters become 900px sections with a locally pinned
 * 780px panel and scroll-linked geometry. Otherwise every chapter is an
 * ordinary content-height section holding its settled composition.
 */
export function Enhance() {
  useEffect(() => {
    const root = document.querySelector(".pub");
    if (!root) return;
    const mq = window.matchMedia("(min-width: 1200px) and (min-height: 800px) and (prefers-reduced-motion: no-preference)");
    const apply = () => root.classList.toggle("pub-enh", mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return null;
}
