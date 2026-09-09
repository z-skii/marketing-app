"use client";

import { useState, useTransition } from "react";
import { topUpCampaignCredit } from "./actions";

const PRESETS = [25, 50, 100, 250];

export function TopUpForm({ minCents, maxCents }: { minCents: number; maxCents: number }) {
  const [dollars, setDollars] = useState("50");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cents = Math.round(Number(dollars || 0) * 100);
  const valid = Number.isFinite(cents) && cents >= minCents && cents <= maxCents;

  return (
    <div className="mt-6">
      <p className="text-sm text-ink-soft">How much?</p>
      <div className="pill-row mt-2" role="group" aria-label="Preset amounts">
        {PRESETS.map((p) => (
          <button
            key={p} type="button" aria-pressed={dollars === String(p)} className="pill"
            onClick={() => setDollars(String(p))}
          >
            ${p}
          </button>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-3">
        <span className="font-display text-[1.75rem] font-800 tracking-[-0.03em] text-signal">$</span>
        <input
          className="field flex-1" inputMode="numeric" value={dollars}
          onChange={(e) => setDollars(e.target.value.replace(/[^0-9]/g, ""))}
          aria-label="Amount in dollars"
        />
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-signal">{error}</p>}
      <button
        type="button" disabled={pending || !valid} className="btn btn-signal btn-lg mt-4 w-full"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await topUpCampaignCredit(cents);
            if (result.ok && result.redirect) window.location.assign(result.redirect);
            else setError(("error" in result && result.error) || "Checkout couldn't start. Try again.");
          })}
      >
        {pending ? "Opening checkout" : `Add $${dollars || 0} with Stripe`}
      </button>
    </div>
  );
}
