"use client";

import Link from "next/link";
import { useState } from "react";
import { CaretRight, MagnifyingGlass, QrCode, AppleLogo, GoogleLogo } from "@phosphor-icons/react";
import { SOURCES, type Member } from "../../../fixtures";
import { cameBack, orderedMembers, useLoyalty } from "../../../store";
import { LoyaltyHead } from "../LoyaltyCrumb";
import { MemberDetail } from "./[id]/MemberDetail";

export function WalletMark({ w, long = false }: { w: Member["wallet"]; long?: boolean }) {
  if (w === "none") return <span className="t-fact">Wallet not added</span>;
  const text = w === "both" ? "Both Wallets · simulated" : w === "apple" ? "Apple Wallet · simulated" : "Google Wallet · simulated";
  return <span className="mem-wallet" aria-label={text}>{(w === "apple" || w === "both") && <AppleLogo size={14} weight="fill" aria-hidden />}{(w === "google" || w === "both") && <GoogleLogo size={14} weight="bold" aria-hidden />}{long && <span className="t-fact">{text}</span>}</span>;
}

/** A roster row: first name, the compact fraction or reward state, a quiet chevron. 72px. */
export function MemberRow({ m, href, selected = false }: { m: Member; href: string; selected?: boolean }) {
  const { state } = useLoyalty();
  const p = state.program;
  const value = m.ready > 0 ? "Reward ready" : m.redeemed > 0 && m.progress === 0 ? "Redeemed" : m.lifetime === 0 ? "No visits yet" : `${m.progress}/${p.requirement}`;
  return (
    <Link href={href} className={`mem-row obj${m.ready > 0 ? " is-ready" : ""}`} aria-current={selected ? "true" : undefined}>
      <span className="mem-name t-object">{m.firstName}</span>
      <span className="mem-progress t-object">{value}</span>
      <span className="mem-right" aria-hidden><CaretRight size={16} /></span>
    </Link>
  );
}

/** Members: the roster; from 1024 a 440px roster beside the selected member's detail (Sara initially, inspected without recording anything). */
export function Members({ filter: initialFilter, source, selected }: { filter: string | null; source: string | null; selected: string | null }) {
  const { state } = useLoyalty();
  const p = state.program;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "repeat" | "ready">(initialFilter === "repeat" || initialFilter === "ready" ? initialFilter : "all");
  const src = source ? SOURCES[source] ?? null : null;
  const list = orderedMembers(state)
    .filter((m) => !src || (m.source.type === src.type && m.source.creatorId === src.creatorId))
    .filter((m) => !q || m.firstName.toLowerCase().startsWith(q.trim().toLowerCase()) || m.contactNorm.includes(q.trim().toLowerCase()) || (q.replace(/\D/g, "").length >= 2 && m.contactNorm.endsWith(q.replace(/\D/g, ""))))
    .filter((m) => filter === "all" ? true : filter === "ready" ? m.ready > 0 : cameBack(m));
  const detailId = selected ?? state.members.find((m) => m.firstName === "Sara")?.id ?? list[0]?.id ?? null;
  const points = p.kind === "points";
  return (
    <div className="loy members">
      <LoyaltyHead title="Members" here="Members" backHref="/design-lab-v3/business/loyalty" action={<Link href="/design-lab-v3/business/loyalty/record" className="btn btn-primary">Add {points ? "points" : "visit"}</Link>} />
      <div className="members-split">
        <div className="members-roster">
          {src && <p className="t-fact-ink" style={{ marginTop: 8 }}>Joined from {src.label}<span aria-hidden> · </span>{src.sub}<span aria-hidden> · </span><Link href="/design-lab-v3/business/loyalty/members" className="link">All members</Link></p>}
          <div className="members-tools">
            <label className="mem-search"><MagnifyingGlass size={20} aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" aria-label="Search members" /></label>
            <Link href="/design-lab-v3/business/loyalty/record" className="link t-action members-scan" aria-label="Scan"><QrCode size={18} aria-hidden />Scan</Link>
          </div>
          <div className="tabs" role="tablist" aria-label="Filter">
            {([["all", "All"], ["repeat", "Repeat visitors"], ["ready", "Reward ready"]] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
          </div>
          <div className="mem-list-head"><span className="t-fact">Name</span><span className="t-fact">{points ? "Points" : "Visits"}</span></div>
          <div className="mem-list">
            {list.length === 0 && state.members.length === 0 && <div className="loy-empty"><p className="t-object">No members yet.</p><Link href="/design-lab-v3/business/loyalty/qr" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>View QR</Link></div>}
            {list.length === 0 && state.members.length > 0 && <div className="loy-empty"><p className="t-object">No members match.</p><p className="t-fact">Try another name or contact.</p></div>}
            {list.map((m) => <MemberRow key={m.id} m={m} href={`/design-lab-v3/business/loyalty/members/${m.id}`} selected={m.id === detailId} />)}
          </div>
        </div>
        {detailId && <div className="members-detail"><MemberDetail id={detailId} embedded /></div>}
      </div>
    </div>
  );
}
