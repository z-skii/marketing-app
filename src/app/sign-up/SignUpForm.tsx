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
      <div className="card mt-8 flex flex-col gap-4 p-5">
        <h2 className="font-display text-xl font-800 tracking-[-0.02em]">
          Check your email
        </h2>
        <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
          We sent a verification link to{" "}
          <span className="font-600 text-ink">{state.email}</span>. Open it to
          confirm this address, then sign in with your password. Check spam too.
        </p>
        {resendState.notice && (
          <p role="status" className="text-sm text-rise">{resendState.notice}</p>
        )}
        {resendState.error && (
          <p role="alert" className="text-sm text-signal">{resendState.error}</p>
        )}
        <form action={resend} className="flex flex-col gap-3">
          <input type="hidden" name="email" value={state.email ?? ""} />
          <button type="submit" className="btn w-full" disabled={resending}>
            {resending ? "Sending…" : "Resend email"}
          </button>
          <Link href="/sign-up" className="text-center font-display text-sm font-600 text-ink-soft transition-colors hover:text-ink">
            Change email
          </Link>
        </form>
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

      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm text-ink-soft">Username</label>
        <input
          id="username"
          name="username"
          type="text"
          required
          minLength={3}
          maxLength={24}
          pattern="[A-Za-z0-9_.]{3,24}"
          autoComplete="username"
          spellCheck={false}
          placeholder="yourname"
          className="field"
          defaultValue={state.username}
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
        <p role="alert" className="text-sm text-signal">{state.error}</p>
      )}

      <button type="submit" className="btn btn-signal btn-lg mt-2 w-full" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </button>

      <p className="mt-2 text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-display font-600 text-signal">
          Sign in
        </Link>
      </p>
    </form>
  );
}
