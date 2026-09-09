"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  decideCreatorVerification, decidePayout, decideVehicleVerification,
  resolveReport, setPlatformFee,
} from "./actions";

type Result = { ok: boolean; error?: string };

export function MarketAdminControls({
  kind, id,
}: { kind: "creator" | "vehicle" | "payout" | "report"; id: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<Result>) =>
    startTransition(async () => {
      setError(null);
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Failed.");
      else router.refresh();
    });

  const pair: [string, () => Promise<Result>, string, () => Promise<Result>] =
    kind === "creator"
      ? ["Verify", () => decideCreatorVerification(id, true, note), "Reject", () => decideCreatorVerification(id, false, note)]
      : kind === "vehicle"
        ? ["Verify", () => decideVehicleVerification(id, true, note), "Reject", () => decideVehicleVerification(id, false, note)]
        : kind === "payout"
          ? ["Mark paid", () => decidePayout(id, true), "Reject", () => decidePayout(id, false)]
          : ["Resolve", () => resolveReport(id, false), "Dismiss", () => resolveReport(id, true)];

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} className="btn btn-signal !min-h-0 !px-3 !py-1.5 !text-[0.625rem]" onClick={() => run(pair[1])}>
        {pair[0]}
      </button>
      <button type="button" disabled={pending} className="btn btn-ghost !min-h-0 !px-3 !py-1.5 !text-[0.625rem]" onClick={() => run(pair[3])}>
        {pair[2]}
      </button>
      {(kind === "creator" || kind === "vehicle") && (
        <input
          className="field !min-h-0 !w-48 !px-2 !py-1 !text-xs" maxLength={500} value={note}
          onChange={(e) => setNote(e.target.value)} placeholder="Note (sent on reject)"
          aria-label="Verification note"
        />
      )}
      {error && <p role="alert" className="font-mono text-[0.625rem] text-signal">{error}</p>}
    </div>
  );
}

export function FeeControl({ current }: { current: number }) {
  const router = useRouter();
  const [pct, setPct] = useState(String(current));
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        className="field !min-h-0 !w-20 !px-2 !py-1.5 !text-sm" inputMode="numeric" value={pct}
        onChange={(e) => { setPct(e.target.value.replace(/\D/g, "")); setSaved(false); }}
        aria-label="Platform fee percent"
      />
      <span className="font-mono text-xs text-ink-faint">% taken from earnings</span>
      <button
        type="button" disabled={pending} className="btn !min-h-0 !px-3 !py-1.5 !text-[0.625rem]"
        onClick={() => startTransition(async () => {
          const result = await setPlatformFee(Number(pct));
          if (result.ok) { setSaved(true); router.refresh(); }
        })}
      >
        Save
      </button>
      {saved && <span className="font-mono text-[0.625rem] text-rise">saved</span>}
    </div>
  );
}
