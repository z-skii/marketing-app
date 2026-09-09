"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateIdeas } from "../actions";

/** Replaces the current ideas with a fresh set for this business. */
export function RefreshIdeasButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button" disabled={pending} className="btn btn-sm shrink-0"
        onClick={() => start(async () => {
          setError(null);
          const result = await regenerateIdeas(businessId);
          if (!result.ok) setError(result.error ?? "Could not refresh.");
          else router.refresh();
        })}
      >
        {pending ? "Refreshing…" : "Refresh ideas"}
      </button>
      {error && <span role="alert" className="text-sm text-signal">{error}</span>}
    </span>
  );
}
