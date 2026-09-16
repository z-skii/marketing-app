"use client";

import { useState, useTransition } from "react";
import { topUpCampaignCredit } from "@/app/(v2)/business/billing/actions";
import { formatMoney } from "@/components/fs/parts";

const PRESETS = [2500, 5000, 10000, 25000];

/** Add campaign credit through Stripe. The amount is chosen here; the card is taken on Stripe's page. */
export function TopUpForm({ minCents, maxCents }: { minCents: number; maxCents: number }) {
  const [dollars, setDollars] = useState("50");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cents = Math.round(Number(dollars || 0) * 100);
  const valid = Number.isFinite(cents) && cents >= minCents && cents <= maxCents;
  return (
    <div style={{ marginTop: 12 }}>
      <p className="fs-t-label">How much credit</p>
      <ul className="fs-chips" role="group" aria-label="Preset amounts">
        {PRESETS.filter((p) => p >= minCents && p <= maxCents).map((p) => (
          <li key={p}><button type="button" className={`fs-chip${cents === p ? " is-on" : ""}`} aria-pressed={cents === p} onClick={() => setDollars(String(p / 100))}>{formatMoney(p)}</button></li>
        ))}
      </ul>
      <label className="fs-dollar" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <span className="fs-t-task">$</span>
        <input className="fs-input" inputMode="numeric" value={dollars} onChange={(e) => setDollars(e.target.value.replace(/[^0-9]/g, ""))} aria-label="Amount in dollars" />
      </label>
      <p className="fs-t-meta" style={{ marginTop: 8 }}>Between {formatMoney(minCents)} and {formatMoney(maxCents)} per top-up. The credit appears once Stripe confirms the payment.</p>
      {error && <p role="alert" className="fs-field-error" style={{ marginTop: 8 }}>{error}</p>}
      <button type="button" disabled={pending || !valid} className="fs-btn fs-btn-primary" style={{ marginTop: 12 }}
        onClick={() => start(async () => { setError(null); const r = await topUpCampaignCredit(cents); if (r.ok && r.redirect) window.location.assign(r.redirect); else setError(("error" in r && r.error) || "Checkout could not start. Try again."); })}>
        {pending ? "Opening Stripe" : `Add ${formatMoney(valid ? cents : 0)} with Stripe`}
      </button>
    </div>
  );
}
