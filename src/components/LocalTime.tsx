"use client";

import { useSyncExternalStore } from "react";

/**
 * Renders a timestamp in the viewer's own timezone.
 *
 * The server cannot know the reader's timezone, so the server snapshot renders
 * the UTC form and the client snapshot re-renders it locally after hydration —
 * useSyncExternalStore is React's sanctioned way to express exactly that split
 * without a hydration mismatch or a state-in-effect cascade.
 */

const subscribe = () => () => {};

export function LocalTime({
  iso,
  options = { hour: "numeric", minute: "2-digit" },
}: {
  iso: string;
  options?: Intl.DateTimeFormatOptions;
}) {
  const label = useSyncExternalStore(
    subscribe,
    () => new Intl.DateTimeFormat(undefined, options).format(new Date(iso)),
    () => new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(iso)),
  );

  return <time dateTime={iso}>{label}</time>;
}
