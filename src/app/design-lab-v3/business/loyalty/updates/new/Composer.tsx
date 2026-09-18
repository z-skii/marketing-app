"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { AppleCard, CardDetails, GoogleCard, PlatformLabel, type CardData } from "../../../../wallet/Cards";
import { OFFER_DEFAULT, fmtDayYear, type UpdateKind } from "../../../../fixtures";
import { todayKey, useLoyalty } from "../../../../store";
import { LoyaltyCrumb } from "../../LoyaltyCrumb";

const KINDS: [UpdateKind, string][] = [["offer", "Special offer"], ["promotion", "New promotion"], ["milestone", "Milestone"]];

export function Composer() {
  const { state, dispatch } = useLoyalty();
  const p = state.program;
  const [kind, setKind] = useState<UpdateKind>("offer");
  const [title, setTitle] = useState(OFFER_DEFAULT.title);
  const [body, setBody] = useState(OFFER_DEFAULT.body);
  const [stage, setStage] = useState<"compose" | "preview" | "done">("compose");
  const today = todayKey(state);
  const usedToday = state.updates.find((u) => (u.kind === "offer" || u.kind === "promotion" || u.kind === "milestone") && u.at.startsWith(today));
  const audience = state.members.filter((m) => m.wallet !== "none").length;
  const sara = state.members.find((m) => m.firstName === "Sara") ?? state.members[0] ?? null;
  const d: CardData | null = sara ? { design: p.card, program: p, firstName: sara.firstName, memberId: sara.memberId, code: sara.code, progress: sara.progress, ready: sara.ready, state: "updated", offer: { title, body } } : null;
  const tomorrow = new Date(new Date(`${today}T00:00:00-05:00`).getTime() + 24 * 3600_000).toISOString();
  return (
    <div className="loy composer">
      <LoyaltyCrumb here="Wallet update" />
      {usedToday && stage !== "done" ? (
        <div className="loy-empty" style={{ marginTop: 24 }}><p className="t-object">Update already used today.</p><p className="t-fact">Next update: {fmtDayYear(tomorrow)}, 12:00 AM CDT</p><Link href="/design-lab-v3/business/loyalty/updates" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Wallet updates</Link></div>
      ) : stage === "done" ? (
        <div className="loy-empty settle" style={{ marginTop: 24 }}><p className="t-object">Wallet update simulated.</p><p className="t-fact">Nothing was sent.</p><Link href="/design-lab-v3/business/loyalty/updates" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Wallet updates</Link></div>
      ) : stage === "compose" ? (
        <form className="update-form" onSubmit={(e) => { e.preventDefault(); if (title.trim()) setStage("preview"); }}>
          <div className="tabs" role="tablist" aria-label="Kind">{KINDS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => setKind(k)}>{l}</button>)}</div>
          <label className="join-field"><span className="t-fact-ink">Title</span><input className="join-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} required /></label>
          <label className="join-field"><span className="t-fact-ink">Message</span><textarea className="join-input join-textarea" value={body} onChange={(e) => setBody(e.target.value)} maxLength={140} rows={3} /></label>
          <p className="t-fact-ink">{audience} members with Wallet · simulated</p>
          <p className="t-fact">Wallet update. Apple Wallet shows it on the card; Google Wallet may notify. Once a day.</p>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Preview Wallet update</button>
        </form>
      ) : (
        <div className="composer-preview">
          {d && (
            <div className="composer-platforms">
              <div className="wc-wrap">
                <PlatformLabel platform="apple" />
                <span className="t-fact-ink">Changes the card.</span>
                <AppleCard d={d} width={320} className="wc-fit" />
                <CardDetails d={d} platform="apple" />
                <PlatformLabel platform="apple" above={false} />
              </div>
              <div className="wc-wrap">
                <PlatformLabel platform="google" />
                <span className="t-fact-ink">May notify.</span>
                <GoogleCard d={d} width={320} className="wc-fit" />
                <CardDetails d={d} platform="google" />
                <PlatformLabel platform="google" above={false} />
              </div>
            </div>
          )}
          <p className="t-fact">Wallet update. Apple Wallet shows it on the card; Google Wallet may notify. Once a day.</p>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={() => { dispatch({ type: "message", kind, title: title.trim(), body: body.trim() }); setStage("done"); }}>Simulate update</button>
            <button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => setStage("compose")}>Back</button>
          </div>
        </div>
      )}
      <Link href="/design-lab-v3/business/loyalty" className="link t-action loy-back"><ArrowLeft size={16} aria-hidden />Back</Link>
    </div>
  );
}
