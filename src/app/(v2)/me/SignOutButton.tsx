"use client";

import { useEffect, useState, useTransition } from "react";
import { SignOut } from "@phosphor-icons/react";
import { signOut } from "@/app/sign-in/actions";

/**
 * Log out. As a row it is the destructive item at the end of Settings and
 * only opens a confirmation; the destructive button lives in that sheet
 * (a bottom sheet on phone, a centred dialog on desktop).
 */
export function SignOutButton({ row = false }: { row?: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () => {
    setError(null);
    startTransition(async () => {
      try { await signOut(); }
      catch (e) {
        // A redirect surfaces as a thrown navigation; anything else is a real failure.
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        setError("Could not log out. Try again.");
      }
    });
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {row ? (
        <button
          type="button" onClick={() => setOpen(true)}
          className="row flex h-[58px] w-full items-center gap-3 px-[13px] text-left transition-[background,transform] duration-100 active:scale-[0.985] active:bg-alert/8"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-alert/10 text-alert"><SignOut size={20} aria-hidden /></span>
          <span className="font-display text-[14px] leading-[18px] font-700 text-alert">Log out</span>
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost w-full">Log out</button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/58 rail:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog" aria-modal="true" aria-labelledby="logout-title"
            onClick={(e) => e.stopPropagation()}
            className="sheet-enter w-full rounded-t-[22px] bg-surface p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] rail:w-[420px] rail:rounded-[22px] rail:pb-5"
          >
            <p id="logout-title" className="font-display text-[20px] leading-6 font-[780] tracking-[-0.3px]">Log out?</p>
            <p className="mt-2 text-[13px] leading-[18px] text-ink-soft">You will need your email and password to sign back in on this device.</p>
            {error && <p role="alert" className="mt-3 text-[13px] alert-text">{error}</p>}
            <div className="mt-5 flex flex-col gap-2.5 rail:flex-row-reverse">
              <button type="button" disabled={pending} onClick={run} className="btn w-full !bg-alert !text-alert-ink rail:flex-1">{pending ? "Logging out" : "Log out"}</button>
              <button type="button" onClick={() => setOpen(false)} className="btn w-full rail:flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
