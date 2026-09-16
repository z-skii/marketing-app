"use client";

import { useState, useTransition } from "react";
import { toggleNotification } from "@/app/(v2)/business/settings/notifications/actions";

/** One kind of notification, on or off. Saves on tap and rolls back if the save fails. */
export function NotificationSwitch({ kind, label, sub, initial }: { kind: string; label: string; sub: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <li>
      <button
        type="button" role="switch" aria-checked={on} disabled={pending} className="fs-settings-row"
        onClick={() => { const next = !on; setOn(next); setError(null); start(async () => { const r = await toggleNotification(kind, next); if (!r.ok) { setOn(!next); setError(r.error ?? "Could not save."); } }); }}
      >
        <span style={{ minWidth: 0 }}>
          <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>{label}</span>
          <span className="fs-t-meta fs-settings-sub">{sub}{error ? ` · ${error}` : ""}</span>
        </span>
        <span className="fs-switch" aria-hidden />
      </button>
    </li>
  );
}
