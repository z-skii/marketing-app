"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { fmtDayYear, fmtTime, type UpdateKind } from "../../../fixtures";
import { useLoyalty } from "../../../store";
import { LoyaltyCrumb } from "../LoyaltyCrumb";

export const KIND_LABEL: Record<UpdateKind, string> = { visit: "Visit counted", points: "Point added", reward_ready: "Reward ready", redeemed: "Reward redeemed", offer: "Special offer", promotion: "New promotion", milestone: "Milestone" };

export function Updates() {
  const { state } = useLoyalty();
  const list = state.updates.slice(0, 30);
  return (
    <div className="loy updates">
      <LoyaltyCrumb here="Wallet updates" />
      <p className="t-fact" style={{ marginTop: 4 }}>Automatic updates follow visits and rewards. Business updates are once a day. Nothing here was sent.</p>
      <Link href="/design-lab-v3/business/loyalty/updates/new" className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 16 }}>Send update</Link>
      <ul className="upd-list">
        {list.length === 0 && <li className="loy-empty"><span className="t-object">No updates yet.</span></li>}
        {list.map((u) => {
          const m = u.memberId ? state.members.find((x) => x.id === u.memberId) : null;
          const business = u.kind === "offer" || u.kind === "promotion" || u.kind === "milestone";
          return (
            <li key={u.id} className="upd-row">
              <span className="upd-when t-fact">{fmtDayYear(u.at)}, {fmtTime(u.at)}</span>
              <span className="upd-what"><span className="t-object">{u.title}</span><span className="t-fact">{business ? `${KIND_LABEL[u.kind]} · ${u.audience} members with Wallet · simulated` : `${KIND_LABEL[u.kind]} · ${m?.firstName ?? "Member"}`}{u.body && business ? ` · ${u.body}` : ""}</span></span>
              <span className="upd-how t-fact">{business ? "Changes the card · may notify" : u.capped ? "Card content updated · notification limit reached" : u.kind === "reward_ready" || u.kind === "redeemed" ? "Apple change message · Google may notify" : "Apple silent · Google may notify"}</span>
            </li>
          );
        })}
      </ul>
      <Link href="/design-lab-v3/business/loyalty" className="link t-action loy-back"><ArrowLeft size={16} aria-hidden />Back</Link>
    </div>
  );
}
