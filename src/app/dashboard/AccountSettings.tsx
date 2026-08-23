"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUsername } from "./actions";

/**
 * The one account setting that exists today: the public username. Validation
 * and uniqueness are enforced server-side; this just gives clear feedback.
 */
export function AccountSettings({ username }: { username: string }) {
  const router = useRouter();
  const [value, setValue] = useState(username);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await updateUsername(value);
      if (result.ok) {
        setMessage({ tone: "ok", text: `You are @${result.username} now.` });
        router.refresh();
      } else {
        setMessage({ tone: "bad", text: result.error });
      }
    });

  return (
    <section aria-labelledby="account-heading" className="rule mt-10 pt-6">
      <h2 id="account-heading" className="eyebrow">Account</h2>
      <div className="mt-4 flex max-w-md flex-col gap-2">
        <label htmlFor="username-edit" className="eyebrow">Username</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-sm text-ink-faint"
            >
              @
            </span>
            <input
              id="username-edit"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setMessage(null);
              }}
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_.]{3,24}"
              autoComplete="username"
              spellCheck={false}
              className="field !pl-8"
            />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={pending || value === username}
            className="btn !min-h-0 !px-5"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
        <p className="font-mono text-[0.625rem] text-ink-faint">
          3-24 characters: letters, numbers, underscore, period. Shown everywhere
          instead of your email.
        </p>
        {message && (
          <p
            role={message.tone === "ok" ? "status" : "alert"}
            className={`font-mono text-xs ${message.tone === "ok" ? "text-rise" : "text-signal"}`}
          >
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
