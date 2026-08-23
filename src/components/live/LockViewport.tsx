"use client";

import { useEffect } from "react";

/**
 * Locks the document while the live screen is mounted: no page scroll, no
 * scrollbar, no rubber-banding — the homepage is an app surface, not a page.
 * The attribute comes off on unmount so every other route scrolls normally.
 */
export function LockViewport() {
  useEffect(() => {
    document.documentElement.setAttribute("data-live-lock", "");
    return () => document.documentElement.removeAttribute("data-live-lock");
  }, []);
  return null;
}
