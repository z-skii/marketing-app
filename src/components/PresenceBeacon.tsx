"use client";

import { useEffect } from "react";

/**
 * Marks this visitor as present: once on load, then once a minute while the
 * tab is visible, and again when the visitor returns to the tab. The server
 * ages them out of the live count five minutes after the last beat.
 */
export function PresenceBeacon() {
  useEffect(() => {
    let last = 0;
    const beat = () => {
      if (document.hidden || Date.now() - last < 55_000) return;
      last = Date.now();
      fetch("/api/presence", { method: "POST", keepalive: true }).catch(() => {});
    };
    beat();
    const timer = setInterval(beat, 60_000);
    document.addEventListener("visibilitychange", beat);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
    };
  }, []);
  return null;
}
