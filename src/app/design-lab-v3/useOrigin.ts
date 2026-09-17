"use client";

import { useSyncExternalStore } from "react";

/** The page origin, empty on the server so the first client render matches. */
export function useOrigin(): string {
  return useSyncExternalStore(() => () => {}, () => window.location.origin, () => "");
}
