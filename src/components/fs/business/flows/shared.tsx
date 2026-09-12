"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { formatMoney } from "@/components/fs/parts";
import { PlacementDiagram } from "@/components/fs/business/PlacementDiagram";

/** Small pieces the three creation flows share. */
const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export function todayPlus(days: number): string {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dayWord(day: string): string {
  if (!day) return "";
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${day}T00:00:00Z`));
}

/** Preset amounts as real radio buttons; the chosen one is filled. */
export function Presets({ values, current, onPick, money = false, suffix = "" }: { values: number[]; current: string; onPick: (v: string) => void; money?: boolean; suffix?: string }) {
  return (
    <div className="fs-presets" role="radiogroup" aria-label="Common choices">
      {values.map((v) => {
        const on = Number(current) === v;
        return (
          <label key={v} className={`fs-preset${on ? " is-on" : ""}`}>
            <input type="radio" className="fs-sr" name="preset" checked={on} onChange={() => onPick(String(v))} />
            <span className="fs-tnum">{money ? formatMoney(v * 100) : v}{suffix}</span>
          </label>
        );
      })}
    </div>
  );
}

/** Requirement chips: suggestions to add with one tap, plus a custom line. Each chip removes itself. */
export function CustomChips({ values, onChange, suggestions, max = 12 }: { values: string[]; onChange: (v: string[]) => void; suggestions: string[]; max?: number }) {
  const [custom, setCustom] = useState("");
  const add = (v: string) => { const t = v.trim().slice(0, 200); if (t && !values.includes(t) && values.length < max) onChange([...values, t]); };
  return (
    <div>
      <ul className="fs-chips" aria-label="Chosen">
        {values.map((v) => (
          <li key={v}><span className="fs-chip is-on">{v}<button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}><X size={14} aria-hidden /></button></span></li>
        ))}
        {values.length === 0 && <li className="fs-t-meta">Nothing yet.</li>}
      </ul>
      {suggestions.filter((s) => !values.includes(s)).length > 0 && (
        <ul className="fs-chips" aria-label="Suggestions" style={{ marginTop: 8 }}>
          {suggestions.filter((s) => !values.includes(s)).map((s) => (
            <li key={s}><button type="button" className="fs-chip" onClick={() => add(s)}>+ {s}</button></li>
          ))}
        </ul>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 8, maxWidth: 420 }}>
        <input className="fs-input" value={custom} maxLength={200} placeholder="Add your own" aria-label="Add a requirement" onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(custom); setCustom(""); } }} />
        <button type="button" className="fs-btn fs-btn-secondary" disabled={!custom.trim()} onClick={() => { add(custom); setCustom(""); }}>Add</button>
      </div>
    </div>
  );
}

/** The Recreate source: the reference as it is, or the honest absence of one. */
export function ReferenceSource({ mediaUrl, link, businessName }: { mediaUrl: string; link: string; businessName: string }) {
  return (
    <div className="fs-flow-ref">
      {mediaUrl ? (
        VIDEO.test(mediaUrl) ? (
          <video className="fs-media fs-flow-ref-media" src={mediaUrl} controls muted playsInline preload="metadata" aria-label="Your reference video" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="fs-media fs-flow-ref-media" src={mediaUrl} alt="Your reference" />
        )
      ) : (
        <div className="fs-media fs-flow-ref-media fs-flow-empty" aria-hidden><span className="fs-t-meta">Reference</span></div>
      )}
      <p className="fs-t-meta" style={{ marginTop: 8 }}>{mediaUrl ? "Your reference" : link ? `Linked Reel · ${safeHost(link)}` : `${businessName} · No reference yet`}</p>
    </div>
  );
}

/** The Story source: the supplied 9:16 creative, or the honest absence of one. */
export function StorySource({ creativeUrl, businessName }: { creativeUrl: string; businessName: string }) {
  return (
    <div className="fs-flow-ref">
      {creativeUrl ? (
        VIDEO.test(creativeUrl) ? (
          <video className="fs-media fs-flow-story" src={creativeUrl} controls muted playsInline preload="metadata" aria-label="Your Story creative" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="fs-media fs-flow-story" src={creativeUrl} alt="Your Story creative" />
        )
      ) : (
        <div className="fs-media fs-flow-story fs-flow-empty" aria-hidden><span className="fs-t-meta">9:16 creative</span></div>
      )}
      <p className="fs-t-meta" style={{ marginTop: 8 }}>{creativeUrl ? "Your Story creative, posted as it is" : `${businessName} · No creative yet`}</p>
    </div>
  );
}

/** The Car source: the placement diagram and, separately, the artwork if there is one. Never composited. */
export function CarSource({ zones, artworkUrl }: { zones: string[]; artworkUrl: string }) {
  return (
    <div className="fs-flow-ref">
      <div style={{ border: "1px solid var(--fs-divider)", background: "#fff" }}><PlacementDiagram zones={zones} width={448} /></div>
      <p className="fs-t-meta" style={{ marginTop: 8 }}>{zones.length ? `Placement${zones.length === 1 ? "" : "s"} you chose, on a diagram` : "No placement chosen yet"}</p>
      {artworkUrl && (
        <div style={{ marginTop: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="fs-media" src={artworkUrl} alt="Your artwork" style={{ width: 160, height: "auto", display: "block" }} />
          <p className="fs-t-meta" style={{ marginTop: 4 }}>Your artwork, shown as artwork</p>
        </div>
      )}
    </div>
  );
}

function safeHost(url: string): string {
  try { return new URL(url).host.replace(/^www\./, ""); } catch { return "link"; }
}
