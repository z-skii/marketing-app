"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestPayout } from "./actions";

export function PayoutButton({ enabled, minimumLabel }: { enabled: boolean; minimumLabel: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-5">
      <button
        type="button" className="btn" disabled={!enabled || pending || done}
        onClick={() => startTransition(async () => {
          const result = await requestPayout();
          if (result.ok) { setDone(true); router.refresh(); } else setError(result.error);
        })}
      >
        {done ? "Requested" : pending ? "…" : "Request payout"}
      </button>
      <p className="mt-2 font-mono text-xs text-ink-faint">
        {done ? "We'll be in touch once it's processed." : `Minimum ${minimumLabel}.`}
      </p>
      {error && <p role="alert" className="mt-2 font-mono text-xs text-signal">{error}</p>}
    </div>
  );
}
