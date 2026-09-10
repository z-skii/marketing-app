"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { disconnectConnection, syncInstagramNow } from "./actions";

/**
 * The one action per connection row. Connect and Reconnect hand the browser
 * to the provider's consent screen through the start route; while that
 * redirect is in flight the row shows a live "Connecting to ..." line so the
 * wait is visible. Disconnect is a server action.
 */

export type ControlProps = {
  provider: "google_business" | "instagram";
  name: string;
  state: "not_connected" | "connecting" | "connected" | "needs_reconnect" | "error";
  configured: boolean;
  startHref: string;
  /** Where "Connecting" (a pending Google row) should resume. */
  resumeHref?: string;
};

export function ConnectionControls({ provider, name, state, configured, startHref, resumeHref }: ControlProps) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const go = () => {
    setError(null);
    setLeaving(true);
    window.location.assign(startHref);
  };

  const disconnect = () => {
    setError(null);
    start(async () => {
      const result = await disconnectConnection(provider);
      if (!result.ok) { setError(result.error); return; }
      router.refresh();
    });
  };

  const sync = () => {
    setError(null);
    start(async () => {
      const result = await syncInstagramNow();
      if (!result.ok) { setError(result.error); return; }
      router.refresh();
    });
  };

  if (leaving) {
    return (
      <span className="flex items-center gap-2 text-sm text-ink-soft" aria-live="polite">
        <span className="live-dot" aria-hidden />Connecting to {name}
      </span>
    );
  }

  return (
    <span className="flex shrink-0 flex-col items-end gap-1">
      {state === "not_connected" && (
        <button type="button" className="btn btn-sm" disabled={!configured} onClick={go} aria-label={`Connect ${name}`}>Connect</button>
      )}
      {(state === "needs_reconnect" || state === "error") && (
        <button type="button" className="btn btn-sm" disabled={!configured} onClick={go} aria-label={`Reconnect ${name}`}>Reconnect</button>
      )}
      {state === "connecting" && (
        resumeHref
          ? <a href={resumeHref} className="btn btn-sm">Pick a location</a>
          : <button type="button" className="btn btn-sm" disabled={!configured} onClick={go}>Try again</button>
      )}
      {state === "connected" && (
        <span className="flex items-center gap-2">
          {provider === "instagram" && configured && (
            <button type="button" className="btn btn-sm btn-ghost" disabled={pending} onClick={sync}>{pending ? "Refreshing" : "Refresh"}</button>
          )}
          <button type="button" className="btn btn-sm" disabled={pending} onClick={disconnect} aria-label={`Disconnect ${name}`}>{pending ? "One moment" : "Disconnect"}</button>
        </span>
      )}
      {error && <span role="alert" className="text-xs alert-text">{error}</span>}
    </span>
  );
}
