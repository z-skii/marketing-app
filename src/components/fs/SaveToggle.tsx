"use client";

import { useState, useTransition } from "react";
import { BookmarkSimple } from "@phosphor-icons/react";
import { toggleSave } from "@/app/(v2)/actions";

/**
 * Save for later. Instant feedback, then the server confirms; a failure
 * restores the previous state. 44px target, literal label. `compact`
 * renders the round glass control that sits on a photograph.
 */
export function SaveToggle({ itemType, itemId, initialSaved, compact = false }: { itemType: string; itemId: string; initialSaved: boolean; compact?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const label = pending ? "Saving" : failed ? "Retry" : saved ? "Saved" : "Save";
  const onClick = () => {
    const previous = saved; const next = !saved;
    setSaved(next); setFailed(false);
    startTransition(async () => {
      const r = await toggleSave(itemType, itemId);
      if (r.ok && r.saved !== undefined) setSaved(r.saved);
      else if (!r.ok) { setSaved(previous); setFailed(true); }
    });
  };
  if (compact) {
    return (
      <button type="button" aria-pressed={saved} aria-label={saved ? "Saved. Remove from saved" : "Save for later"} className="iconbtn is-surface" data-tip={saved ? "Saved" : "Save"} onClick={onClick} style={{ color: saved ? "var(--tm-red)" : "var(--tm-text)" }}>
        <BookmarkSimple size={20} weight={saved ? "fill" : "regular"} aria-hidden />
      </button>
    );
  }
  return (
    <button type="button" aria-pressed={saved} className="fs-btn fs-btn-quiet" style={{ color: saved ? "var(--fs-accent)" : "var(--fs-ink)" }} onClick={onClick}>
      <BookmarkSimple size={20} weight={saved ? "fill" : "regular"} aria-hidden />
      {label}
    </button>
  );
}
