"use client";

import { AppleCard, type CardData } from "@/v3/wallet/Cards";
import { liveProgram, type CardDesign } from "@/v3/examples";
import { QR } from "@/v3/qr";

/**
 * The business's own card as a preview: its name and its brand colours
 * (from the brand kit when one is approved), the example program, and a
 * QR that really opens the business's public TapMart page. Nothing here
 * is issued to a Wallet; the label says so.
 */
export function LoyaltyPreview({ businessName, palette, logoUrl, joinUrl }: { businessName: string; palette: string[]; logoUrl: string | null; joinUrl: string }) {
  const bg = palette[0] && /^#[0-9a-f]{6}$/i.test(palette[0]) ? palette[0] : "#141519";
  const fg = luminance(bg) > 0.5 ? "#121417" : "#F5F4F1";
  const design: CardDesign = { businessName, programName: `${businessName} Rewards`, rewardTitle: "Your reward", bg, fg, label: luminance(bg) > 0.5 ? "#6B7079" : "#A5A9B1", logo: "initial", artwork: logoUrl, artworkAlt: `${businessName} logo`, artworkPosition: "50% 50%" };
  const d: CardData = { design, program: { ...liveProgram, card: design }, firstName: "Member", memberId: "PREVIEW", code: "preview", progress: 0, ready: 0, state: "collecting" };
  return (
    <>
      <div className="v3" style={{ background: "transparent" }}><AppleCard d={d} width={320} /></div>
      <p className="t-meta" style={{ textAlign: "center" }}>Preview on your brand colours. No pass is issued to any Wallet today.</p>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,0.08)" }}>
        <span style={{ display: "inline-grid", placeItems: "center", width: 72, height: 72, borderRadius: 12, background: "#fff", color: "#121417" }}><QR value={joinUrl} size={64} label={`QR code for ${joinUrl}`} ink="#121417" /></span>
        <span style={{ minWidth: 0 }}><b style={{ display: "block", fontSize: 14, fontWeight: 600 }}>Your TapMart page</b><span className="t-meta" style={{ display: "block", overflowWrap: "anywhere" }}>{joinUrl}</span><span className="t-meta" style={{ display: "block" }}>Joining will point here when Loyalty opens.</span></span>
      </div>
    </>
  );
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
