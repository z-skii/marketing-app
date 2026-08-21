"use client";

import { formatClock, useCountdown } from "@/lib/use-countdown";

/** Time left in the daily board round. */
export function RoundCountdown({ endsAt }: { endsAt: string }) {
  const seconds = useCountdown(endsAt);
  return (
    <time suppressHydrationWarning className="tnum font-mono text-sm font-600" dateTime={endsAt}>
      {formatClock(seconds, true)}
    </time>
  );
}
