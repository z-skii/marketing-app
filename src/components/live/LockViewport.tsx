"use client";

import { useEffect } from "react";

/**
 * The live screen is an app surface: one locked viewport, no page scroll.
 * Under the lock the layout compresses itself to fit — the artwork scales
 * into its share of the screen, sections keep their order — so the lock is
 * applied FIRST, and only if something still cannot fit (content taller
 * than its clipped frame) does the page fall back to normal scrolling,
 * because a hidden or overlapped element is worse than a scrollbar.
 * Re-checked on resize, image loads, and a slow heartbeat so a refreshed
 * Spot with a different photo re-decides. The attribute comes off on
 * unmount so every other route scrolls normally.
 */
export function LockViewport() {
  useEffect(() => {
    const el = document.documentElement;
    let raf = 0;

    const check = () => {
      raf = 0;
      // Lock first: definite heights let the layout shrink the artwork and
      // panels into one screen. Then probe for anything that STILL
      // overflows its clipped frame; only that releases the lock.
      el.setAttribute("data-live-lock", "");
      const main = document.querySelector("main");
      const clipped =
        (main && main.scrollHeight > main.clientHeight + 1) ||
        el.scrollHeight > window.innerHeight + 1;
      if (clipped) el.removeAttribute("data-live-lock");
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    check();
    window.addEventListener("resize", queue);
    window.addEventListener("load", queue);
    window.visualViewport?.addEventListener("resize", queue);
    document.addEventListener("load", queue, true); // image loads bubble here
    const heartbeat = setInterval(queue, 2000);

    return () => {
      window.removeEventListener("resize", queue);
      window.removeEventListener("load", queue);
      window.visualViewport?.removeEventListener("resize", queue);
      document.removeEventListener("load", queue, true);
      clearInterval(heartbeat);
      if (raf) cancelAnimationFrame(raf);
      el.removeAttribute("data-live-lock");
    };
  }, []);
  return null;
}
