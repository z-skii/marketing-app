"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type ResetRequestState } from "./actions";

const INITIAL: ResetRequestState = { step: "form" };

export function ResetRequestForm() {
  const [state, submit, pending] = useActionState(requestPasswordReset, INITIAL);

  if (state.step === "sent") {
    return (
      <div className="card mt-8 flex flex-col gap-4 p-5">
        <h2 className="font-display text-xl font-800 tracking-[-0.02em]">
          Check your email
        </h2>
        <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
          If an account exists for{" "}
          <span className="font-600 text-ink">{state.email}</span>, a password
          reset link is on its way. Open it and choose a new password.
        </p>
        <Link href="/sign-in" className="btn w-full">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={submit} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm text-ink-soft">Email</label>
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
        <p role="alert" className="text-sm text-signal">{state.error}</p>
      )}
      <button type="submit" className="btn btn-signal btn-lg mt-2 w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className="mt-2 text-sm text-ink-soft">
        Remembered it?{" "}
        <Link href="/sign-in" className="font-display font-600 text-signal">
          Sign in
        </Link>
      </p>
    </form>
  );
}
