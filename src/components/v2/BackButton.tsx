"use client";

import { useRouter } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react";

/**
 * A back control that behaves like the platform back button: it returns to
 * the screen you actually came from, and only falls back to the section root
 * when there's no in-app history (a fresh tab, a shared link).
 *
 * The label names the destination ("Home"), never the word Back.
 */
export function BackButton({ fallback, label }: { fallback: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={label ? undefined : "Back"}
      className="-ml-2 inline-flex min-h-11 min-w-11 items-center gap-0.5 rounded-full px-2 font-display text-sm font-600 text-ink-soft transition-colors can-hover:hover:text-ink"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    >
      <CaretLeft size={22} weight="bold" aria-hidden />
      {label && label !== "Back" && <span>{label}</span>}
    </button>
  );
}
