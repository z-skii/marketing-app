"use client";

import Link from "next/link";
import { useActionState } from "react";
import { PasswordField } from "@/components/PasswordField";
import {
  resendVerification,
  signInWithPassword,
  type AuthFormState,
} from "./actions";

const INITIAL: AuthFormState = {};

/** Email + password sign-in, with recovery paths one tap away. */
export function SignInForm({ next }: { next: string }) {
  const [state, submit, pending] = useActionState(signInWithPassword, INITIAL);
  const [resendState, resend, resending] = useActionState(resendVerification, INITIAL);

  return (
    <form action={submit} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
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
        autoComplete="current-password"
      />

      {state.error && (
        <p role="alert" className="font-mono text-xs text-signal">{state.error}</p>
      )}
      {resendState.notice && (
        <p role="status" className="font-mono text-xs text-rise">{resendState.notice}</p>
      )}
      {resendState.error && (
        <p role="alert" className="font-mono text-xs text-signal">{resendState.error}</p>
      )}

      <button type="submit" className="btn btn-signal mt-1" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {state.needsVerification && state.email && (
        <button
          type="submit"
          formAction={resend}
          disabled={resending}
          className="btn btn-ghost"
        >
          {resending ? "Sending…" : "Resend verification email"}
        </button>
      )}

      <div className="mt-2 flex flex-col gap-2 border-t border-rule pt-4">
        <Link
          href="/reset"
          className="font-mono text-xs text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
        >
          Forgot password?
        </Link>
        <p className="font-mono text-xs text-ink-soft">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-signal underline underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </div>
    </form>
  );
}
