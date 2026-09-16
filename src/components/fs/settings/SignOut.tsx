"use client";

import { useRef, useState, useTransition } from "react";
import { signOut } from "@/app/sign-in/actions";

/**
 * Log out: the last row of Settings only opens a confirmation. The
 * destructive button lives inside the dialog and is named for what it
 * does. Nothing else on the account changes.
 */
export function SignOutRow({ asButton = false }: { asButton?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = () => {
    setError(null);
    start(async () => {
      try { await signOut(); }
      catch (e) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        setError("Could not log out. Try again.");
      }
    });
  };

  return (
    <>
      {asButton ? (
        <button type="button" className="fs-btn fs-btn-secondary" onClick={() => ref.current?.showModal()}>Log out</button>
      ) : (
        <ul className="fs-settings-group" style={{ marginTop: 24 }}>
          <li>
            <button type="button" className="fs-settings-row" onClick={() => ref.current?.showModal()}>
              <span><span className="fs-t-body" style={{ display: "block", fontWeight: 500, color: "var(--fs-problem)" }}>Log out</span><span className="fs-t-meta fs-settings-sub">Ends the session on this device only</span></span>
            </button>
          </li>
        </ul>
      )}
      <dialog ref={ref} className="fs-dialog" aria-labelledby="fs-logout-title" onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
        <p id="fs-logout-title" className="fs-t-section">Log out?</p>
        <p className="fs-t-body" style={{ marginTop: 8, color: "var(--fs-muted)" }}>You will need your email and password to sign back in on this device.</p>
        {error && <p role="alert" className="fs-field-error" style={{ marginTop: 8 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
          <button type="button" className="fs-btn fs-btn-primary" disabled={pending} onClick={run} style={{ background: "var(--fs-problem)" }}>{pending ? "Logging out" : "Log out"}</button>
          <button type="button" className="fs-btn fs-btn-secondary" onClick={() => ref.current?.close()}>Cancel</button>
        </div>
      </dialog>
    </>
  );
}
