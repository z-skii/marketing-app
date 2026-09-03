"use client";

import { useRouter } from "next/navigation";
import { useCountdown } from "@/lib/use-countdown";

/**
 * The landing page shows no clocks, but the Spot handover still happens on the
 * server's schedule: this renders nothing and simply re-asks the server for the
 * screen the moment the current appearance ends.
 */
export function SpotRefresh({ endsAt }: { endsAt: string }) {
  const router = useRouter();
  useCountdown(endsAt, () => router.refresh());
  return null;
}
