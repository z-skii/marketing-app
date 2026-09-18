"use client";

import Link from "next/link";
import { CaretRight, Gear, ShareNetwork } from "@phosphor-icons/react";
import { Sheet } from "../../../design-lab-v2/Sheet";
import { Outside } from "../../../design-lab-v2/Outside";
import { Img } from "../../../design-lab-v2/Img";
import { V2_SETTINGS_BUSINESS } from "../../settings";
import { business } from "../../fixtures";
import { Logo } from "../../wallet/Cards";
import { counts, useLoyalty } from "../../store";
import { LabEntrance } from "../../LabControl";

export function BusinessProfile() {
  const { state } = useLoyalty();
  const p = state.program;
  const c = counts(state);
  const line = p.status === "none" && !state.draft ? "Turn visits into rewards." : p.status !== "live" && state.draft ? `Draft · ${state.draft.reward.name}` : `${c.members} members · ${c.repeat} came back`;
  return (
    <div className="bp">
      <div className="bp-top">
        <LabEntrance />
        <span style={{ display: "flex", gap: 4 }}>
          <Sheet title="Share" triggerClass="icon-btn" triggerLabel="Share" trigger={<ShareNetwork size={20} aria-hidden />}><p className="t-body" style={{ marginTop: 8 }}>Public profile links are outside this preview.</p></Sheet>
          <Sheet title="Settings" triggerClass="icon-btn" triggerLabel="Settings" trigger={<Gear size={20} aria-hidden />}>
            <ul style={{ marginTop: 8 }}>{V2_SETTINGS_BUSINESS.map((s) => <li key={s}><Outside label={s} className="sheet-row"><span>{s}</span><CaretRight size={16} aria-hidden /></Outside></li>)}</ul>
          </Sheet>
        </span>
      </div>
      <span className="media bp-cover"><Img src={business.cover} alt={business.coverAlt} /></span>
      <div className="bp-identity">
        <span className="loy-brand-mark bp-logo" style={{ background: p.card.bg, color: p.card.fg }}><Logo design={p.card} size={28} /></span>
        <div><h2 className="t-name">{business.name}</h2><p className="t-fact" style={{ marginTop: 4 }}>{business.category}<span aria-hidden> · </span>{business.city}</p></div>
      </div>
      <ul className="bp-rows">
        <li><Link href="/design-lab-v3/business/loyalty" className="bp-row"><span><span className="t-object" style={{ display: "block" }}>Loyalty</span><span className="t-fact-ink">{line}</span></span><CaretRight size={18} aria-hidden /></Link></li>
        <li><Outside label="Plan" className="bp-row"><span><span className="t-object" style={{ display: "block" }}>Plan</span><span className="t-fact">Plan and billing</span></span><CaretRight size={18} aria-hidden /></Outside></li>
        <li><Outside label="Connections" className="bp-row"><span><span className="t-object" style={{ display: "block" }}>Connections</span><span className="t-fact">Instagram, Google Business</span></span><CaretRight size={18} aria-hidden /></Outside></li>
      </ul>
    </div>
  );
}
