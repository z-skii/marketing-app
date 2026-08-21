"use client";

import { useRouter } from "next/navigation";
import { formatClock, useCountdown } from "@/lib/use-countdown";

/** Counts down to a scheduled Spot appearance, then asks the server for it. */
export function StartsIn({ startsAt }: { startsAt: string }) {
  const router = useRouter();
  const seconds = useCountdown(startsAt, () => router.refresh());

  return (
    <span className="flex items-baseline gap-2">
      <span className="eyebrow">Starts in</span>
      <time suppressHydrationWarning className="tnum font-mono text-base font-600 tracking-tight" dateTime={startsAt}>
        {formatClock(seconds)}
      </time>
    </span>
  );
}
