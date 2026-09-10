"use client";

import { useState, useTransition } from "react";
import { BookmarkSimple } from "@phosphor-icons/react";
import { toggleSave } from "@/app/(v2)/actions";

/** Bookmark toggle with instant feedback; the server confirms. 44px hit region. */
export function SaveButton({
  itemType, itemId, initialSaved, className = "",
}: { itemType: string; itemId: string; initialSaved: boolean; className?: string }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pop, setPop] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !saved;
        setSaved(next);
        if (next) { setPop(true); window.setTimeout(() => setPop(false), 350); }
        startTransition(async () => {
          const result = await toggleSave(itemType, itemId);
          if (result.ok && result.saved !== undefined) setSaved(result.saved);
          else if (!result.ok) setSaved(saved);
        });
      }}
      className={`glass-tag flex h-11 w-11 items-center justify-center rounded-full transition-colors ${saved ? "text-signal" : "text-ink"} ${className}`}
    >
      <BookmarkSimple size={22} weight={saved ? "fill" : "regular"} className={pop ? "pop" : ""} aria-hidden />
    </button>
  );
}
