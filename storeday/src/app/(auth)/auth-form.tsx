"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input } from "@/components/ui/form";
import type { ActionResult } from "@/lib/action-result";

type Action = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

export function PasswordInput({ name, placeholder, autoComplete, minLength }: { name: string; placeholder?: string; autoComplete?: string; minLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input name={name} type={show ? "text" : "password"} placeholder={placeholder} autoComplete={autoComplete} minLength={minLength} required className="pr-9" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-3 hover:text-text" aria-label="Show password">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function SignInForm({ action, next, error }: { action: Action; next?: string; error?: string }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="card p-5 space-y-4">
      <div>
        <h1 className="text-[18px] font-semibold">Sign in</h1>
        <p className="text-[13px] text-text-3">Welcome back.</p>
      </div>
      <ErrorText>{state && !state.ok ? state.error : error}</ErrorText>
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email"><Input name="email" type="email" autoComplete="email" required autoFocus /></Field>
      <Field label="Password"><PasswordInput name="password" autoComplete="current-password" /></Field>
      <Button type="submit" block size="lg" loading={pending}>Sign in</Button>
      <div className="flex justify-between text-[12.5px] text-text-3">
        <Link href="/forgot-password" className="hover:text-text">Forgot password?</Link>
        <Link href={`/sign-up${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="hover:text-text">Create account</Link>
      </div>
    </form>
  );
}

export function SignUpForm({ action, next, invitedEmail, title, subtitle }: { action: Action; next?: string; invitedEmail?: string; title?: string; subtitle?: string }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="card p-5 space-y-4">
      <div>
        <h1 className="text-[18px] font-semibold">{title ?? "Create your account"}</h1>
        <p className="text-[13px] text-text-3">{subtitle ?? "Then set up your business in a couple of minutes."}</p>
      </div>
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Your name"><Input name="full_name" autoComplete="name" required autoFocus /></Field>
      <Field label="Email"><Input name="email" type="email" autoComplete="email" required defaultValue={invitedEmail} readOnly={!!invitedEmail} /></Field>
      <Field label="Password" hint="min 8 characters"><PasswordInput name="password" autoComplete="new-password" minLength={8} /></Field>
      <Button type="submit" block size="lg" loading={pending}>Create account</Button>
      <p className="text-[12.5px] text-text-3 text-center">Already have an account? <Link href={`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-text hover:underline">Sign in</Link></p>
    </form>
  );
}
