"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { Sheet } from "../../../../design-lab-v2/Sheet";
import { AppleCard, CardDetails, GoogleCard, PlatformLabel, type CardData, type CardState } from "../../../wallet/Cards";
import { OFFER_DEFAULT } from "../../../fixtures";
import { useLoyalty } from "../../../store";
import { LoyaltyCrumb, LoyaltyHead } from "../LoyaltyCrumb";
import { CardControls } from "../create/CardControls";

const STATES: [CardState, string][] = [["collecting", "Collecting"], ["ready", "Reward ready"], ["redeemed", "Reward redeemed"], ["updated", "Updated offer"]];

export function ProgramView({ edit }: { edit: string | null }) {
  const { state, dispatch } = useLoyalty();
  const p = state.program;
  const sara = state.members.find((m) => m.firstName === "Sara") ?? null;
  const [platform, setPlatform] = useState<"apple" | "google">("apple");
  const [stateShown, setStateShown] = useState<CardState>("collecting");
  const [details, setDetails] = useState(false);
  const [name, setName] = useState(p.reward.name);
  const [terms, setTerms] = useState(p.reward.terms);
  const points = p.kind === "points";
  const d: CardData = { design: p.card, program: p, firstName: sara?.firstName ?? "Sara", memberId: sara?.memberId ?? "LD-001", code: sara?.code ?? "LMQ-EXAMPLE", progress: stateShown === "collecting" ? (sara ? sara.progress : 3) : stateShown === "redeemed" ? 0 : sara?.progress ?? 0, ready: stateShown === "ready" ? 1 : 0, state: stateShown, offer: stateShown === "updated" ? { title: OFFER_DEFAULT.title, body: OFFER_DEFAULT.body } : null };
  if (p.status !== "live") return <div className="loy"><LoyaltyCrumb here="Program" /><p className="t-object" style={{ marginTop: 24 }}>No live program.</p><Link href="/design-lab-v3/business/loyalty" className="link t-action loy-back"><ArrowLeft size={16} aria-hidden />Back</Link></div>;
  return (
    <div className="loy program">
      <LoyaltyHead title={p.card.programName} here="Program" backHref="/design-lab-v3/business/loyalty" />
      <p className="t-fact-ink" style={{ marginTop: 4 }}>{p.requirement} {points ? "points" : "visits"} → {p.reward.name}<span aria-hidden> · </span>Live · simulated</p>
      <div className="program-body">
        <section className="program-card">
          <div className="join-platforms" role="tablist" aria-label="Wallet">
            <button type="button" role="tab" aria-selected={platform === "apple"} onClick={() => setPlatform("apple")}>Apple Wallet</button>
            <button type="button" role="tab" aria-selected={platform === "google"} onClick={() => setPlatform("google")}>Google Wallet</button>
          </div>
          <div className="wc-wrap">
            <PlatformLabel platform={platform} />
            <div className="create-card-stage"><div key={`${platform}-${stateShown}`} className="settle">{platform === "apple" ? <AppleCard d={d} width={358} className="wc-fit" /> : <GoogleCard d={d} width={358} className="wc-fit" />}</div></div>
            <PlatformLabel platform={platform} above={false} />
            <span className="t-note">Example member · {d.firstName}</span>
          </div>
          <div className="join-states">
            <span className="t-fact-ink">Preview state</span>
            <div className="tabs" role="tablist" aria-label="Preview state">{STATES.map(([s, l]) => <button key={s} type="button" role="tab" aria-selected={stateShown === s} onClick={() => setStateShown(s)}>{l}</button>)}</div>
          </div>
          <button type="button" className="link t-action" style={{ minHeight: 44, alignSelf: "flex-start" }} onClick={() => setDetails((v) => !v)} aria-expanded={details}>Details</button>
          {details && <CardDetails d={d} platform={platform} />}
        </section>
        <section className="program-facts">
          <dl className="facts" style={{ gridTemplateColumns: "1fr" }}>
            <div><dt>Program</dt><dd>{points ? "Points · one point per qualifying purchase" : "Visits · one visit per qualifying purchase"}</dd></div>
            <div><dt>Requirement</dt><dd>{p.requirement} {points ? "points" : "visits"} = {p.reward.name}</dd></div>
            <div><dt>Rule</dt><dd>One qualifying purchase counts per day.</dd></div>
            <div><dt>Terms</dt><dd>{p.reward.terms}</dd></div>
            <div><dt>Reward version</dt><dd>{p.reward.version}</dd></div>
          </dl>
          <p className="t-note" style={{ marginTop: 12 }}>Program type is fixed after launch.</p>
          <div className="program-actions">
            <Sheet title="Edit reward" triggerClass="link t-action" triggerStyle={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} trigger="Edit reward">
              <form className="update-form" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; dispatch({ type: "editReward", name: name.trim(), terms: terms.trim() }); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}>
                <label className="join-field"><span className="t-fact-ink">Reward name</span><input className="join-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} /></label>
                <label className="join-field"><span className="t-fact-ink">Terms</span><textarea className="join-input join-textarea" value={terms} onChange={(e) => setTerms(e.target.value)} maxLength={400} rows={4} /></label>
                <p className="t-fact">Changes apply to new reward cycles. Earned rewards stay unchanged.</p>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start" }}>Save changes</button>
              </form>
            </Sheet>
            <Sheet title="Edit card" triggerClass="link t-action" triggerStyle={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} trigger="Edit card">
              <div style={{ marginTop: 8 }}><CardControls design={p.card} onChange={(patch) => dispatch({ type: "editCard", patch })} /></div>
            </Sheet>
          </div>
          {edit && <p className="t-note">Open {edit === "reward" ? "Edit reward" : "Edit card"} above.</p>}
        </section>
      </div>
      <Link href="/design-lab-v3/business/loyalty" className="link t-action loy-back"><ArrowLeft size={16} aria-hidden />Back</Link>
    </div>
  );
}
