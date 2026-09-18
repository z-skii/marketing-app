"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CaretRight } from "@phosphor-icons/react";
import { Sheet } from "../../../../design-lab-v2/Sheet";
import { fmtDayYear, fmtTime, NOW } from "../../../fixtures";
import { counts, sourceRows, useLoyalty, type SourceRow } from "../../../store";
import { LoyaltyHead } from "../LoyaltyCrumb";
import { Descent } from "../../../Progress";
export { Descent };

const TYPE_LABEL: Record<string, string> = { RECREATE: "Recreate campaign", STORY: "Story campaign", CAR: "Car campaign", DIRECT_CREATOR_REQUEST: "Creator request", TAPMART_LINK: "TapMart link", BUSINESS_QR: "Counter QR", ORGANIC: "Direct signup" };

function sourceKey(r: SourceRow) { return r.source.creatorId ? r.source.creatorId : r.source.type === "BUSINESS_QR" ? "counter" : r.source.type === "TAPMART_LINK" ? "tapmart" : "direct"; }

function SourceDetails({ r }: { r: SourceRow }) {
  const { state: st } = useLoyalty();
  // A first touch is only ever a recorded campaign click; it is never derived from a signup time.
  const firstTouch = r.source.linkCode ? st.events.filter((e) => e.type === "CAMPAIGN_CLICK" && e.note === r.source.linkCode).map((e) => e.at).sort()[0] ?? null : null;
  const dates = r.members.map((m) => m.joinedAt).sort();
  const first = dates[0]; const last = dates[dates.length - 1];
  return (
    <div className="attr-details">
      <span className="t-note">Design Lab · Fictional preview</span>
      <Descent joined={r.joined} returned={r.returned} redeemed={r.redeemed} max={r.joined} size="m" />
      <dl className="facts" style={{ gridTemplateColumns: "1fr", marginTop: 16 }}>
        <div><dt>Source type</dt><dd>{TYPE_LABEL[r.source.type]}</dd></div>
        <div><dt>{r.source.type === "BUSINESS_QR" || r.source.type === "CAR" ? "QR" : "Link"}</dt><dd>{r.source.linkCode ? (r.source.creatorId ? `${r.source.campaign ?? r.source.label} signup ${r.source.type === "CAR" ? "QR" : "link"}` : r.source.type === "BUSINESS_QR" ? "The card at the register" : "Loopday’s TapMart page") : "Not recorded"}</dd></div>
        <div><dt>Source confidence</dt><dd>{r.source.confidence === "link" ? "Link recorded" : "Source not tracked"}</dd></div>
        <div><dt>First touch</dt><dd>{firstTouch ? `${fmtDayYear(firstTouch)}, ${fmtTime(firstTouch)}` : "Not recorded"}</dd></div>
        <div><dt>Signup range</dt><dd>{first === last ? fmtDayYear(first) : `${fmtDayYear(first)} to ${fmtDayYear(last)}`}</dd></div>
      </dl>
      <p className="t-fact" style={{ marginTop: 12 }}>The first known signup source stays attached.</p>
      <p className="t-fact" style={{ marginTop: 4 }}>Later visits and links do not replace it.</p>
      <Link href={`/design-lab-v3/business/loyalty/members?source=${sourceKey(r)}`} className="btn btn-primary" style={{ marginTop: 16, alignSelf: "flex-start" }}>View members</Link>
      <span className="t-note" style={{ marginTop: 8 }}>Members who signed up in this period.</span>
    </div>
  );
}

export function Attribution({ initial }: { initial: string | null }) {
  const { state } = useLoyalty();
  const c = counts(state);
  const rows = sourceRows(state);
  const [view, setView] = useState<"creators" | "campaigns">("creators");
  const [open, setOpen] = useState<string | null>(initial);
  const shown = view === "creators" ? rows : rows;
  const max = Math.max(1, ...shown.map((r) => r.joined));
  const campaignRows = rows.filter((r) => r.source.creatorId);
  const uniqueRedeemed = state.members.filter((m) => m.redeemed > 0).length;
  const openRow = shown.find((r) => r.key === open) ?? null;
  return (
    <div className="loy attribution">
      <LoyaltyHead title="Attribution" here="Attribution" backHref="/design-lab-v3/business/loyalty" />
      <div className="attr-scope">
        <div className="tabs" role="tablist" aria-label="Group by">
          <button type="button" role="tab" aria-selected={view === "creators"} onClick={() => setView("creators")}>Creators</button>
          <button type="button" role="tab" aria-selected={view === "campaigns"} onClick={() => setView("campaigns")}>Campaigns</button>
        </div>
        <Sheet title="Signup period" variant="menu" triggerClass="link link-plain t-fact-ink attr-period" trigger={<>Signup period: All time<CaretRight size={12} aria-hidden /></>}>
          <button type="button" className="sheet-row" aria-pressed="true"><span>All time</span></button>
          <p className="t-fact" style={{ marginTop: 12 }}>The fixture holds one cohort, Aug 27 to Sep 17, 2026. Other periods are a later feature.</p>
        </Sheet>
      </div>
      {state.members.length === 0 ? (
        <div className="loy-empty" style={{ marginTop: 24 }}><p className="t-object">No members yet.</p><p className="t-fact">Your first signup will appear here.</p><Link href="/design-lab-v3/business/loyalty/qr" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>View QR</Link></div>
      ) : (
        <div className="attr-body">
          <div className="attr-row attr-total">
            <div className="attr-lane-left">
              <span className="t-object">All sources</span>
              <span className="t-fact">From signup to a recorded return.</span>
              <Sheet title="How counts work" variant="full" triggerClass="link t-action" triggerStyle={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} trigger="How counts work">
                <span className="t-note">Design Lab · Fictional preview</span>
                <dl className="facts" style={{ marginTop: 16, gridTemplateColumns: "1fr" }}>
                  <div><dt>Joined</dt><dd>Members who signed up. A signup is not a purchase.</dd></div>
                  <div><dt>Came back</dt><dd>Members with counted visits on two different business days.</dd></div>
                  <div><dt>Redeemed</dt><dd>Members who used at least one reward. Unique members, not redemptions.</dd></div>
                  <div><dt>Scope</dt><dd>Members grouped by their signup source and signup period. Outcomes are counted through the demo snapshot.</dd></div>
                  <div><dt>Scale</dt><dd>The whole cohort has its own scale. Every source shares one scale, set by the largest joined source.</dd></div>
                </dl>
                <p className="t-body" style={{ marginTop: 16 }}>The first known signup source stays attached.</p>
                <p className="t-body" style={{ marginTop: 8 }}>Later visits and links do not replace it.</p>
              </Sheet>
            </div>
            <div className="attr-lane-right"><Descent joined={c.members} returned={c.repeat} redeemed={uniqueRedeemed} max={c.members} size="l" /><span className="t-note attr-scale">Whole cohort scale</span></div>
          </div>
          {campaignRows.length === 0 && <div className="loy-empty" style={{ marginTop: 16 }}><p className="t-object">No members from campaigns yet.</p><p className="t-fact">Share a campaign’s signup link to connect future members.</p><Link href="/design-lab-v3/business/loyalty/qr" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>View QR</Link></div>}
          <div className="attr-grid">
            {shown.map((r) => (
              <button type="button" key={r.key} className="attr-source attr-row obj" onClick={() => setOpen(r.key)} aria-haspopup="dialog">
                <span className="attr-source-head"><span><span className="t-object attr-source-name">{view === "campaigns" && r.source.campaign ? r.source.campaign : r.source.label}</span><span className="t-fact" style={{ display: "block" }}>{view === "campaigns" && r.source.campaign ? `${r.source.label} · ${TYPE_LABEL[r.source.type]}` : r.source.sub}</span></span><CaretRight size={16} aria-hidden className="attr-chevron" /></span>
                <Descent joined={r.joined} returned={r.returned} redeemed={r.redeemed} max={max} size="m" />
              </button>
            ))}
          </div>
        </div>
      )}
      <span className="t-note attr-asof">As of {fmtDayYear(NOW.toISOString())}, {fmtTime(NOW.toISOString())}</span>
      <Link href="/design-lab-v3/business/loyalty" className="link t-action loy-back"><ArrowLeft size={16} aria-hidden />Back</Link>
      {openRow && <SourceDrawer r={openRow} onClose={() => setOpen(null)} />}
    </div>
  );
}

/** Source details: a full height phone layer, a 560px desktop drawer. */
function SourceDrawer({ r, onClose }: { r: SourceRow; onClose: () => void }) {
  return (
    <dialog className="sheet sheet-full attr-drawer" open aria-label={`Source details: ${r.source.label}`} onClose={onClose}>
      <div className="sheet-body">
        <div className="sheet-bar"><span className="sheet-title">{r.source.label}</span><button type="button" className="link link-plain t-action preview-close" onClick={onClose}>Close</button></div>
        <span className="t-fact">{r.source.sub}</span>
        <SourceDetails r={r} />
      </div>
    </dialog>
  );
}
