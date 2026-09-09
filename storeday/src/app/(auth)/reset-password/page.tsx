"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorText, Field } from "@/components/ui/form";
import { PasswordInput } from "../auth-form";
import { resetPasswordAction } from "../actions";

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, null);
  return (
    <form action={formAction} className="card p-5 space-y-4">
      <div>
        <h1 className="text-[18px] font-semibold">Choose a new password</h1>
      </div>
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      <Field label="New password"><PasswordInput name="password" autoComplete="new-password" minLength={8} /></Field>
      <Field label="Confirm password"><PasswordInput name="confirm" autoComplete="new-password" minLength={8} /></Field>
      <Button type="submit" block size="lg" loading={pending}>Update password</Button>
    </form>
  );
}
