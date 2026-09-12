"use client";

import { useRef, useState, useTransition } from "react";
import { formatMoney } from "@/components/fs/parts";
import { topUpCampaignCredit } from "@/app/(v2)/business/billing/actions";

/**
 * Money, stated once and plainly. Campaign credit pays people when work is
 * approved; nothing is held when a campaign is published, and the plan
 * subscription is billed separately. The business sees pay per unit, the
 * spots, the total if every spot is approved, its credit now, the minimum
 * to publish (one payment) and what is still needed to cover every spot.
 * The platform fee comes out of each payout, never on top of the pay.
 */
export type FundingFacts = { walletCents: number; feePct: number; minTopUpCents: number; maxTopUpCents: number; stripeConfigured: boolean };

export function fundingState(payCents: number, spots: number, f: FundingFacts) {
  const total = payCents * Math.max(spots, 0);
  const toPublish = Math.max(0, payCents - f.walletCents);
  const toCoverAll = Math.max(0, total - f.walletCents);
  return { total, toPublish, toCoverAll, canPublish: payCents > 0 && f.walletCents >= payCents };
}

export function FundingPlane({ payCents, spots, unit, monthly = false, funding, extra }: {
  payCents: number; spots: number; unit: string; monthly?: boolean; funding: FundingFacts; extra?: React.ReactNode;
}) {
  const s = fundingState(payCents, spots, funding);
  const fee = Math.floor((payCents * funding.feePct) / 100);
  const per = monthly ? `per ${unit}, per month` : `per ${unit}`;
  return (
    <div className="fs-plane is-decision fs-funding" aria-label="Funding">
      <dl className="fs-funding-rows">
        <div><dt>Pay</dt><dd className="fs-tnum"><b>{formatMoney(payCents)}</b> <span className="fs-t-meta">{per}</span></dd></div>
        <div><dt>Spots</dt><dd className="fs-tnum">{spots}</dd></div>
        <div><dt>{monthly ? "Per month if every spot is filled" : "If every spot is approved"}</dt><dd className="fs-tnum"><b>{formatMoney(s.total)}</b></dd></div>
        {funding.feePct > 0 && <div><dt>Creator receives</dt><dd className="fs-tnum">{formatMoney(payCents - fee)} <span className="fs-t-meta">after the {funding.feePct}% TapMart fee, taken from the payout</span></dd></div>}
        <div className="fs-funding-divider"><dt>Campaign credit now</dt><dd className="fs-tnum"><b>{formatMoney(funding.walletCents)}</b></dd></div>
        <div><dt>Needed to publish</dt><dd className="fs-tnum">{formatMoney(payCents)} <span className="fs-t-meta">one payment</span> {s.canPublish ? <span className="fs-status is-confirmed">Covered</span> : <span className="fs-status is-problem">Add {formatMoney(s.toPublish)}</span>}</dd></div>
        <div><dt>Still needed to cover every spot</dt><dd className="fs-tnum">{s.toCoverAll === 0 ? <span className="fs-status is-confirmed">Covered</span> : formatMoney(s.toCoverAll)}</dd></div>
      </dl>
      <p className="fs-t-meta" style={{ marginTop: 12 }}>Credit leaves only when you approve work{monthly ? " or confirm a month" : ""}. Nothing is held at publish. Your plan is billed separately from campaign credit.</p>
      {extra}
      <AddCredit funding={funding} suggested={s.toCoverAll > 0 ? s.toCoverAll : s.toPublish} />
    </div>
  );
}

/** Add credit without leaving the flow. Stripe Checkout grants the credit; this only opens it. */
export function AddCredit({ funding, suggested }: { funding: FundingFacts; suggested: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState(String(Math.max(Math.ceil(suggested / 100), Math.ceil(funding.minTopUpCents / 100))));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const cents = Math.round(Number(amount || 0)) * 100;
  const submit = () => start(async () => {
    setError(null);
    const r = await topUpCampaignCredit(cents);
    if (r.ok) window.location.assign(r.redirect); else setError(r.error);
  });
  return (
    <>
      <button type="button" className="fs-btn fs-btn-secondary" style={{ marginTop: 12 }} onClick={() => dialog.current?.showModal()}>Add credit</button>
      <dialog ref={dialog} className="fs-dialog fs" aria-labelledby="fs-add-credit-title">
        <h2 id="fs-add-credit-title" className="fs-t-section">Add campaign credit</h2>
        {funding.stripeConfigured ? (
          <>
            <p className="fs-t-meta" style={{ marginTop: 4 }}>Whole dollars, {formatMoney(funding.minTopUpCents)} to {formatMoney(funding.maxTopUpCents)}. Stripe takes the card; credit appears once the payment is confirmed.</p>
            <label htmlFor="fs-add-credit-amount" className="fs-field-label" style={{ marginTop: 16 }}>Amount</label>
            <span className="fs-dollar"><span aria-hidden>$</span><input id="fs-add-credit-amount" className="fs-input fs-tnum" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} /></span>
            {error && <p role="alert" className="fs-field-error" style={{ marginTop: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <button type="button" className="fs-btn fs-btn-primary" disabled={pending || cents < funding.minTopUpCents} onClick={submit}>{pending ? "Opening Stripe" : `Add ${formatMoney(cents)} with Stripe`}</button>
              <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" onClick={() => dialog.current?.close()}>Not now</button>
            </div>
          </>
        ) : (
          <>
            <p className="fs-t-body" style={{ marginTop: 8 }}>Card payments are not connected in this environment, so credit cannot be added here yet.</p>
            <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" style={{ marginTop: 16, paddingLeft: 0 }} onClick={() => dialog.current?.close()}>Close</button>
          </>
        )}
      </dialog>
    </>
  );
}
