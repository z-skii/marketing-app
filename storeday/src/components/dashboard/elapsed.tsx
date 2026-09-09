"use client";
import { useSyncExternalStore } from "react";
import { formatElapsed } from "@/lib/utils/time";

/** One shared 1s ticker for every timer on the page. */
function subscribe(cb: () => void) {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
}
const getNow = () => Math.floor(Date.now() / 1000);
const getServerNow = () => 0;

/** Live "03:42:17" timer for an active shift. Renders "—" until hydrated. */
export function Elapsed({ since, className }: { since: string; className?: string }) {
  const sec = useSyncExternalStore(subscribe, getNow, getServerNow);
  return <span className={className}>{sec ? formatElapsed(since, new Date(sec * 1000)) : "—"}</span>;
}
