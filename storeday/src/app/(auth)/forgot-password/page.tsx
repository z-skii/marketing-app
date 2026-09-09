"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input } from "@/components/ui/form";
import { forgotPasswordAction } from "../actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, null);
  if (state?.ok) {
    return (
      <div className="card p-5 space-y-3">
        <h1 className="text-[18px] font-semibold">Check your email</h1>
        <p className="text-[13.5px] text-text-2">If an account exists for that address, we sent a link to reset your password.</p>
        <Link href="/sign-in" className="text-[13px] text-accent">Back to sign in</Link>
      </div>
    );
  }
  return (
    <form action={formAction} className="card p-5 space-y-4">
      <div>
        <h1 className="text-[18px] font-semibold">Reset your password</h1>
        <p className="text-[13px] text-text-3">We&apos;ll email you a reset link.</p>
      </div>
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      <Field label="Email"><Input name="email" type="email" autoComplete="email" required autoFocus /></Field>
      <Button type="submit" block size="lg" loading={pending}>Send reset link</Button>
      <p className="text-[12.5px] text-text-3 text-center"><Link href="/sign-in" className="hover:text-text">Back to sign in</Link></p>
    </form>
  );
}
