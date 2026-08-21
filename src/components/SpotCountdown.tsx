"use client";

import { useRouter } from "next/navigation";
import { formatClock, useCountdown } from "@/lib/use-countdown";

/** Time left in the current Spot appearance. */
export function SpotCountdown({ endsAt }: { endsAt: string }) {
  const router = useRouter();
  const remaining = useCountdown(endsAt, () => router.refresh());

  return (
    <span className="flex items-baseline gap-2">
      <span className="eyebrow">Ends in</span>
      <time suppressHydrationWarning className="tnum font-mono text-base font-600 tracking-tight" dateTime={endsAt} aria-live="off">
        {formatClock(remaining)}
      </time>
    </span>
  );
}
