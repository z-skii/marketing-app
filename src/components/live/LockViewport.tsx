"use client";

import { useEffect } from "react";

/**
 * The live screen is an app surface — no page scroll — but only when one
 * screen genuinely holds everything. This measures instead of assuming:
 * the lock is released for a beat, the document lays out at its natural
 * height, and the lock is re-applied only when nothing would be squeezed or
 * cut. Tall artwork, large text settings, zoom, small or resized windows —
 * anything that needs more room simply scrolls. Re-checked on resize, when
 * images finish loading, and on a slow heartbeat so a refreshed Spot with a
 * different photo re-decides. The attribute comes off on unmount so every
 * other route scrolls normally.
 */
export function LockViewport() {
  useEffect(() => {
    const el = document.documentElement;
    let raf = 0;

    const check = () => {
      raf = 0;
      // Measure at natural height, then lock only when one screen truly fits.
      // Remove-and-restore happens inside one frame, so nothing flickers.
      el.removeAttribute("data-live-lock");
      const fits = el.scrollHeight <= window.innerHeight + 1;
      if (fits) el.setAttribute("data-live-lock", "");
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };

    check();
    window.addEventListener("resize", queue);
    window.addEventListener("load", queue);
    window.visualViewport?.addEventListener("resize", queue);
    // Content changes (a new Spot photo, refreshed rows) re-measure shortly.
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
