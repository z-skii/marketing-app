"use client";

import type { CSSProperties } from "react";
import { QR } from "../qr";
import { useOrigin } from "../useOrigin";
import { Img } from "../../design-lab-v2/Img";
import type { CardDesign, Program } from "../fixtures";

/**
 * Simulated Wallet cards drawn to each platform's documented anatomy
 * (docs/design-lab-v3/WALLET_RESEARCH.md) and the director's spec. Apple:
 * a store card at 375 reference width; a 60px header with the rectangular
 * logo and logo text at left and the one header field (Visits) at right;
 * a full width 375:123 strip of the program's artwork; Reward and Member
 * as secondary fields on one row, Status as the auxiliary field below; a complete black on white member QR with a four module
 * quiet zone and the readable member ID. Google: a 72px header with the
 * program name first and the issuer beneath; a 3:1 hero; the Visits and
 * Rewards balances; Member and Member ID; the member QR. Design Lab
 * representations: no shadow, nothing signed, issued or saved.
 */

export type CardState = "collecting" | "ready" | "redeemed" | "updated";

export type CardData = { design: CardDesign; program: Program; firstName: string; memberId: string; code: string; qr?: string; progress: number; ready: number; state: CardState; offer?: { title: string; body: string } | null; publicSubset?: boolean };

export function Logo({ design, size = 28, style, className = "" }: { design: CardDesign; size?: number; style?: CSSProperties; className?: string }) {
  if (design.logo === "initial") return <span className={`wc-logo wc-logo-initial ${className}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.5), ...style }} aria-hidden>{design.businessName.trim()[0] ?? "L"}</span>;
  // The approved fixture mark: an open loop with a short brick terminal, a return made visible.
  return (
    <svg className={`wc-logo ${className}`} width={size} height={size} viewBox="0 0 28 28" aria-hidden style={style}>
      <path d="M22.1 9.6A9 9 0 1 0 22.1 18.4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="butt" />
      <path d="M22.1 18.4l2.4 -4.2" stroke="#B73E28" strokeWidth="3" strokeLinecap="butt" />
    </svg>
  );
}

/** The payload every member QR carries: that member's own demo card address, so the counter scanner and the card agree. */
export const cardUrl = (origin: string, code: string) => `${origin}/design-lab-v3/card/${code}`;

const unit = (p: Program) => (p.kind === "visits" ? "Visits" : "Points");
const QR_PX = 176;

/** Apple Wallet store card concept. */
export function AppleCard({ d, width = 375, className = "" }: { d: CardData; width?: number; className?: string }) {
  const origin = useOrigin();
  const { design, program: p } = d;
  const primary = d.state === "ready" ? `${p.requirement} of ${p.requirement}` : `${d.progress} of ${p.requirement}`;
  const status = d.state === "ready" ? "Reward ready" : d.state === "redeemed" ? "Reward redeemed" : "Collecting";
  const scale = width / 375;
  return (
    <div className={`wc wc-apple ${className}`} style={{ width, background: design.bg, color: design.fg, ["--wc-label" as string]: design.label, ["--wc-bg" as string]: design.bg, ["--wc-scale" as string]: scale }} data-state={d.state} role="img" aria-label={`Apple Wallet store card concept: ${design.businessName}, ${unit(p)} ${primary}, ${status}`}>
      <div className="wc-apple-top">
        <span className="wc-apple-brand"><span className="wc-apple-logo"><Logo design={design} size={22} /></span><span className="wc-apple-logotext">{design.businessName}</span></span>
        <span className="wc-field wc-field-right wc-apple-header"><span className="wc-label">{unit(p)}</span><span className="wc-value wc-value-header">{primary}</span></span>
      </div>
      <div className="wc-apple-strip">{design.artwork ? <Img src={design.artwork} alt="" position={design.artworkPosition} /> : <span className="wc-apple-strip-plain" />}</div>
      <div className="wc-apple-fields">
        {d.publicSubset ? (
          <span className="wc-field wc-field-wide"><span className="wc-label">Reward</span><span className="wc-value">{design.rewardTitle}</span></span>
        ) : (
          <><span className="wc-field"><span className="wc-label">Reward</span><span className="wc-value">{design.rewardTitle}</span></span>
          <span className="wc-field wc-field-right"><span className="wc-label">Member</span><span className="wc-value">{d.firstName}</span></span></>
        )}
        <span className="wc-field wc-field-wide"><span className="wc-label">Status</span><span className="wc-value">{status}</span></span>
      </div>
      <div className="wc-apple-code"><span className="wc-qr" style={{ width: Math.round(QR_PX * scale), height: Math.round(QR_PX * scale) }}><QR value={d.qr ?? cardUrl(origin, d.code)} size={Math.round(QR_PX * scale)} label="" ink="#111" paper="#fff" quiet={4} /></span>{!d.publicSubset && <span className="wc-code-alt">{d.memberId}</span>}</div>
    </div>
  );
}

/** Google Wallet loyalty card concept. */
export function GoogleCard({ d, width = 375, className = "" }: { d: CardData; width?: number; className?: string }) {
  const origin = useOrigin();
  const { design, program: p } = d;
  const balance = d.state === "ready" ? `${p.requirement}/${p.requirement}` : `${d.progress}/${p.requirement}`;
  const rewards = d.state === "ready" ? String(Math.max(1, d.ready)) : "0";
  const scale = width / 375;
  return (
    <div className={`wc wc-google ${className}`} style={{ width, background: design.bg, color: design.fg, ["--wc-label" as string]: design.label, ["--wc-scale" as string]: scale }} data-state={d.state} role="img" aria-label={`Google Wallet loyalty card concept: ${design.programName} by ${design.businessName}, ${unit(p)} ${balance}, Rewards ${rewards}`}>
      <div className="wc-google-head">
        <span className="wc-google-logo" style={{ color: design.bg }}><Logo design={design} size={22} /></span>
        <span className="wc-google-names"><span className="wc-google-program">{design.programName}</span><span className="wc-google-issuer">{design.businessName}</span></span>
      </div>
      <div className="wc-google-hero">{design.artwork ? <Img src={design.artwork} alt="" position={design.artworkPosition} /> : <span className="wc-apple-strip-plain" />}</div>
      <div className="wc-google-row">
        <span className="wc-field"><span className="wc-label">{unit(p)}</span><span className="wc-value wc-value-big">{balance}</span></span>
        <span className="wc-field wc-field-right"><span className="wc-label">Rewards</span><span className="wc-value wc-value-big">{rewards}</span></span>
      </div>
      <div className="wc-google-row wc-google-row-member">
        <span className="wc-field"><span className="wc-label">Member</span><span className="wc-value">{d.firstName}</span></span>
        <span className="wc-field wc-field-right"><span className="wc-label">Member ID</span><span className="wc-value">{d.memberId}</span></span>
      </div>
      <div className="wc-google-code"><span className="wc-qr" style={{ width: Math.round(QR_PX * scale), height: Math.round(QR_PX * scale) }}><QR value={d.qr ?? cardUrl(origin, d.code)} size={Math.round(QR_PX * scale)} label="" ink="#111" paper="#fff" quiet={4} /></span></div>
    </div>
  );
}

/** The back of the pass (Apple back fields) or the pass details (Google text modules): requirement, reward, status, terms, member ID, offer, and what may notify. */
export function CardDetails({ d, platform }: { d: CardData; platform: "apple" | "google" }) {
  const p = d.program;
  const status = d.state === "ready" ? "Reward ready" : d.state === "redeemed" ? "Reward redeemed" : "Collecting";
  return (
    <dl className={`wc-details wc-details-${platform}`}>
      <div><dt>Reward</dt><dd>{p.reward.name}</dd></div>
      <div><dt>Requirement</dt><dd>{p.requirement} {p.kind === "visits" ? "visits" : "points"} = {p.reward.name}</dd></div>
      <div><dt>Status</dt><dd>{status}{d.state === "ready" && d.progress > 0 ? `. ${d.progress} ${d.progress === 1 ? (p.kind === "visits" ? "visit" : "point") : (p.kind === "visits" ? "visits" : "points")} toward your next reward.` : ""}</dd></div>
      {d.offer && <div><dt>Offer</dt><dd>{d.offer.title}. {d.offer.body}</dd></div>}
      <div><dt>Member ID</dt><dd>{d.memberId}</dd></div>
      <div><dt>Terms</dt><dd>{p.reward.terms}</dd></div>
      <div><dt>{platform === "apple" ? "Change messages" : "Notifications"}</dt><dd>{platform === "apple" ? "Only a ready or redeemed reward may interrupt: “Your reward is ready.” or “Your reward was redeemed.” Offers change the card silently. Nothing is sent in this preview." : "A changed balance or a new message may notify, within a shared allowance of three a day per card. Presentation is the platform’s. Nothing is sent in this preview."}</dd></div>
    </dl>
  );
}

export function PlatformLabel({ platform, above = true }: { platform: "apple" | "google"; above?: boolean }) {
  return above ? <span className="t-fact-ink wc-platform-label">{platform === "apple" ? "Design Lab · Apple Wallet concept" : "Design Lab · Google Wallet concept"}</span> : <span className="t-note wc-platform-note">No pass is issued.</span>;
}
