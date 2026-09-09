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
      className="-ml-1 px-1 py-1 font-mono text-xs text-ink-faint hover:text-ink"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
    >
      ← {label}
    </button>
  );
}
