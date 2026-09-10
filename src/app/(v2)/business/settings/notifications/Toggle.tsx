"use client";

import { useState, useTransition } from "react";
import { toggleNotification } from "./actions";

/** One kind of notification, on or off. Saves on tap. */
export function NotificationToggle({ kind, label, sub, initial }: { kind: string; label: string; sub: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      type="button" role="switch" aria-checked={on} disabled={pending}
      className="flex min-h-16 w-full items-center justify-between gap-4 py-3 text-left"
      onClick={() => { const next = !on; setOn(next); start(async () => { const r = await toggleNotification(kind, next); if (!r.ok) setOn(!next); }); }}
    >
      <span className="min-w-0">
        <span className="block font-display text-[1rem] font-600">{label}</span>
        <span className="block text-sm text-ink-soft">{sub}</span>
      </span>
      <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-signal" : "bg-rule-strong"}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-paper transition-transform ${on ? "translate-x-[1.375rem]" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}
