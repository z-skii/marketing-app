"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PlanKey } from "@/config/plans";
import { cancelPlan, choosePlan } from "./actions";

/** The one button on each plan card, and the quiet cancel underneath. */

export function ChoosePlanButton({
  businessId, plan, label, current, primary,
}: { businessId: string; plan: PlanKey; label: string; current: boolean; primary: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (current) {
    return <p className="mt-5 font-display text-sm font-700 text-signal">Current plan</p>;
  }
  return (
    <div className="mt-5">
      <button
        type="button" disabled={pending} className={`btn btn-lg w-full ${primary ? "btn-signal" : ""}`}
        onClick={() => start(async () => {
          setError(null);
          const result = await choosePlan(businessId, plan);
          if (result && !result.ok) setError(result.error ?? "Something went wrong.");
        })}
      >
        {pending ? "One moment…" : label}
      </button>
      {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
    </div>
  );
}

export function CancelPlanButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!confirm) {
    return <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(true)}>Cancel plan</button>;
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-ink-soft">Your campaigns and credit stay. Only the plan stops.</span>
      <button
        type="button" disabled={pending} className="btn btn-sm"
        onClick={() => start(async () => {
          setError(null);
          const result = await cancelPlan(businessId);
          if (!result.ok) setError(result.error ?? "Something went wrong.");
          else { setConfirm(false); router.refresh(); }
        })}
      >
        {pending ? "Cancelling…" : "Yes, cancel"}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>Keep it</button>
      {error && <span role="alert" className="text-sm alert-text">{error}</span>}
    </span>
  );
}
