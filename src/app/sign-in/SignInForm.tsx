"use client";

import { useActionState } from "react";
import { requestCode, verifyCode, type SignInState } from "./actions";

const INITIAL: SignInState = { step: "email" };

export function SignInForm({ next }: { next: string }) {
  const [emailState, submitEmail, sendingEmail] = useActionState(requestCode, INITIAL);
  const [codeState, submitCode, verifying] = useActionState(verifyCode, INITIAL);

  const state = codeState.step === "code" || codeState.error ? codeState : emailState;
  const onCodeStep = emailState.step === "code";

  if (!onCodeStep) {
    return (
      <form action={submitEmail} className="mt-8 flex flex-col gap-3">
        <label htmlFor="email" className="eyebrow">Email</label>
        <input
          id="email" name="email" type="email" required autoComplete="email"
          inputMode="email" spellCheck={false} placeholder="you@example.com" className="field"
          defaultValue={emailState.email}
        />
        {emailState.error && <ErrorText>{emailState.error}</ErrorText>}
        <button type="submit" className="btn btn-signal mt-2" disabled={sendingEmail}>
          {sendingEmail ? "Sending\u2026" : "Send code"}
        </button>
      </form>
    );
  }

  return (
    <form action={submitCode} className="mt-8 flex flex-col gap-3">
      <input type="hidden" name="email" value={emailState.email ?? ""} />
      <input type="hidden" name="next" value={next} />
      <label htmlFor="code" className="eyebrow">Six-digit code</label>
      <input
        id="code" name="code" inputMode="numeric" pattern="\d{6}" maxLength={6}
        required autoComplete="one-time-code" spellCheck={false} placeholder="000000"
        className="field !tracking-[0.4em]"
      />
      {emailState.notice && !state.error && (
        <p className="font-mono text-xs text-ink-faint">{emailState.notice}</p>
      )}
      {state.error && <ErrorText>{state.error}</ErrorText>}
      <button type="submit" className="btn btn-signal mt-2" disabled={verifying}>
        {verifying ? "Checking\u2026" : "Continue"}
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
