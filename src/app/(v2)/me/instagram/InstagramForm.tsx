"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { connectInstagram, disconnectMyInstagram } from "./actions";

export function ConnectForm({ returnTo, initialHandle }: { returnTo: string | null; initialHandle: string | null }) {
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
    <form
      className="card mt-5 flex flex-col gap-4 p-4 md:p-5"
      onSubmit={(e) => { e.preventDefault(); submit(); }}
    >
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
        <span className="text-sm text-ink-soft">Followers</span>
        <input
          className="field" value={followers} inputMode="numeric" maxLength={10}
          onChange={(e) => setFollowers(e.target.value.replace(/[^\d]/g, ""))} placeholder="1850"
        />
        <span className="text-xs text-ink-faint">Story campaigns often set a minimum. This number decides which ones you can take.</span>
      </label>
      {error && <p role="alert" className="text-sm alert-text">{error}</p>}
      <button type="submit" disabled={pending || !handle.trim() || !followers} className="btn btn-signal btn-lg w-full">
        {pending ? "Saving…" : returnTo ? "Save and go back" : "Add Instagram"}
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
      {pending ? "Disconnecting…" : "Disconnect"}
    </button>
  );
}
