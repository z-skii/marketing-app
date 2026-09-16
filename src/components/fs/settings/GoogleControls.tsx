"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOut, MapPin } from "@phosphor-icons/react";
import type { GoogleFix } from "@/lib/google/fixes";
import { applyGoogleFix, disconnectGoogleAction, runGoogleHealthAction } from "@/app/(v2)/business/google/actions";
import { chooseGoogleLocation } from "@/app/(v2)/business/settings/connections/actions";

/** Hands the browser to Google's consent screen and shows the wait. */
export function ConnectGoogleButton({ configured, label = "Connect Google Business" }: { configured: boolean; label?: string }) {
  const [leaving, setLeaving] = useState(false);
  if (leaving) return <p className="fs-t-body" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}><span className="fs-live-dot" aria-hidden />Connecting to Google</p>;
  return (
    configured
      ? <a href="/api/oauth/google/start" className="fs-btn fs-btn-primary" style={{ marginTop: 16 }} onClick={() => setLeaving(true)}>{label}</a>
      : <button type="button" className="fs-btn fs-btn-primary" style={{ marginTop: 16 }} disabled aria-disabled="true">{label}</button>
  );
}

/** Re-reads the listing from Google and stores the run. */
export function RunCheckButton({ first = false }: { first?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button type="button" className={`fs-btn ${first ? "fs-btn-primary" : "fs-btn-secondary"}`} disabled={pending} onClick={() => { setError(null); start(async () => { const r = await runGoogleHealthAction(); if (!r.ok) { setError(r.error); return; } router.refresh(); }); }}>
        {pending ? "Reading your listing" : first ? "Read my listing" : "Read it again"}
      </button>
      {error && <p role="alert" className="fs-field-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}

/**
 * Fix Google: each fix as Current and Proposed with its own Approve. One tap
 * sends exactly that change; the answer is "Updated on Google" or the error
 * Google returned. Nothing changes on Google without the tap.
 */
export function FixList({ fixes, canEdit }: { fixes: GoogleFix[]; canEdit: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [, start] = useTransition();

  const approve = (fix: GoogleFix) => {
    if (!fix.proposed) return;
    setBusy(fix.key);
    setErrors((e) => ({ ...e, [fix.key]: "" }));
    start(async () => {
      const r = await applyGoogleFix(fix.key, fix.proposed!);
      setBusy(null);
      if (!r.ok) { setErrors((e) => ({ ...e, [fix.key]: r.error })); return; }
      setDone((d) => ({ ...d, [fix.key]: "Updated on Google" }));
      router.refresh();
    });
  };

  return (
    <ul className="fs-plain-list" aria-label="Fixes" style={{ marginTop: 8 }}>
      {fixes.map((fix) => (
        <li key={fix.key} className="fs-plane" style={{ marginTop: 12 }}>
          <p className="fs-t-task">{fix.label}</p>
          <dl className="fs-facts" style={{ marginTop: 8 }}>
            <div style={{ display: "contents" }}><dt>On Google now</dt><dd>{fix.current ?? "Nothing on the listing"}</dd></div>
            <div style={{ display: "contents" }}><dt>Proposed</dt><dd>{fix.proposed ?? "Nothing to propose yet"}</dd></div>
          </dl>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 12 }}>
            {done[fix.key] ? <span className="fs-status is-confirmed">{done[fix.key]}</span>
              : fix.canApply ? <button type="button" className="fs-btn fs-btn-primary fs-btn-sm" disabled={!canEdit || busy !== null} onClick={() => approve(fix)}>{busy === fix.key ? "Sending to Google" : "Approve this change"}</button>
              : fix.href ? (fix.href.startsWith("/")
                ? <a href={fix.href} className="fs-btn fs-btn-secondary fs-btn-sm">Change it in TapMart</a>
                : <a href={fix.href} target="_blank" rel="noreferrer" className="fs-btn fs-btn-secondary fs-btn-sm">Change it on Google <ArrowSquareOut size={16} aria-hidden /></a>)
              : null}
          </div>
          {!fix.canApply && fix.reason && <p className="fs-t-meta" style={{ marginTop: 8 }}>{fix.reason}</p>}
          {errors[fix.key] && <p role="alert" className="fs-field-error" style={{ marginTop: 8 }}>{errors[fix.key]}</p>}
        </li>
      ))}
    </ul>
  );
}

export function DisconnectGoogleButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }} disabled={pending} onClick={() => { setError(null); start(async () => { const r = await disconnectGoogleAction(); if (!r.ok) { setError(r.error); return; } router.push("/business/settings/connections"); router.refresh(); }); }}>
        {pending ? "Disconnecting" : "Disconnect Google"}
      </button>
      {error && <p role="alert" className="fs-field-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}

export type PickerLocation = { name: string; title: string; address: string | null };

/** Google listed more than one location: the business picks the one TapMart manages. */
export function LocationPicker({ locations }: { locations: PickerLocation[] }) {
  const router = useRouter();
  const [choosing, setChoosing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const choose = (name: string) => {
    setError(null); setChoosing(name);
    start(async () => { const r = await chooseGoogleLocation(name); if (!r.ok) { setError(r.error); setChoosing(null); return; } router.push("/business/google?connected=1"); router.refresh(); });
  };
  return (
    <div>
      <ul className="fs-plain-list" aria-label="Locations" style={{ marginTop: 16 }}>
        {locations.map((l) => (
          <li key={l.name} className="fs-conn-row">
            <MapPin size={24} aria-hidden style={{ color: "var(--fs-muted)" }} />
            <span style={{ minWidth: 0 }}>
              <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>{l.title}</span>
              {l.address && <span className="fs-t-meta" style={{ display: "block" }}>{l.address}</span>}
            </span>
            <span className="fs-conn-actions">
              {choosing === l.name && pending
                ? <span className="fs-t-meta" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span className="fs-live-dot" aria-hidden />Connecting</span>
                : <button type="button" className="fs-btn fs-btn-primary fs-btn-sm" disabled={pending} onClick={() => choose(l.name)}>Use this location</button>}
            </span>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="fs-field-error" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  );
}
