"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { connectInstagram, disconnectMyInstagram } from "./actions";

/** Hands the browser to Instagram (Facebook Login) and shows the wait. */
export function ConnectInstagramButton({ configured, returnTo, label = "Connect Instagram" }: { configured: boolean; returnTo: string | null; label?: string }) {
  const [leaving, setLeaving] = useState(false);
  const href = returnTo ? `/api/oauth/instagram-user/start?return=${encodeURIComponent(returnTo)}` : "/api/oauth/instagram-user/start";
  if (leaving) {
    return (
      <p className="mt-5 flex items-center gap-2 text-[0.9375rem] text-ink-soft" aria-live="polite">
        <span className="live-dot" aria-hidden />Connecting to Instagram
      </p>
    );
  }
  return (
    <button
      type="button" className="btn btn-signal btn-lg mt-5 w-full" disabled={!configured}
      onClick={() => { setLeaving(true); window.location.assign(href); }}
    >
      {label}
    </button>
  );
}

/** The manual path: a handle TapMart confirms by hand. Followers are optional and never shown until confirmed. */
export function ManualHandleForm({ returnTo, initialHandle, primary }: { returnTo: string | null; initialHandle: string | null; primary: boolean }) {
  const router = useRouter();
  const [handle, setHandle] = useState(initialHandle ?? "");
  const [followers, setFollowers] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await connectInstagram({ handle, followers, returnTo: returnTo ?? undefined });
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
      else router.refresh();
    });

  return (
    <form className="card mt-4 flex flex-col gap-4 p-4 md:p-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <p className="font-display text-[1.0625rem] font-700">Add your handle, TapMart will confirm it</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-soft">Instagram handle</span>
        <span className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-display font-700 text-ink-faint" aria-hidden>@</span>
          <input
            className="field w-full pl-9" value={handle} maxLength={60} autoCapitalize="none" autoCorrect="off" spellCheck={false}
            onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))} placeholder="yourhandle" inputMode="text"
          />
        </span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-soft">Followers <span className="text-ink-faint">(optional)</span></span>
        <input
          className="field" value={followers} inputMode="numeric" maxLength={10}
          onChange={(e) => setFollowers(e.target.value.replace(/[^\d]/g, ""))} placeholder="1850"
        />
        <span className="text-xs text-ink-faint">Shown only after TapMart confirms the handle.</span>
      </label>
      {error && <p role="alert" className="text-sm alert-text">{error}</p>}
      <button type="submit" disabled={pending || !handle.trim()} className={`btn btn-lg w-full ${primary ? "btn-signal" : ""}`}>
        {pending ? "Saving" : returnTo ? "Save and go back" : "Add my handle"}
      </button>
    </form>
  );
}

export function DisconnectButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button" disabled={pending} className="btn btn-ghost"
      onClick={() => startTransition(async () => { await disconnectMyInstagram(); router.refresh(); })}
    >
      {pending ? "Disconnecting" : "Disconnect"}
    </button>
  );
}
