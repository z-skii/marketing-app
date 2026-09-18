"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { Sheet } from "../../../design-lab-v2/Sheet";
import { Img } from "../../../design-lab-v2/Img";
import { fmtDayYear, fmtTime } from "../../fixtures";
import { counts, recentMembers, sourceRows, todayKey, useLoyalty } from "../../store";
import { Descent } from "../../Progress";
import { LoyaltyHead } from "./LoyaltyCrumb";
import { Logo } from "../../wallet/Cards";
import { M } from "../../x/media";

/** One of the four program counts as a ledge in the approved Loyalty language: an operable target that opens its definition and the matching member view. */
function Count({ n, label, def, href, k }: { n: number; label: string; def: string; href: string; k: number }) {
  return (
    <Sheet title={label} variant="menu" triggerClass="xs-ledge-btn x-lp2-ledge" trigger={<><span className="x-lp2-ledge-bar" style={{ ["--k" as string]: k }} /><span className="x-lp2-ledge-value"><span className="x-lp2-ledge-n">{n}</span><span className="x-lp2-ledge-l">{label}</span></span></>}>
      <p className="t-name" style={{ marginTop: 8 }}>{n}</p>
      <p className="t-body" style={{ marginTop: 8 }}>{def}</p>
      <Link href={href} className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", marginTop: 16 }}>View</Link>
    </Sheet>
  );
}

/**
 * Loyalty Home in the approved Loyalty loop language: the campaign
 * creative and its source with the returns it produced, the program
 * object with the four program counts as ledges, three recent customers,
 * then the quiet working actions. One filled action in the head. States: no
 * program, draft, live with no members, live, points.
 */
export function LoyaltyHome() {
  const { state } = useLoyalty();
  const p = state.program;
  const c = counts(state);
  const points = p.kind === "points";
  const status = p.status;
  const draft = state.draft;
  const recent = recentMembers(state, 3);
  const lead = sourceRows(state).find((r) => r.source.creatorId) ?? null;
  const unit = points ? "Points" : "Visits";
  const withWallet = state.members.filter((m) => m.wallet !== "none").length;
  const usedToday = state.updates.some((u) => (u.kind === "offer" || u.kind === "promotion" || u.kind === "milestone") && u.at.startsWith(todayKey(state)));
  const lastUpdate = state.updates[0] ?? null;
  const primary = status === "none" && !draft ? { href: "/design-lab-v3/business/loyalty/create", label: "Create program" } : status !== "live" && draft ? { href: "/design-lab-v3/business/loyalty/create?step=card", label: "Continue setup" } : c.members === 0 ? { href: "/design-lab-v3/business/loyalty/qr", label: "View QR" } : { href: "/design-lab-v3/business/loyalty/record", label: points ? "Add points" : "Add visit" };
  const artwork = (design: typeof p.card) => <Link href="/design-lab-v3/business/loyalty/program" className="loy-program-art media" aria-label="View program">{design.artwork ? <Img src={design.artwork} alt="" position={design.artworkPosition} /> : <span className="loy-program-solid" style={{ background: design.bg, color: design.fg }}><Logo design={design} size={48} /></span>}</Link>;
  return (
    <div className="loy loy-home" data-status={status === "live" ? (c.members === 0 ? "live-empty" : "live") : draft ? "draft" : "none"}>
      <LoyaltyHead title="Loyalty" action={<Link href={primary.href} className="btn btn-primary loy-primary">{primary.label}</Link>} />
      {status === "none" && !draft && (
        <section className="loy-none">
          <span className="loy-loop-lg" style={{ color: "var(--v2-ink)" }}><Logo design={p.card} size={64} /></span>
          <p className="t-object">Turn visits into rewards.</p>
        </section>
      )}
      {status !== "live" && draft && (
        <section className="loy-draft obj">
          {artwork(draft.card)}
          <div className="loy-program-facts">
            <span className="t-fact-ink">Draft</span>
            <span className="t-object">{draft.reward.name}</span>
            <span className="t-fact">{draft.requirement} {draft.kind === "visits" ? "visits" : "points"}</span>
            <span className="t-fact">Last completed: {["Program", "Program", "Reward", "Card", "Signup", "Launch"][Math.max(0, Math.min(5, draft.draftStep))]}</span>
            <Link href="/design-lab-v3/business/loyalty/create?step=card" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Preview card</Link>
          </div>
        </section>
      )}
      {status === "live" && (
        <>
          {/* the loop, in the approved public language: the campaign creative and its source with the returns it produced; the program object with what the whole program holds */}
          <section className="xs-loop" aria-label="The loop">
            <div className="xs-loop-source">
              <span className="xs-plane xs-loop-story" style={{ cursor: "default" }}><img src={M.story(480)} alt="Loopday Story creative: Take a coffee break." width={480} height={853} decoding="async" /></span>
              <div className="xs-loop-facts">
                <span className="t-fact">Joined from</span>
                {lead ? <Link href={`/design-lab-v3/business/loyalty/attribution?source=${lead.key}`} className="xs-loop-name">{lead.source.label}</Link> : <span className="t-body">Your first signup will appear here.</span>}
                {lead && <span className="t-fact">{lead.source.sub}</span>}
                {lead && (
                  <div className="xs-ledges" style={{ marginTop: 12 }} aria-label={`From ${lead.source.label}`}>
                    {([[lead.joined, "Joined"], [lead.returned, "Came back"], [lead.redeemed, "Redeemed"]] as const).map(([n, l]) => (
                      <span key={l} className="x-lp2-ledge"><span className="x-lp2-ledge-bar" style={{ ["--k" as string]: Math.max(0.12, n / Math.max(1, lead.joined)) }} /><span className="x-lp2-ledge-value"><span className="x-lp2-ledge-n">{n}</span><span className="x-lp2-ledge-l">{l}</span></span></span>
                    ))}
                  </div>
                )}
                <Link href="/design-lab-v3/business/loyalty/attribution" className="link t-action loy-source-link" style={{ marginTop: 8 }}>View attribution</Link>
              </div>
            </div>
            <div>
              <div className="xs-loop-program">
                <Link href="/design-lab-v3/business/loyalty/program" className="xs-plane xs-loop-card" aria-label="View program">{p.card.artwork ? <Img src={p.card.artwork} alt="" position={p.card.artworkPosition} /> : <span className="loy-program-solid" style={{ background: p.card.bg, color: p.card.fg }}><Logo design={p.card} size={48} /></span>}</Link>
                <div className="xs-loop-facts">
                  <span className="loy-brand-mark loy-program-mark" style={{ color: "var(--v3-ink)" }}><Logo design={p.card} size={28} /></span>
                  <span className="t-object">{p.reward.name}</span>
                  <span className="t-fact">{p.requirement} {points ? "points" : "visits"}</span>
                  <Sheet title="Live · simulated" variant="menu" triggerClass="link link-plain t-fact-ink loy-live" trigger="Live">
                    <p className="t-body" style={{ marginTop: 8 }}>This program exists only in the Design Lab.</p>
                    {lastUpdate && <details className="disclosure" style={{ marginTop: 8 }}><summary className="t-action">Last Wallet update</summary><p className="t-fact-ink" style={{ marginTop: 8 }}>{lastUpdate.title}</p><p className="t-fact">{fmtDayYear(lastUpdate.at)}, {fmtTime(lastUpdate.at)}</p><p className="t-fact">Wallet update simulated. Nothing was sent.</p><Link href="/design-lab-v3/business/loyalty/updates" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>View update history</Link></details>}
                    <Link href="/design-lab-v3/business/loyalty/program" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", marginTop: 8 }}>View program</Link>
                  </Sheet>
                </div>
              </div>
              <div className="xs-ledges" style={{ marginTop: 16 }} aria-label="Counts">
                <Count n={c.members} label="Members" k={1} def="Members who signed up, including people who have not added Wallet." href="/design-lab-v3/business/loyalty/members" />
                <Count n={c.repeat} label="Came back" k={Math.max(0.12, c.repeat / Math.max(1, c.members))} def="Members with counted visits on two different days. Signup plus one visit is not a return." href="/design-lab-v3/business/loyalty/members?filter=repeat" />
                <Count n={c.ready} label="Reward ready" k={Math.max(0.12, c.ready / Math.max(1, c.members))} def="Earned rewards waiting to be redeemed. Reward instances, not necessarily unique members." href="/design-lab-v3/business/loyalty/members?filter=ready" />
                <Count n={c.redeemed} label="Redeemed" k={Math.max(0.12, c.redeemed / Math.max(1, c.members))} def="Redemption events. A member who redeemed twice counts twice here and once in attribution." href="/design-lab-v3/business/loyalty/members?filter=redeemed" />
              </div>
            </div>
          </section>
          <div className="loy-grid">
            <section className="loy-recent">
              {recent.length === 0 ? (
                <div className="loy-empty loy-empty-recent"><p className="t-object">No members yet.</p><p className="t-body">Share your QR to start.</p></div>
              ) : (
                <>
                  <div className="loy-sec-head"><h3 className="t-object">Recent customers</h3><span className="t-fact">{unit}</span></div>
                  <ul className="loy-recent-list">
                    {recent.map((m) => (
                      <li key={m.id}><Link href={`/design-lab-v3/business/loyalty/members/${m.id}`} className="loy-recent-row obj"><span className="t-object">{m.firstName}</span><span className="loy-recent-val t-object">{m.ready > 0 ? "Reward ready" : m.redeemed > 0 && m.progress === 0 ? "Redeemed" : `${m.progress} / ${p.requirement}`}</span><CaretRight size={20} aria-hidden /></Link></li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
          <div className="loy-actions">
            {c.members > 0 && <Link href="/design-lab-v3/business/loyalty/qr" className="link t-action">View QR</Link>}
            <Link href="/design-lab-v3/business/loyalty/members" className="link t-action">Members</Link>
            <span className="loy-action-col">
              {withWallet === 0 ? <><span className="link t-action" aria-disabled="true" style={{ opacity: 0.5 }}>Send update</span><span className="t-fact">No members with Wallet.</span></> : usedToday ? <><Link href="/design-lab-v3/business/loyalty/updates" className="link t-action">Send update</Link><span className="t-fact">Update already used today.</span></> : <><Link href="/design-lab-v3/business/loyalty/updates/new" className="link t-action">Send update</Link><span className="t-fact">Wallet update · once a day</span></>}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
