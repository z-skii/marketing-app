"use client";

import { useActionState } from "react";
import { requestCode, verifyCode, type SignInState } from "./actions";

const INITIAL: SignInState = { step: "email" };

/**
 * Email sign-in with two flows behind one form. The usual production flow
 * emails a one-time link; after sending, the visitor is told to click it and
 * offered a resend. When the flow hands back a code instead (the local
 * development shim, or an email template that carries one), a code input
 * appears and verifies right here.
 */
export function SignInForm({ next }: { next: string }) {
  const [state, submitEmail, sending] = useActionState(requestCode, INITIAL);
  const [codeState, submitCode, verifying] = useActionState(verifyCode, INITIAL);

  if (state.step === "code" && state.mode === "code") {
    return (
      <form action={submitCode} className="mt-8 flex flex-col gap-3">
        <input type="hidden" name="email" value={state.email ?? ""} />
        <input type="hidden" name="next" value={next} />
        <label htmlFor="code" className="eyebrow">
          Six-digit code
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          autoComplete="one-time-code"
          spellCheck={false}
          placeholder="000000"
          className="field !tracking-[0.4em]"
        />
        {state.notice && !codeState.error && (
          <p className="font-mono text-xs text-ink-faint">{state.notice}</p>
        )}
        {codeState.error && <ErrorText>{codeState.error}</ErrorText>}
        <button type="submit" className="btn btn-signal mt-2" disabled={verifying}>
          {verifying ? "Checking…" : "Continue"}
        </button>
      </form>
    );
  }

  if (state.step === "code") {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <h2 className="font-display text-2xl font-800 tracking-[-0.02em]">
          Check your email
        </h2>
        <p className="text-sm text-ink-soft">
          We sent a sign-in link to{" "}
          <span className="font-mono text-ink">{state.email}</span>. Click it and
          you&apos;ll be signed in here. It can take a minute to arrive. Check
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
      {state.error && <ErrorText>{state.error}</ErrorText>}
      <button type="submit" className="btn btn-signal mt-2" disabled={sending}>
        {sending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="font-mono text-xs text-signal">
      {children}
    </p>
  );
}
