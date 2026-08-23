"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordField } from "@/components/PasswordField";
import { createAccount, resendSignUpEmail, type SignUpState } from "./actions";

const INITIAL: SignUpState = { step: "form" };

export function SignUpForm() {
  const [state, submit, pending] = useActionState(createAccount, INITIAL);
  const [resendState, resend, resending] = useActionState(resendSignUpEmail, INITIAL);

  if (state.step === "sent") {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <h2 className="font-display text-2xl font-800 tracking-[-0.02em]">
          Check your email
        </h2>
        <p className="text-sm text-ink-soft">
          We sent a verification link to{" "}
          <span className="font-mono text-ink">{state.email}</span>. Click it to
          confirm this address, then sign in with your password. Check spam too.
        </p>
        {resendState.notice && (
          <p role="status" className="font-mono text-xs text-rise">{resendState.notice}</p>
        )}
        {resendState.error && (
          <p role="alert" className="font-mono text-xs text-signal">{resendState.error}</p>
        )}
        <div className="flex flex-wrap gap-3">
          <form action={resend}>
            <input type="hidden" name="email" value={state.email ?? ""} />
            <button type="submit" className="btn btn-ghost !py-2.5" disabled={resending}>
              {resending ? "Sending…" : "Resend email"}
            </button>
          </form>
          <Link href="/sign-up" className="btn btn-ghost !py-2.5">
            Change email
          </Link>
        </div>
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

      <PasswordField
        id="password"
        name="password"
        label="Password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <PasswordField
        id="confirm"
        name="confirm"
        label="Confirm password"
        autoComplete="new-password"
        placeholder="Same password again"
      />

      {state.error && (
        <p role="alert" className="font-mono text-xs text-signal">{state.error}</p>
      )}

      <button type="submit" className="btn btn-signal mt-1" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </button>

      <p className="mt-2 border-t border-rule pt-4 font-mono text-xs text-ink-soft">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-signal underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
