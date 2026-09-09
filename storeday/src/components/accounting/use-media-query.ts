"use client";
import * as React from "react";

/** True when the media query matches. Renders the server snapshot (`ssr`) until hydration completes. */
export function useMediaQuery(query: string, ssr = true): boolean {
  const subscribe = React.useCallback((cb: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, [query]);
  return React.useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => ssr);
}
