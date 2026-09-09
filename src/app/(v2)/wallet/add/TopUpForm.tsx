"use client";

import { useState, useTransition } from "react";
import { topUpWallet } from "@/app/dashboard/actions";

const PRESETS = [25, 50, 100, 250];

export function TopUpForm({ minCents, maxCents }: { minCents: number; maxCents: number }) {
  const [dollars, setDollars] = useState("50");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cents = Math.round(Number(dollars || 0) * 100);
  const valid = Number.isFinite(cents) && cents >= minCents && cents <= maxCents;

  return (
    <div className="mt-5">
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p} type="button" aria-pressed={dollars === String(p)}
            onClick={() => setDollars(String(p))}
            className={`border px-2 py-3 font-display text-lg font-800 ${
              dollars === String(p) ? "border-signal text-signal" : "border-rule hover:border-ink"
            }`}
          >
            ${p}
          </button>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-2">
        <span className="font-display text-xl font-800">$</span>
        <input
          className="field flex-1" inputMode="numeric" value={dollars}
          onChange={(e) => setDollars(e.target.value.replace(/[^0-9]/g, ""))}
          aria-label="Amount in dollars"
        />
      </label>
      {error && <p role="alert" className="mt-2 font-mono text-xs text-signal">{error}</p>}
      <button
        type="button" disabled={pending || !valid} className="btn btn-signal mt-4 w-full !py-3.5"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await topUpWallet(cents);
            if (result.ok && result.redirect) window.location.assign(result.redirect);
            else setError(("error" in result && result.error) || "Checkout couldn't start — try again.");
          })}
      >
        {pending ? "Opening checkout…" : `Add $${dollars || 0} with Stripe`}
      </button>
    </div>
  );
}
