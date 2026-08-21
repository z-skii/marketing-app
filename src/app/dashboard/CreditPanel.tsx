"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { topUpWallet } from "./actions";
import { formatCredit, parseDollarsToCents } from "@/lib/money";
import type { WalletSummary } from "@/lib/dashboard";

const PRESETS = [1000, 2500, 5000, 10000];

/** Credit at a glance: what is spendable, what is already out on placements. */
export function CreditPanel({ wallet }: { wallet: WalletSummary }) {
  const router = useRouter();
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function buy(cents: number) {
    setError(null);
    startTransition(async () => {
      const result = await topUpWallet(cents);
      if (result.ok && result.redirect) window.location.href = result.redirect;
      else if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <section className="rule-heavy mt-8 pt-6">
      <h2 className="eyebrow">Credit</h2>
      <div className="mt-4 grid max-w-3xl gap-6 sm:grid-cols-3">
        <Figure label="Total remaining" value={wallet.totalCents} emphasis />
        <Figure label="Available" value={wallet.availableCents} />
        <Figure label="On placements" value={wallet.assignedCents} />
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <button key={preset} type="button" className="btn btn-ghost" disabled={pending} onClick={() => buy(preset)}>
            {formatCredit(preset)}
          </button>
        ))}
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-ink-faint">$</span>
            <input
              name="topup-amount" inputMode="decimal" autoComplete="off" value={custom} onChange={(e) => setCustom(e.target.value)}
              placeholder="Other" className="field !w-32 !pl-7 !py-2.5" aria-label="Custom top-up amount"
            />
          </div>
          <button
            type="button" className="btn" disabled={pending || !parseDollarsToCents(custom)}
            onClick={() => { const c = parseDollarsToCents(custom); if (c) buy(c); }}
          >
            {pending ? "…" : "Top Up"}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="mt-3 font-mono text-xs text-signal">{error}</p>}
    </section>
  );
}

function Figure({ label, value, emphasis }: { label: string; value: number; emphasis?: boolean }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={`tnum mt-1.5 font-mono font-600 tracking-tight ${emphasis ? "text-3xl md:text-4xl" : "text-2xl text-ink-soft"}`}>
        {formatCredit(value)}
      </div>
    </div>
  );
}
