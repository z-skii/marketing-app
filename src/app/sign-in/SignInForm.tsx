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

      <PasswordField
        id="password"
        name="password"
        label="Password"
        autoComplete="current-password"
      />

      {state.error && (
        <p role="alert" className="text-sm text-signal">{state.error}</p>
      )}
      {resendState.notice && (
        <p role="status" className="text-sm text-rise">{resendState.notice}</p>
      )}
      {resendState.error && (
        <p role="alert" className="text-sm text-signal">{resendState.error}</p>
      )}

      <button type="submit" className="btn btn-signal btn-lg mt-2 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>

      {state.needsVerification && state.email && (
        <button
          type="submit"
          formAction={resend}
          disabled={resending}
          className="btn w-full"
        >
          {resending ? "Sending…" : "Resend verification email"}
        </button>
      )}

      <div className="mt-2 flex flex-col gap-3 text-sm text-ink-soft">
        <Link
          href="/reset"
          className="font-display font-600 text-ink-soft transition-colors hover:text-ink"
        >
          Forgot password?
        </Link>
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-display font-600 text-signal"
          >
            Create one
          </Link>
        </p>
      </div>
    </form>
  );
}
