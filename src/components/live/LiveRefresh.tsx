"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps a long-open live screen honest without hammering the database: the
 * server state is refetched once a minute while the tab is visible, and once
 * immediately when a visitor returns to a tab that went stale in the
 * background. Countdowns run client-side off authoritative timestamps, so
 * this cadence is presentation freshness, not correctness.
 */
export function LiveRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  const lastRefresh = useRef(0);

  useEffect(() => {
    lastRefresh.current = Date.now();
    const refresh = () => {
      lastRefresh.current = Date.now();
      router.refresh();
    };

    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, seconds * 1000);

    const onVisible = () => {
      if (!document.hidden && Date.now() - lastRefresh.current > seconds * 1000) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, seconds]);

  return null;
}
