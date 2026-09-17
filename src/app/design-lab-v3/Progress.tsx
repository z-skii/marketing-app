"use client";

import type { Member, Program } from "./fixtures";

/**
 * Progress strokes: five equal 4px strokes separated by 8px, ink when
 * earned, a 1px muted outline when not. Points programs use one measured
 * ink rule. Only the newly earned stroke fills (220ms from its left edge);
 * reduced motion swaps instantly. No lime, no dashed next mark.
 */
export function Marks({ m, p, size = "m", live = false }: { m: Member; p: Program; size?: "s" | "m" | "l"; live?: boolean }) {
  const ready = m.ready > 0;
  if (p.kind === "points") {
    const pct = ready ? 100 : Math.min(100, Math.round((m.progress / p.requirement) * 100));
    return (
      <span className={`marks marks-bar marks-${size}`} role="img" aria-label={ready ? "Reward ready" : `${m.progress} of ${p.requirement} points`} data-ready={ready ? "true" : undefined} data-live={live ? "true" : undefined}>
        <span className="marks-bar-fill" style={{ width: `${pct}%` }} />
      </span>
    );
  }
  const shown = ready ? p.requirement : m.progress;
  return (
    <span className={`marks marks-${size}`} role="img" aria-label={ready ? "Reward ready" : `${m.progress} of ${p.requirement} visits`} data-ready={ready ? "true" : undefined} data-live={live ? "true" : undefined}>
      {Array.from({ length: p.requirement }, (_, i) => <span key={i} className="mark" data-on={i < shown ? "true" : "false"} data-new={live && i === shown - 1 ? "true" : undefined} />)}
    </span>
  );
}

/** The descent: three ink ledges of measured length ending in a brick terminal, the count and label outside in a fixed column. A zero is no stroke. */
export function Descent({ joined, returned, redeemed, max, size = "m" }: { joined: number; returned: number; redeemed: number; max: number; size?: "s" | "m" | "l" }) {
  const w = (n: number) => (max > 0 ? `${Math.round((n / max) * 1000) / 10}%` : "0%");
  const row = (n: number, label: string) => (
    <span className="descent-row">
      <span className="descent-rule">{n > 0 && <span className="descent-ledge" style={{ width: w(n) }} />}</span>
      <span className="descent-n">{n}<span className="descent-lbl">{label}</span></span>
    </span>
  );
  return (
    <span className={`descent descent-${size}`} role="img" aria-label={`${joined} joined, ${returned} came back, ${redeemed} redeemed`}>
      {row(joined, "Joined")}{row(returned, "Came back")}{row(redeemed, "Redeemed")}
    </span>
  );
}
