"use client";
import { useActionState, useEffect, useRef, useSyncExternalStore } from "react";
import { Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { changePasswordAction, updateProfileAction } from "@/app/(app)/my/actions";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const toast = useToast();
  const [state, action, pending] = useActionState(updateProfileAction, null);
  useEffect(() => { if (state?.ok) toast.push("Saved", "success"); }, [state, toast]);
  return (
    <form action={action} className="space-y-3">
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      <Field label="Name"><Input name="full_name" required defaultValue={fullName} autoComplete="name" /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Phone"><Input name="phone" type="tel" defaultValue={phone} autoComplete="tel" /></Field>
        <Field label="Email" hint="sign-in"><Input value={email} readOnly disabled /></Field>
      </div>
      <Button type="submit" variant="secondary" loading={pending}>Save</Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(changePasswordAction, null);
  useEffect(() => { if (state?.ok) { toast.push("Password updated", "success"); formRef.current?.reset(); } }, [state, toast]);
  return (
    <form ref={formRef} action={action} className="space-y-3">
      <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="New password" hint="8+ characters"><Input name="password" type="password" required minLength={8} autoComplete="new-password" /></Field>
        <Field label="Confirm"><Input name="confirm" type="password" required minLength={8} autoComplete="new-password" /></Field>
      </div>
      <Button type="submit" variant="secondary" loading={pending}>Change password</Button>
    </form>
  );
}

const noSubscribe = () => () => {};
const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);

/** Shown only in a regular browser tab (not when already installed as a PWA). */
export function AddToHomeScreenHint() {
  // Server renders nothing (standalone = true); the client corrects after hydration.
  const standalone = useSyncExternalStore(noSubscribe, isStandalone, () => true);
  const ios = useSyncExternalStore(noSubscribe, isIos, () => false);
  if (standalone) return null;
  return (
    <div className="rounded-md border border-border bg-surface-2/60 px-3 py-2.5 text-[13px]">
      <div className="flex items-center gap-2 font-medium"><Smartphone className="h-4 w-4 text-accent" />Add Storeday to your home screen</div>
      <p className="mt-1 text-text-2">
        {ios
          ? <>In Safari tap <Share className="inline h-3.5 w-3.5 align-text-bottom" /> Share, then <b>Add to Home Screen</b>. Clocking in is one tap from there.</>
          : <>Open the browser menu (⋮) and choose <b>Add to Home screen</b> or <b>Install app</b>. Clocking in is one tap from there.</>}
      </p>
    </div>
  );
}
