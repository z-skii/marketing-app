"use client";

import Link from "next/link";
import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Marks } from "../../../Progress";
import { useOrigin } from "../../../useOrigin";
import { cardUrl } from "../../../wallet/Cards";
import { QR } from "../../../qr";
import { type Member } from "../../../fixtures";
import { progressLabel, useLoyalty } from "../../../store";
import { CounterActions } from "./CounterActions";
import { TaskHead } from "../TaskHead";

/**
 * Add visit: a focused counter task. Scan is the default: a paper
 * aperture with ink corner brackets, Scanner simulation above and No
 * camera is used. below; Simulate scan resolves the selected fixture
 * member with one 320ms sweep. Search matches by name or contact. On
 * recognition the aperture keeps its bounds and shows the masked
 * identity, the member QR and the readable member ID beside +1 visit.
 */
export function Record({ preset }: { preset: string | null }) {
  const origin = useOrigin();
  const { state } = useLoyalty();
  const p = state.program;
  const points = p.kind === "points";
  const [mode, setMode] = useState<"scan" | "search">("scan");
  const [found, setFound] = useState<string | null>(preset);
  const [sample, setSample] = useState<string>(state.members.find((x) => x.firstName === "Sara")?.id ?? state.members[0]?.id ?? "");
  const [q, setQ] = useState("");
  const [sweep, setSweep] = useState(false);
  const [unknown, setUnknown] = useState(false);
  const m: Member | null = state.members.find((x) => x.id === found) ?? null;
  const live = state.receipt?.memberId === m?.id;
  const simulate = () => { setSweep(true); setUnknown(false); if (sample === "unknown") { setTimeout(() => { setSweep(false); setUnknown(true); }, 320); return; } setFound(sample); setTimeout(() => setSweep(false), 320); };
  const results = q.trim() ? state.members.filter((x) => x.firstName.toLowerCase().startsWith(q.trim().toLowerCase()) || x.contactNorm.includes(q.trim().toLowerCase()) || (q.replace(/\D/g, "").length >= 2 && x.contactNorm.endsWith(q.replace(/\D/g, "")))) : [];
  const clear = () => { setFound(null); setQ(""); setUnknown(false); };
  return (
    <div className="record">
      <TaskHead title={`Add ${points ? "points" : "visit"}`} />
      {!m ? (
        <>
          <div className="tabs" role="tablist" aria-label="Find the member">
            <button type="button" role="tab" aria-selected={mode === "scan"} onClick={() => setMode("scan")}>Scan</button>
            <button type="button" role="tab" aria-selected={mode === "search"} onClick={() => setMode("search")}>Search</button>
          </div>
          {mode === "scan" ? (
            <div className="record-scan">
              <span className="t-fact-ink">Scanner simulation</span>
              <div className={`scanner${sweep ? " is-scanning" : ""}`} role="img" aria-label="Scanner simulation. No camera is used.">
                <span className="scanner-corner c1" aria-hidden /><span className="scanner-corner c2" aria-hidden /><span className="scanner-corner c3" aria-hidden /><span className="scanner-corner c4" aria-hidden />
                <span className="scanner-line" aria-hidden />
              </div>
              <span className="t-note">No camera is used.</span>
              <div className="record-scan-controls">
                <label className="record-sample t-fact-ink">Sample member<select className="join-input" value={sample} onChange={(e) => setSample(e.target.value)} aria-label="Sample member">{state.members.map((x) => <option key={x.id} value={x.id}>{x.firstName}</option>)}<option value="unknown">Unknown QR</option></select></label>
                <button type="button" className="btn btn-primary" onClick={simulate}>Simulate scan</button>
              </div>
              {unknown && <div className="record-unknown settle"><span className="t-fact-ink">This QR isn’t a Loopday member card.</span><span style={{ display: "flex", gap: 16 }}><button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => { setMode("search"); setUnknown(false); }}>Search members</button><button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => setUnknown(false)}>Try another QR</button></span></div>}
            </div>
          ) : (
            <div className="record-search">
              <label className="mem-search"><MagnifyingGlass size={20} aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone or email" aria-label="Name, phone or email" autoFocus /></label>
              <ul className="record-results">
                {results.slice(0, 6).map((x) => (
                  <li key={x.id}><button type="button" className="record-result" onClick={() => setFound(x.id)}><span className="t-object">{x.firstName}</span><span className="t-fact">{x.contactMasked}</span><span className="t-fact-ink">{progressLabel(x, p)}</span></button></li>
                ))}
                {q.trim() && results.length === 0 && <li className="loy-empty"><span className="t-object">No members match.</span><span className="t-fact">Try another name or contact.</span></li>}
              </ul>
            </div>
          )}
        </>
      ) : (
        <section className={`record-found${m.ready > 0 ? " is-ready" : ""}`} aria-live="polite">
          <div className="record-found-grid">
            <span className="record-found-qr"><QR value={cardUrl(origin, m.code)} size={165} label={`${m.firstName}’s member QR`} ink="#111" paper="#fff" quiet={4} /><span className="t-fact">{m.memberId}</span></span>
            <div className="record-found-id">
              <h2 className="t-title record-name">{m.firstName}</h2>
              <span className="t-fact">{m.contactMasked}</span>
              <span className="mem-progress-big record-progress-value">{m.ready > 0 ? `${p.requirement} of ${p.requirement}` : `${m.progress} of ${p.requirement}`} <span className="record-progress-unit">{points ? "points" : "visits"}</span></span>
              {/* the status sits directly beneath the value; the result area below carries only the consequence */}
              <span className="t-object record-status">{m.ready > 0 ? "Reward ready" : live && state.receipt?.type === "redeem" ? "Reward redeemed" : live && (state.receipt?.type === "visit" || state.receipt?.type === "points") ? (points ? "Point added" : "Visit counted") : live && state.receipt?.type === "same-day" ? "Already counted today" : progressLabel(m, p) === "No visits yet" ? "No visits yet" : "Collecting"}</span>
              <Marks m={m} p={p} size="l" live={live} />
              <span className="t-fact-ink">{p.reward.name}{points && m.ready === 0 ? " · 1 point per qualifying purchase" : ""}</span>
            </div>
          </div>
          <CounterActions m={m} wide compact label={points ? "Add 1 point" : "+1 visit"} onDone={clear} />
          <div className="record-found-foot">
            <Link href={`/design-lab-v3/business/loyalty/members/${m.id}`} className="link t-action">View member</Link>
            <button type="button" className="link t-action" onClick={clear}>Next customer</button>
          </div>
        </section>
      )}
    </div>
  );
}
