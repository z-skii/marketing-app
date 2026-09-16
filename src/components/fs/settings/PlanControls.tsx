"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PlanKey } from "@/config/plans";
import { cancelPlan, choosePlan } from "@/app/(v2)/business/plan/actions";

/** The one button on the plan you are not on. Subscription only; campaign credit is never touched here. */
export function ChoosePlanButton({ businessId, plan, label, primary }: { businessId: string; plan: PlanKey; label: string; primary: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <button type="button" disabled={pending} className={`fs-btn ${primary ? "fs-btn-primary" : "fs-btn-secondary"}`} style={{ width: "100%" }}
        onClick={() => start(async () => { setError(null); const r = await choosePlan(businessId, plan); if (r && !r.ok) setError(r.error ?? "Something went wrong."); })}>
        {pending ? "One moment" : label}
      </button>
      {error && <p role="alert" className="fs-field-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}

/** Cancel is quiet and asks once. Campaigns and campaign credit stay; only the subscription stops. */
export function CancelPlanButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!confirm) return <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }} onClick={() => setConfirm(true)}>Cancel the plan</button>;
  return (
    <div className="fs-plane" style={{ borderLeft: "3px solid var(--fs-waiting)" }}>
      <p className="fs-t-body">Cancel the subscription? Your campaigns and campaign credit stay exactly as they are. Only the plan and its shoots stop.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <button type="button" disabled={pending} className="fs-btn fs-btn-secondary" onClick={() => start(async () => { setError(null); const r = await cancelPlan(businessId); if (!r.ok) setError(r.error ?? "Something went wrong."); else { setConfirm(false); router.refresh(); } })}>{pending ? "Cancelling" : "Yes, cancel the plan"}</button>
        <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" onClick={() => setConfirm(false)}>Keep it</button>
      </div>
      {error && <p role="alert" className="fs-field-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
