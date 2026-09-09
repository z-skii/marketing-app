"use client";

import { useState, useTransition } from "react";
import { toggleSave } from "@/app/(v2)/actions";

/** Bookmark toggle with instant feedback; the server confirms. */
export function SaveButton({
  itemType, itemId, initialSaved,
}: { itemType: string; itemId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save"}
      aria-pressed={saved}
      onClick={() => {
        setSaved(!saved);
        startTransition(async () => {
          const result = await toggleSave(itemType, itemId);
          if (result.ok && result.saved !== undefined) setSaved(result.saved);
          else if (!result.ok) setSaved(saved);
        });
      }}
      className={`p-1.5 transition-colors ${saved ? "text-signal" : "text-ink-faint hover:text-ink"}`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path
          d="M4.5 2.5h9v13L9 11.8l-4.5 3.7z"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
