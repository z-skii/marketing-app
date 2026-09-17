"use client";

import { useState } from "react";
import { Sheet } from "../../../../design-lab-v2/Sheet";
import { Img } from "../../../../design-lab-v2/Img";
import { ASSET, defaultCard, type CardDesign } from "../../../fixtures";

/** Contrast ratio between two hex colours (WCAG). Blocks an unreadable card. */
export function contrast(a: string, b: string): number {
  const lum = (h: string) => { const c = h.replace("#", ""); const v = c.length === 3 ? c.split("").map((x) => x + x).join("") : c.padEnd(6, "0"); const [r, g, bl] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const IMAGES: { src: string; alt: string; label: string; position: string }[] = [
  { src: ASSET("reference-loopday-01"), alt: "Loopday counter, fixture imagery", label: "Counter", position: "72% 50%" },
  { src: ASSET("content-loopday-pour-03"), alt: "Loopday pour, fixture imagery", label: "Pour", position: "50% 50%" },
  { src: ASSET("content-loopday-window-04"), alt: "Loopday window, fixture imagery", label: "Window", position: "50% 50%" },
];

function HexField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  const valid = /^#[0-9a-fA-F]{6}$/.test(text);
  return (
    <label className="create-hex">
      <span className="t-fact-ink">{label}</span>
      <span className="create-hex-row">
        <input type="color" value={valid ? text : value} onChange={(e) => { setText(e.target.value); onChange(e.target.value); }} aria-label={`${label} picker`} />
        <input className="join-input" value={text} maxLength={7} onChange={(e) => { setText(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value); }} aria-label={`${label} hex`} />
      </span>
    </label>
  );
}

/** The card designer controls: logo, names, three hex colours with contrast validation, artwork with change, remove and crop, reward title, brand defaults. */
export function CardControls({ design, onChange }: { design: CardDesign; onChange: (patch: Partial<CardDesign>) => void }) {
  const textOk = contrast(design.bg, design.fg) >= 4.5;
  const labelOk = contrast(design.bg, design.label) >= 3;
  return (
    <div className="create-controls" id="card-controls">
      <div className="create-row">
        <span className="t-fact-ink">Logo</span>
        <span className="create-row-actions">
          <span className="loy-brand-mark" style={{ width: 32, height: 32, color: "var(--v2-ink)" }}>{design.logo === "loop" ? <svg width="24" height="24" viewBox="0 0 28 28" aria-hidden><path d="M21.5 9.5A9 9 0 1 0 23 14" fill="none" stroke="currentColor" strokeWidth="3" /><path d="M23 14h-5" stroke="#B73E28" strokeWidth="3" /></svg> : <span className="t-object">{design.businessName[0]}</span>}</span>
          <Sheet title="Change logo" variant="menu" triggerClass="link t-action" triggerStyle={{ minHeight: 44 }} trigger="Change logo">
            <button type="button" className="sheet-row" aria-pressed={design.logo === "loop"} onClick={(e) => { onChange({ logo: "loop" }); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}><span>Loop mark (approved fixture)</span></button>
            <button type="button" className="sheet-row" aria-pressed={design.logo === "initial"} onClick={(e) => { onChange({ logo: "initial" }); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}><span>Initial letter</span></button>
            <p className="t-note" style={{ marginTop: 12 }}>A local preview asset. No upload occurs; the real logo comes from Brand Kit.</p>
          </Sheet>
        </span>
      </div>
      <label className="join-field"><span className="t-fact-ink">Business name</span><input className="join-input" value={design.businessName} maxLength={20} onChange={(e) => onChange({ businessName: e.target.value })} /></label>
      <label className="join-field"><span className="t-fact-ink">Program name</span><input className="join-input" value={design.programName} maxLength={20} onChange={(e) => onChange({ programName: e.target.value })} /><span className="t-note">Google Wallet shows this as the program. 20 characters.</span></label>
      <div className="create-colours">
        <HexField label="Card colour" value={design.bg} onChange={(v) => onChange({ bg: v })} />
        <HexField label="Text colour" value={design.fg} onChange={(v) => onChange({ fg: v })} />
        <HexField label="Label colour" value={design.label} onChange={(v) => onChange({ label: v })} />
        {(!textOk || !labelOk) && <span className="join-error">Text needs more contrast.</span>}
      </div>
      <div className="create-row create-artwork">
        <span className="t-fact-ink">Artwork</span>
        <span className="create-row-actions">
          <span className="media create-art-thumb">{design.artwork && <Img src={design.artwork} alt="" position={design.artworkPosition} />}</span>
          <Sheet title="Change image" variant="menu" triggerClass="link t-action" triggerStyle={{ minHeight: 44 }} trigger="Change image">
            {IMAGES.map((a) => <button key={a.src} type="button" className="sheet-row" aria-pressed={design.artwork === a.src} onClick={(e) => { onChange({ artwork: a.src, artworkAlt: a.alt, artworkPosition: a.position }); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}><span>{a.label}</span></button>)}
            <p className="t-note" style={{ marginTop: 12 }}>Loopday fixture imagery only. No upload occurs.</p>
          </Sheet>
          {design.artwork && <button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => onChange({ artwork: null, artworkAlt: "" })}>Remove artwork</button>}
        </span>
      </div>
      {design.artwork && <label className="create-colour-row"><span className="t-fact-ink">Crop</span><input type="range" min={0} max={100} value={parseInt(design.artworkPosition) || 50} onChange={(e) => onChange({ artworkPosition: `${e.target.value}% 50%` })} aria-label="Crop position" /><span className="t-note">Apple strip and Google hero</span></label>}
      <label className="join-field"><span className="t-fact-ink">Reward title</span><input className="join-input" value={design.rewardTitle} maxLength={24} onChange={(e) => onChange({ rewardTitle: e.target.value })} /></label>
      <button type="button" className="link t-action" style={{ minHeight: 44, alignSelf: "flex-start" }} onClick={() => onChange({ ...defaultCard })}>Use brand defaults</button>
    </div>
  );
}
