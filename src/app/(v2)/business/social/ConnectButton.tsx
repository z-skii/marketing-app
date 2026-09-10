"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestConnection } from "../actions";

/**
 * Asks TapMart to connect a platform. Real OAuth is not switched on yet, so
 * the request is recorded as pending and the row shows "Requested" after.
 */
export function ConnectButton({ businessId, provider, label }: { businessId: string; provider: string; label: "Connect" | "Reconnect" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex shrink-0 flex-col items-end">
      <button
        type="button" disabled={pending} className="btn btn-sm"
        aria-label={`${label} ${provider.replace("_", " ")}`}
        onClick={() => {
          setError(null);
          start(async () => {
            const result = await requestConnection(businessId, provider);
            if (!result.ok) { setError(result.error ?? "Could not request that."); return; }
            router.refresh();
          });
        }}
      >
        {pending ? "Requesting" : label}
      </button>
      {error && <span role="alert" className="mt-1 text-xs alert-text">{error}</span>}
    </span>
  );
}
