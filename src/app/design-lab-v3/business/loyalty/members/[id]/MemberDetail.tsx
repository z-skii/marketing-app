"use client";

import Link from "next/link";
import { DotsThree } from "@phosphor-icons/react";
import { Sheet } from "../../../../../design-lab-v2/Sheet";
import { Marks } from "../../../../Progress";
import { QR } from "../../../../qr";
import { fmtDayYear, fmtTime } from "../../../../fixtures";
import { progressLabel, useLoyalty } from "../../../../store";
import { LoyaltyHead } from "../../LoyaltyCrumb";
import { WalletMark } from "../Members";
import { CounterActions } from "../../record/CounterActions";

const HISTORY: Record<string, string> = { SIGNUP: "Joined", VISIT: "Visit counted", POINTS_ADDED: "Point added", REWARD_UNLOCKED: "Reward ready", REWARD_REDEEMED: "Reward redeemed" };

/** Identity, progress, the full width counter action, then Joined from, Wallet and a collapsed History. `embedded` renders inside the desktop roster split. */
export function MemberDetail({ id, embedded = false }: { id: string; embedded?: boolean }) {
  const { state } = useLoyalty();
  const m = state.members.find((x) => x.id === id);
  const p = state.program;
  if (!m) return <div className="loy"><LoyaltyHead title="Members" here="Members" backHref="/design-lab-v3/business/loyalty/members" /><p className="t-object" style={{ marginTop: 24 }}>No member at this address.</p></div>;
  const events = [...state.events.filter((e) => e.memberId === m.id && ["SIGNUP", "VISIT", "POINTS_ADDED", "REWARD_UNLOCKED", "REWARD_REDEEMED"].includes(e.type))].sort((a, b) => b.at.localeCompare(a.at));
  const live = state.receipt?.memberId === m.id;
  const points = p.kind === "points";
  return (
    <div className={`loy mem-detail${embedded ? " mem-detail-embedded" : ""}`}>
      {!embedded && <LoyaltyHead title={m.firstName} here="Members" backHref="/design-lab-v3/business/loyalty/members" />}
      <div className="mem-identity">
        <div>{embedded && <h2 className="t-name">{m.firstName}</h2>}<p className="t-fact">{m.contactMasked}<span aria-hidden> · </span>{m.memberId}</p></div>
        <Sheet title="Member actions" variant="menu" triggerClass="icon-btn" triggerLabel="Member actions" trigger={<DotsThree size={22} weight="bold" aria-hidden />}>
          <Link href={`/design-lab-v3/card/${m.code}`} className="sheet-row"><span>View demo card</span></Link>
          <Link href={`/design-lab-v3/business/loyalty/record?member=${m.id}`} className="sheet-row"><span>Open at the counter</span></Link>
          <span className="sheet-row muted" aria-disabled="true"><span>Block member, later</span></span>
        </Sheet>
      </div>
      <section className={`mem-progress-stage${m.ready > 0 ? " is-ready" : ""}`} aria-live="polite">
        <span className="mem-progress-big">{progressLabel(m, p)}</span>
        <Marks m={m} p={p} size="l" live={live} />
        <span className="t-fact-ink">{p.reward.name}{m.ready > 0 && m.progress > 0 ? ` · ${m.progress} ${points ? "points" : "visits"} toward your next reward` : m.ready > 1 ? ` · ${m.ready} ready` : ""}</span>
        <span className="mem-qr"><QR value={m.code} size={165} label={`${m.firstName}’s member QR`} ink="#111" paper="#fff" quiet={4} /></span>
      </section>
      <CounterActions m={m} wide />
      <section className="mem-source-block obj">
        <span className="edge" aria-hidden />
        <span className="t-fact">Joined from</span>
        <span className="t-object">{m.source.label}</span>
        <span className="t-fact">{m.source.sub}</span>
        <details className="disclosure"><summary className="t-action">Source details</summary>
          <dl className="facts" style={{ marginTop: 8, gridTemplateColumns: "1fr" }}>
            <div><dt>Joined</dt><dd>{fmtDayYear(m.joinedAt)}, {fmtTime(m.joinedAt)}</dd></div>
            <div><dt>Source</dt><dd>{m.source.confidence === "link" ? "Link recorded" : "Source not tracked"}</dd></div>
          </dl>
          <p className="t-fact" style={{ marginTop: 8 }}>The first known signup source stays attached. Later visits and links do not replace it.</p>
        </details>
      </section>
      <section className="mem-wallet-block">
        <span className="t-fact">Wallet</span>
        <WalletMark w={m.wallet} long />
      </section>
      <details className="disclosure mem-history-block">
        <summary className="t-action">History</summary>
        <ul className="mem-history">{events.map((e) => <li key={e.id} className={`t-fact${e.counted || e.type === "SIGNUP" ? " t-fact-ink" : ""}`}><span className="mem-history-when">{fmtDayYear(e.at)}, {fmtTime(e.at)}</span><span>{e.note.startsWith("Not counted") ? "Not counted · same day" : HISTORY[e.type] ?? e.type}{e.type === "SIGNUP" ? ` · ${m.source.label}` : ""}</span></li>)}</ul>
      </details>
    </div>
  );
}
