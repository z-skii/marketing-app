"use client";

import { useTransition } from "react";
import { signOut } from "@/app/sign-in/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="btn btn-ghost w-full"
      onClick={() => startTransition(() => signOut())}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
