"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type ResetRequestState } from "./actions";

const INITIAL: ResetRequestState = { step: "form" };

export function ResetRequestForm() {
  const [state, submit, pending] = useActionState(requestPasswordReset, INITIAL);

  if (state.step === "sent") {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <h2 className="font-display text-2xl font-800 tracking-[-0.02em]">
          Check your email
        </h2>
        <p className="text-sm text-ink-soft">
          If an account exists for{" "}
          <span className="font-mono text-ink">{state.email}</span>, a password
          reset link is on its way. Click it and choose a new password.
        </p>
        <Link href="/sign-in" className="btn btn-ghost self-start !py-2.5">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={submit} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="eyebrow">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder="you@example.com"
          className="field"
          defaultValue={state.email}
        />
      </div>
      {state.error && (
        <p role="alert" className="font-mono text-xs text-signal">{state.error}</p>
      )}
      <button type="submit" className="btn btn-signal mt-1" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="mt-2 border-t border-rule pt-4 font-mono text-xs text-ink-soft">
        Remembered it?{" "}
        <Link href="/sign-in" className="text-signal underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
