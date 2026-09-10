"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOut, CheckCircle } from "@phosphor-icons/react";
import type { GoogleFix } from "@/lib/google/fixes";
import { applyGoogleFix, disconnectGoogleAction } from "./actions";

/** Hands the browser to Google's consent screen and shows the wait. */
export function ConnectGoogleButton({ configured, label = "Connect Google" }: { configured: boolean; label?: string }) {
  const [leaving, setLeaving] = useState(false);
  if (leaving) {
    return (
      <p className="mt-5 flex items-center gap-2 text-[0.9375rem] text-ink-soft" aria-live="polite">
        <span className="live-dot" aria-hidden />Connecting to Google
      </p>
    );
  }
  return (
    <button
      type="button" className="btn btn-signal btn-lg mt-5 w-full" disabled={!configured}
      onClick={() => { setLeaving(true); window.location.assign("/api/oauth/google/start"); }}
    >
      {label}
    </button>
  );
}

/**
 * Fix Google: each fix as Current and Proposed with its own Approve. A tap
 * sends exactly that change; the answer is either "Updated on Google" or
 * the error Google gave back.
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
      const result = await applyGoogleFix(fix.key, fix.proposed!);
      setBusy(null);
      if (!result.ok) { setErrors((e) => ({ ...e, [fix.key]: result.error })); return; }
      setDone((d) => ({ ...d, [fix.key]: "Updated on Google" }));
      router.refresh();
    });
  };

  return (
    <ul className="mt-1 divide-y divide-rule" aria-label="Fixes">
      {fixes.map((fix, i) => (
        <li key={fix.key} className="reveal py-4" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
          <p className="font-display text-[1.0625rem] font-600">{fix.label}</p>
          <dl className="mt-2 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[0.9375rem]">
            <dt className="label pt-0.5">Current</dt>
            <dd className="min-w-0 break-words text-ink-soft">{fix.current ?? "Nothing on the listing"}</dd>
            <dt className="label pt-0.5">Proposed</dt>
            <dd className="min-w-0 break-words text-ink">{fix.proposed ?? "Nothing to propose yet"}</dd>
          </dl>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {done[fix.key] ? (
              <span className="pop flex items-center gap-1.5 font-display text-sm font-600 text-signal">
                <CheckCircle size={18} weight="fill" aria-hidden />{done[fix.key]}
              </span>
            ) : fix.canApply ? (
              <button type="button" className="btn btn-sm" disabled={!canEdit || busy !== null} onClick={() => approve(fix)}>
                {busy === fix.key ? "Sending to Google" : "Approve change"}
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-sm" disabled aria-disabled="true">Approve change</button>
                {fix.href && (
                  fix.href.startsWith("/")
                    ? <a href={fix.href} className="link-row text-sm">Open in TapMart</a>
                    : <a href={fix.href} target="_blank" rel="noreferrer" className="link-row text-sm">Open Google<ArrowSquareOut size={14} aria-hidden /></a>
                )}
              </>
            )}
          </div>
          {!fix.canApply && fix.reason && <p className="mt-2 text-sm text-ink-faint">{fix.reason}</p>}
          {errors[fix.key] && <p role="alert" className="mt-2 text-sm alert-text">{errors[fix.key]}</p>}
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
      <button
        type="button" className="btn btn-ghost w-full" disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const result = await disconnectGoogleAction();
            if (!result.ok) { setError(result.error); return; }
            router.push("/business/settings/connections");
            router.refresh();
          });
        }}
      >
        {pending ? "Disconnecting" : "Disconnect Google"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
    </div>
  );
}
