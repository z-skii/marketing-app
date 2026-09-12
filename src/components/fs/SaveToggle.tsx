"use client";

import { useState, useTransition } from "react";
import { BookmarkSimple } from "@phosphor-icons/react";
import { toggleSave } from "@/app/(v2)/actions";

/**
 * Save for later. Instant feedback, then the server confirms; a failure
 * restores the previous state. 44px target, literal label.
 */
export function SaveToggle({ itemType, itemId, initialSaved }: { itemType: string; itemId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={saved}
      className="fs-btn fs-btn-quiet"
      style={{ color: saved ? "var(--fs-accent)" : "var(--fs-ink)" }}
      onClick={() => {
        const previous = saved; const next = !saved;
        setSaved(next); setFailed(false);
        startTransition(async () => {
          const r = await toggleSave(itemType, itemId);
          if (r.ok && r.saved !== undefined) setSaved(r.saved);
          else if (!r.ok) { setSaved(previous); setFailed(true); }
        });
      }}
    >
      <BookmarkSimple size={20} weight={saved ? "fill" : "regular"} aria-hidden />
      {pending ? "Saving" : failed ? "Retry" : saved ? "Saved" : "Save"}
    </button>
  );
}
