"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { runGoogleHealthAction } from "./actions";

/** Re-runs the Google checks and refreshes the screen with the new run. */
export function RunCheckButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button" className="btn w-full" disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const result = await runGoogleHealthAction();
            if (!result.ok) { setError(result.error); return; }
            router.refresh();
          });
        }}
      >
        <ArrowsClockwise size={18} aria-hidden />
        {pending ? "Checking" : "Run the check again"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
    </div>
  );
}
