"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { Wordmark } from "../../../design-lab-v2/parts";
import { Sheet } from "../../../design-lab-v2/Sheet";
import { AppleCard, CardDetails, GoogleCard, PlatformLabel, type CardData, type CardState } from "../../wallet/Cards";
import { OFFER_DEFAULT, fmtDayYear, NOW } from "../../fixtures";
import { useLoyalty } from "../../store";

const STATES: [CardState, string][] = [["collecting", "Collecting"], ["ready", "Reward ready"], ["redeemed", "Reward redeemed"], ["updated", "Updated offer"]];

/**
 * One member's card as an Apple or Google concept. The actual state is
 * shown by default; other states are an inspection chosen in the Lab
 * panel and labelled Example member, Preview only. Updated offer opens
 * Details at Offer; nothing notification shaped is drawn.
 */
export function CardView({ code, platform: initial, forced }: { code: string; platform: "apple" | "google"; forced: string | null }) {
  const { state } = useLoyalty();
  const p = state.program;
  const m = state.members.find((x) => x.code === code) ?? null;
  const [platform, setPlatform] = useState<"apple" | "google">(initial);
  const [demo, setDemo] = useState<CardState | null>(STATES.some(([k]) => k === forced) ? (forced as CardState) : null);
  const [details, setDetails] = useState(forced === "updated");
  if (!m) return <div className="join"><header className="join-header"><Wordmark size={20} /><span className="t-note">Design Lab · Wallet concept</span></header><main className="join-main"><p className="t-object">No demo card at this address.</p></main></div>;
  const actual: CardState = m.ready > 0 ? "ready" : m.redeemed > 0 && m.progress === 0 ? "redeemed" : "collecting";
  const stateShown = demo ?? actual;
  const example = demo !== null && demo !== actual;
  const offer = state.updates.find((u) => u.kind === "offer" || u.kind === "promotion" || u.kind === "milestone") ?? OFFER_DEFAULT;
  const d: CardData = { design: p.card, program: p, firstName: m.firstName, memberId: m.memberId, code: m.code, progress: stateShown === "collecting" && example ? Math.min(m.progress || 3, p.requirement - 1) : stateShown === "redeemed" ? 0 : m.progress, ready: stateShown === "ready" ? Math.max(1, m.ready) : 0, state: stateShown, offer: stateShown === "updated" ? { title: offer.title, body: offer.body } : null };
  const back = m.source.creatorId ? `/design-lab-v3/join/loopday-${m.source.creatorId}-${m.source.type === "STORY" ? "story" : m.source.type === "RECREATE" ? "recreate" : "car"}?m=${m.id}` : `/design-lab-v3/join/loopday-counter?m=${m.id}`;
  return (
    <div className="join card-route">
      <header className="join-header">
        <Link href={back} className="link link-plain t-action" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }}><ArrowLeft size={16} aria-hidden />Back to my card</Link>
        <Sheet title="Design Lab" variant="menu" triggerClass="lab-entrance t-note" trigger={<>Design Lab · Wallet concept</>}>
          <p className="t-fact" style={{ marginTop: 8 }}>Preview state</p>
          {STATES.map(([s, l]) => <button key={s} type="button" className="sheet-row" aria-pressed={stateShown === s} onClick={(e) => { setDemo(s === actual ? null : s); setDetails(s === "updated"); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}><span>{l}</span></button>)}
          <p className="t-note" style={{ marginTop: 12 }}>{m.firstName}’s card is {actual === "ready" ? "Reward ready" : actual === "redeemed" ? "Reward redeemed" : "Collecting"}. Other states are examples.</p>
          <Link href="/design-lab-v3/business/loyalty" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", marginTop: 8 }}>Return to business preview</Link>
        </Sheet>
      </header>
      <main className="join-main join-main-card">
        <div className="join-stage">
          <div className="join-stage-pass">
            <div className="join-platforms" role="tablist" aria-label="Wallet">
              <button type="button" role="tab" aria-selected={platform === "apple"} onClick={() => setPlatform("apple")}>Apple Wallet</button>
              <button type="button" role="tab" aria-selected={platform === "google"} onClick={() => setPlatform("google")}>Google Wallet</button>
            </div>
            <span className="t-fact-ink">{m.source.creatorId ? `From ${m.source.label}’s ${m.source.type === "STORY" ? "Story" : m.source.type === "RECREATE" ? "Reel" : "car"}.` : m.source.type === "BUSINESS_QR" ? "Joined at the counter." : "Direct signup."}</span>
            {example && <span className="t-fact">Example member · {m.firstName}<span aria-hidden> · </span>{fmtDayYear(NOW.toISOString())}<span aria-hidden> · </span>Preview only</span>}
            <div className="wc-wrap">
              <PlatformLabel platform={platform} />
              <div key={`${platform}-${stateShown}`} className="settle">{platform === "apple" ? <AppleCard d={d} width={375} className="wc-fit" /> : <GoogleCard d={d} width={375} className="wc-fit" />}</div>
              <PlatformLabel platform={platform} above={false} />
            </div>
          </div>
          <div className="join-stage-side">
            <button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => setDetails((v) => !v)} aria-expanded={details}>Details</button>
            <Link href="/design-lab-v3/business/loyalty" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Done</Link>
            {details && <CardDetails d={d} platform={platform} />}
          </div>
        </div>
      </main>
    </div>
  );
}
