"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestPayout } from "./actions";

export function PayoutButton({ availableCents, minCents }: { availableCents: number; minCents: number }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  if (availableCents <= 0 && !message) return null;

  return (
    <div>
      <button
        type="button"
        disabled={pending || availableCents < minCents}
        className="btn btn-signal w-full !py-3"
        onClick={() =>
          startTransition(async () => {
            const result = await requestPayout();
            setMessage(result.ok
              ? { ok: true, text: result.detail ?? "Requested." }
              : { ok: false, text: result.error ?? "Failed." });
            if (result.ok) router.refresh();
          })}
      >
        {pending ? "Requesting…" : "Request payout"}
      </button>
      {message && (
        <p role="alert" className={`mt-2 font-mono text-xs ${message.ok ? "text-rise" : "text-signal"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
