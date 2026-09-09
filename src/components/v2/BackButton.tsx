"use client";

import { useRouter } from "next/navigation";

/**
 * A back control that behaves like the platform back button: it returns to
 * the screen you actually came from, and only falls back to the section root
 * when there's no in-app history (a fresh tab, a shared link).
 */
export function BackButton({ fallback, label = "Back" }: { fallback: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={label ? undefined : "Back"}
      className="-ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 py-1 font-display text-sm font-600 text-ink-soft transition-colors hover:text-ink"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    >
      <span aria-hidden>←</span>
      {label && <span>{label}</span>}
    </button>
  );
}
