"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts down to an authoritative server timestamp.
 *
 * The browser only ever renders the difference — it never decides when a Spot
 * starts or ends. When the clock runs out `onExpire` fires once, which the
 * callers use to ask the server what comes next.
 */
export function useCountdown(targetIso: string, onExpire?: () => void): number {
  const [target, setTarget] = useState(targetIso);
  const [seconds, setSeconds] = useState(() => secondsUntil(targetIso));

  // Adjusting state during render is React's documented way to respond to a
  // changed prop, and avoids the extra pass a syncing effect would cost.
  if (target !== targetIso) {
    setTarget(targetIso);
    setSeconds(secondsUntil(targetIso));
  }

  // Keep the latest callback without making the interval depend on it.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const next = secondsUntil(targetIso);
      setSeconds(next);
      if (next <= 0) {
        clearInterval(timer);
        onExpireRef.current?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetIso]);

  return seconds;
}

export function secondsUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000));
}

/** mm:ss, or h:mm:ss once there is an hour or more to go. */
export function formatClock(seconds: number, forceHours = false): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 || forceHours ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
