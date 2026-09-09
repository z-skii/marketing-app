"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatElapsed, formatMinutes } from "@/lib/utils/time";

/**
 * Re-renders on an interval; returns the current time.
 * The first render uses the render-time clock (server or client), so wrap time text in an element
 * with `suppressHydrationWarning` — it corrects itself on the first tick.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** "03:42:17" ticking every second since `from`. */
export function LiveTimer({ from, className }: { from: string; className?: string }) {
  const now = useNow(1000);
  return <span className={cn("tnum", className)} suppressHydrationWarning>{formatElapsed(from, now)}</span>;
}

/** "5h 41m" ticking every 30 seconds since `from` (minus break minutes). */
export function LiveElapsed({ from, breakMinutes = 0, className, intervalMs = 30000 }: { from: string; breakMinutes?: number; className?: string; intervalMs?: number }) {
  const now = useNow(intervalMs);
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(from).getTime()) / 60000) - breakMinutes);
  return <span className={cn("tnum", className)} suppressHydrationWarning>{formatMinutes(minutes)}</span>;
}
