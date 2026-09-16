"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { disconnectConnection, syncInstagramNow } from "@/app/(v2)/business/settings/connections/actions";

/**
 * The one action per connection. Connect and Reconnect hand the browser to
 * the provider's consent screen; while that redirect is in flight the row
 * says so. Disconnect and Refresh are server actions. Nothing here claims a
 * state the record does not hold.
 */
export type ControlProps = {
  provider: "google_business" | "instagram";
  name: string;
  state: "not_connected" | "connecting" | "connected" | "needs_reconnect" | "error";
  configured: boolean;
  startHref: string;
  resumeHref?: string;
};

export function ConnectionControls({ provider, name, state, configured, startHref, resumeHref }: ControlProps) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const go = () => { setError(null); setLeaving(true); window.location.assign(startHref); };
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    start(async () => { const r = await fn(); if (!r.ok) { setError(r.error ?? "Something went wrong."); return; } router.refresh(); });
  };

  if (leaving) return <span className="fs-t-meta" aria-live="polite" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span className="fs-live-dot" aria-hidden />Connecting to {name}</span>;

  return (
    <span className="fs-conn-actions">
      {state === "not_connected" && <button type="button" className="fs-btn fs-btn-secondary" disabled={!configured} onClick={go} aria-label={`Connect ${name}`}>Connect</button>}
      {(state === "needs_reconnect" || state === "error") && <button type="button" className="fs-btn fs-btn-primary" disabled={!configured} onClick={go} aria-label={`Reconnect ${name}`}>Reconnect</button>}
      {state === "connecting" && (resumeHref
        ? <a href={resumeHref} className="fs-btn fs-btn-primary">Pick a location</a>
        : <button type="button" className="fs-btn fs-btn-secondary" disabled={!configured} onClick={go}>Try again</button>)}
      {state === "connected" && (
        <>
          {provider === "instagram" && configured && <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" disabled={pending} onClick={() => act(syncInstagramNow)}>{pending ? "Refreshing" : "Refresh"}</button>}
          <button type="button" className="fs-btn fs-btn-secondary" disabled={pending} onClick={() => act(() => disconnectConnection(provider))} aria-label={`Disconnect ${name}`}>{pending ? "One moment" : "Disconnect"}</button>
        </>
      )}
      {error && <span role="alert" className="fs-field-error" style={{ flexBasis: "100%" }}>{error}</span>}
    </span>
  );
}
