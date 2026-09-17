"use client";

import { useState } from "react";
import { Check, Plus } from "@phosphor-icons/react";
import { fmtTime, type Member } from "../../../fixtures";
import { todayKey, useLoyalty } from "../../../store";

/**
 * The counter actions for one member. A reserved result region replaces
 * the count action after a commit: the unchanged receipt for a same day
 * attempt, Reward ready with Redeem after an unlock, the counted receipt
 * after an ordinary visit. Redeem asks once. The receipt distinguishes
 * fixture success from Wallet delivery.
 */
export function CounterActions({ m, wide = false, label, onDone }: { m: Member; wide?: boolean; label?: string; onDone?: () => void }) {
  const { state, dispatch } = useLoyalty();
  const p = state.program;
  const points = p.kind === "points";
  const today = todayKey(state);
  const sameDay = m.visitDays.includes(today);
  const r = state.receipt;
  const mine = r?.memberId === m.id && ["same-day", "unlock", "visit", "points", "redeem"].includes(r.type);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const count = () => { if (busy) return; setBusy(true); dispatch({ type: "count", memberId: m.id, key: `${m.id}-${state.seq}` }); setTimeout(() => setBusy(false), 400); };
  const walletLine = r?.walletUpdated === "simulated" ? "Wallet update simulated" : "Wallet not added";
  const unitWord = points ? "points" : "visits";
  return (
    <div className={`counter-actions${wide ? " counter-actions-wide" : ""}`} aria-live="polite">
      {mine && r?.type === "same-day" ? (
        <div className="counter-result">
          <span className="t-object">Already counted today.</span>
          <span className="t-fact-ink">{m.progress} of {p.requirement} {unitWord} · unchanged</span>
          <span className="t-fact">{points ? "One qualifying purchase counts per day." : "One visit counts per day."}</span>
          {m.lastCountedAt && <details className="disclosure"><summary className="t-action">Details</summary><span className="t-fact" style={{ display: "block", marginTop: 8 }}>Last counted today at {fmtTime(m.lastCountedAt)}.</span></details>}
        </div>
      ) : mine && (r?.type === "visit" || r?.type === "points") ? (
        <div className="counter-result">
          <span className="t-object">{points ? "Point added" : "Visit counted"}</span>
          <span className="t-fact-ink">{m.progress} of {p.requirement} {unitWord}</span>
          <span className="t-fact">{walletLine}</span>
        </div>
      ) : mine && r?.type === "redeem" ? (
        <div className="counter-result">
          <span className="t-object">Reward redeemed</span>
          <span className="t-fact-ink">{m.progress} of {p.requirement} {unitWord}</span>
          <span className="t-fact">{walletLine}</span>
        </div>
      ) : m.ready > 0 ? (
        confirm ? (
          <div className="counter-confirm" role="group" aria-label="Redeem">
            <span className="t-object">Redeem {p.reward.name}?</span>
            <span className="t-fact">Use one ready reward. This does not add a visit.</span>
            <span className="counter-confirm-actions"><button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => setConfirm(false)}>Cancel</button><button type="button" className="btn btn-primary" onClick={() => { dispatch({ type: "redeem", memberId: m.id }); setConfirm(false); }}><Check size={18} weight="bold" aria-hidden />Redeem reward</button></span>
          </div>
        ) : (
          <>
            {mine && r?.type === "unlock" && <span className="t-fact counter-receipt">{walletLine}</span>}
            <button type="button" className="btn btn-primary counter-main" onClick={() => setConfirm(true)}><Check size={18} weight="bold" aria-hidden />Redeem</button>
          </>
        )
      ) : (
        <>
          <button type="button" className="btn btn-primary counter-main" disabled={busy} onClick={count}><Plus size={18} weight="bold" aria-hidden />{label ?? (points ? "Add 1 point" : "Add visit")}</button>
          {sameDay && m.lastCountedAt && <span className="t-fact">Last counted today at {fmtTime(m.lastCountedAt)}.</span>}
        </>
      )}
      {onDone && mine && <span className="counter-exit"><button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={onDone}>Done</button></span>}
    </div>
  );
}
