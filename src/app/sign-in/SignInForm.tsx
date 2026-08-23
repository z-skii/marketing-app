"use client";

import { useActionState } from "react";
import { requestCode, type SignInState } from "./actions";

const INITIAL: SignInState = { step: "email" };

/**
 * Email-link sign-in. The address gets a one-time link; clicking it lands on
 * /auth/confirm, which mints the session. There is no code entry: the emails
 * this project sends carry a link only.
 */
export function SignInForm({ next }: { next: string }) {
  const [state, submitEmail, sending] = useActionState(requestCode, INITIAL);

  if (state.step === "code") {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <h2 className="font-display text-2xl font-800 tracking-[-0.02em]">
          Check your email
        </h2>
        <p className="text-sm text-ink-soft">
          We sent a sign-in link to{" "}
          <span className="font-mono text-ink">{state.email}</span>. Click it and
          you&apos;ll be signed in here. It can take a minute to arrive — check
          spam too.
        </p>
        <form action={submitEmail}>
          <input type="hidden" name="email" value={state.email ?? ""} />
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="btn mt-2" disabled={sending}>
            {sending ? "Sending…" : "Send it again"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={submitEmail} className="mt-8 flex flex-col gap-3">
      <label htmlFor="email" className="eyebrow">
        Email
      </label>
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
      {state.error && (
        <p role="alert" className="font-mono text-xs text-signal">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn btn-signal mt-2" disabled={sending}>
        {sending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
