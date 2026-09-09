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
      className={`flex items-center justify-center p-1.5 transition-colors ${saved ? "text-signal" : "text-ink hover:text-signal"}`}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
        <path
          d="M5 2.75h10v14.5L10 13.2l-5 4.05z"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
