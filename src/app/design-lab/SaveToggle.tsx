"use client";

import { useState } from "react";
import { BookmarkSimple } from "@phosphor-icons/react";
import { demoMutation } from "./adapter";

/**
 * Save changes only after the demo response (250ms), then uses 140ms
 * icon and colour feedback. A failure keeps the previous state and shows
 * Retry. This is the Lab adapter's simulated response, not backend progress.
 */
export function SaveToggle() {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const toggle = async () => {
    if (pending) return;
    setPending(true); setFailed(false);
    const r = await demoMutation();
    setPending(false);
    if (r.ok) setSaved((s) => !s); else setFailed(true);
  };
  return (
    <button type="button" onClick={toggle} aria-pressed={saved} className="btn btn-quiet" style={{ color: saved ? "var(--tm-accent)" : "var(--tm-ink)", transition: "color var(--tm-t-control) var(--tm-ease-out)" }}>
      <BookmarkSimple size={20} weight={saved ? "fill" : "regular"} aria-hidden />
      {pending ? "Saving" : failed ? "Retry" : saved ? "Saved" : "Save"}
    </button>
  );
}
