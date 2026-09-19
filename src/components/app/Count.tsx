"use client";

import { CountUp } from "@/ds/motion";

/** A count that animates once into view; reduced motion shows the value at once. */
export function Count({ value, className }: { value: number; className?: string }) {
  return <CountUp value={value} className={className} duration={0.9} />;
}
