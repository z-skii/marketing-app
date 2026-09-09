"use client";

import { useTransition } from "react";
import { switchContext } from "@/app/(v2)/mode/actions";

/** Back to yourself: the earning marketplace. */
export function SwitchToPersonalButton() {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} className="btn w-full" onClick={() => start(() => switchContext("personal"))}>
      {pending ? "Switching…" : "Switch to personal"}
    </button>
  );
}
