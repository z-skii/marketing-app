"use client";

import { useTransition } from "react";
import { signOut } from "@/app/sign-in/actions";

export function SignOutButton({ row = false }: { row?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={row ? "flex min-h-14 w-full items-center py-3 text-left font-display text-[1rem] font-600 text-ink-soft" : "btn btn-ghost w-full"}
      onClick={() => startTransition(() => signOut())}
    >
      {pending ? "Logging out" : "Log out"}
    </button>
  );
}
