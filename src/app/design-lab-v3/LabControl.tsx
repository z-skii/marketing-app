"use client";

import { useEffect, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { Sheet } from "../design-lab-v2/Sheet";
import { SCENARIOS, useLoyalty, type Scenario } from "./store";

/**
 * The single Design Lab entrance: the fictional context label itself is
 * the control (13/18, a disclosure chevron, a 44px target). It opens
 * scenario selection, Advance demo day and Reset demo. Scenarios are
 * replacement fixture contexts, never a second live program; changing one
 * asks first because it discards local changes.
 */
export function LabEntrance({ label = "Design Lab · Fictional preview", className = "" }: { label?: string; className?: string }) {
  const { state, dispatch } = useLoyalty();
  const [pending, setPending] = useState<Scenario | null>(null);
  return (
    <Sheet title="Design Lab" variant="menu" triggerClass={`lab-entrance t-note ${className}`} triggerLabel={`${label}. Design Lab control`} trigger={<>{label}<CaretDown size={12} aria-hidden /></>}>
      <p className="t-fact" style={{ marginTop: 8 }}>Scenario</p>
      {pending ? (
        <div className="settle" style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="t-object">Change demo state?</span>
          <span className="t-fact">This resets local changes.</span>
          <span style={{ display: "flex", gap: 16, alignItems: "center" }}><button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => setPending(null)}>Cancel</button><button type="button" className="btn btn-primary" onClick={(e) => { dispatch({ type: "scenario", scenario: pending }); setPending(null); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}>Change state</button></span>
        </div>
      ) : (
        <>
          {SCENARIOS.map((s) => <button key={s.id} type="button" className="sheet-row" aria-pressed={state.scenario === s.id} onClick={() => (s.id === state.scenario ? null : setPending(s.id))}><span>{s.label}</span></button>)}
          <p className="t-fact" style={{ marginTop: 12 }}>Fixture clock: Sep 17, 2026, 10:00 AM CDT{state.clock >= 1440 ? ` + ${Math.floor(state.clock / 1440)} day${Math.floor(state.clock / 1440) === 1 ? "" : "s"}` : ""}</p>
          <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
            <button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={(e) => { dispatch({ type: "advanceDay" }); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}>Advance demo day</button>
            <button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={(e) => { dispatch({ type: "reset" }); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}>Reset demo</button>
          </div>
          <p className="t-note" style={{ marginTop: 12 }}>Fixture state only. A reload also resets.</p>
        </>
      )}
    </Sheet>
  );
}

/** A capture helper: ?lab=<scenario> selects a scenario once on arrival, so browser captures can show every state. No visible control. */
export function LabControl() {
  const { state, dispatch } = useLoyalty();
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("lab") as Scenario | null;
    if (want && SCENARIOS.some((s) => s.id === want) && want !== state.scenario) { const id = setTimeout(() => dispatch({ type: "scenario", scenario: want }), 0); return () => clearTimeout(id); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
