"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addManualSnapshotAction } from "./actions";

/**
 * Four numbers the business types in itself for the current period. Stored
 * as a manual snapshot and always shown as "Entered by you".
 */
export function ManualGrowthForm({ periodStart, periodEnd }: { periodStart: string; periodEnd: string }) {
  const router = useRouter();
  const [reach, setReach] = useState("");
  const [followers, setFollowers] = useState("");
  const [views, setViews] = useState("");
  const [engagement, setEngagement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toNumber = (v: string): number | null => {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t.replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  return (
    <form
      className="card mt-4 p-4 md:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const result = await addManualSnapshotAction({
            provider: "instagram",
            periodStart,
            periodEnd,
            reach: toNumber(reach),
            followersDelta: toNumber(followers),
            views: toNumber(views),
            engagementPct: toNumber(engagement),
          });
          if (!result.ok) { setError(result.error); return; }
          router.refresh();
        });
      }}
    >
      <p className="eyebrow">Entered by you</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Reach" value={reach} onChange={setReach} placeholder="0" />
        <Field label="Followers change" value={followers} onChange={setFollowers} placeholder="+0" signed />
        <Field label="Views" value={views} onChange={setViews} placeholder="0" />
        <Field label="Engagement %" value={engagement} onChange={setEngagement} placeholder="0.0" decimal />
      </div>
      <button type="submit" className="btn mt-4 w-full" disabled={pending}>
        {pending ? "Saving" : "Save this month"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
    </form>
  );
}

function Field({
  label, value, onChange, placeholder, signed, decimal,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string; signed?: boolean; decimal?: boolean }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="font-display text-sm font-600 text-ink-soft">{label}</span>
      <input
        className="field tnum" type="text" inputMode={decimal || signed ? "text" : "numeric"}
        pattern={signed ? "[+\\-]?[0-9,]*" : decimal ? "[0-9]*[.,]?[0-9]*" : "[0-9,]*"}
        placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
