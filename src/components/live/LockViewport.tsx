"use client";

import { useEffect } from "react";

/**
 * The live screen is an app surface: one locked viewport, no page scroll.
 * Under the lock the layout compresses itself to fit — the artwork scales
 * into its share of the screen — so the lock is applied FIRST, and only
 * content that STILL cannot fit releases it, because a hidden or overlapped
 * element is worse than a scrollbar.
 *
 * Releasing takes two strikes: a page that is loading — web fonts swapping
 * in, the ad photo arriving, a phone browser settling its toolbars — can
 * measure a few pixels too tall for a moment, and unlocking on that flicker
 * made the screen visibly jump. An overflow must still be there on a
 * confirmation pass ~400ms later before the lock comes off; the screen
 * never flashes for a transient. Re-checked on resize, image loads, font
 * readiness, and a slow heartbeat. The attribute comes off on unmount so
 * every other route scrolls normally.
 */
export function LockViewport() {
  useEffect(() => {
    const el = document.documentElement;
    let raf = 0;
    let confirmTimer: ReturnType<typeof setTimeout> | null = null;

    const measureClipped = () => {
      el.setAttribute("data-live-lock", "");
      const main = document.querySelector("main");
      return (
        (main && main.scrollHeight > main.clientHeight + 2) ||
        el.scrollHeight > window.innerHeight + 2
      );
    };

    const check = () => {
      raf = 0;
      if (!measureClipped()) {
        // Fits: stay locked and cancel any pending release.
        if (confirmTimer) {
          clearTimeout(confirmTimer);
          confirmTimer = null;
        }
        return;
      }
      if (confirmTimer) return; // confirmation already scheduled
      confirmTimer = setTimeout(() => {
        confirmTimer = null;
        // Still too tall after the page settled: this one is real.
        if (measureClipped()) el.removeAttribute("data-live-lock");
      }, 400);
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    check();
    window.addEventListener("resize", queue);
    window.addEventListener("load", queue);
    window.visualViewport?.addEventListener("resize", queue);
    document.addEventListener("load", queue, true); // image loads bubble here
    document.fonts?.ready.then(queue).catch(() => {});
    const heartbeat = setInterval(queue, 2000);

    return () => {
      window.removeEventListener("resize", queue);
      window.removeEventListener("load", queue);
      window.visualViewport?.removeEventListener("resize", queue);
      document.removeEventListener("load", queue, true);
      clearInterval(heartbeat);
      if (confirmTimer) clearTimeout(confirmTimer);
      if (raf) cancelAnimationFrame(raf);
      el.removeAttribute("data-live-lock");
    };
  }, []);
  return null;
}
