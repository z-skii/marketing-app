"use client";
import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorText } from "@/components/ui/form";
import { resendVerificationAction } from "../actions";
import { Suspense } from "react";

function VerifyEmailInner() {
  const sp = useSearchParams();
  const email = sp.get("email") ?? "";
  const [state, formAction, pending] = useActionState(resendVerificationAction, null);
  return (
    <div className="card p-5 space-y-4">
      <h1 className="text-[18px] font-semibold">Verify your email</h1>
      <p className="text-[13.5px] text-text-2">We sent a confirmation link to <b>{email || "your email"}</b>. Open it to activate your account, then sign in.</p>
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      {state?.ok && <p className="text-[13px] text-success">Sent. Check your inbox (and spam).</p>}
      <form action={formAction}>
        <input type="hidden" name="email" value={email} />
        <Button type="submit" variant="secondary" block loading={pending}>Resend email</Button>
      </form>
      <p className="text-[12.5px] text-text-3 text-center"><Link href="/sign-in" className="hover:text-text">Back to sign in</Link></p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailInner /></Suspense>;
}
