
import type { CSSProperties } from "react";

import { money } from "../examples";

/**
 * Shared parts of the V3 production surfaces:
 * a paper phone tab bar with a 2px ink underline, an 80px tablet rail, a
 * 200px paper desktop sidebar, the typeset wordmark with its brick
 * terminal, avatars, money. Icons are Phosphor at regular weight (the
 * project's bundled family) at the sizes the director specified for the
 * Lucide names.
 */

/** The wordmark: Bricolage Grotesque 700, tracking -0.04em, with the 12x2 brick terminal under its final portion. */
export function Wordmark({ size = 22, onInk = false, style, className = "" }: { size?: number; onInk?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <span className={`t-display ${className}`} style={{ position: "relative", display: "inline-block", fontSize: size, lineHeight: 1, letterSpacing: "-0.04em", color: onInk ? "var(--v2-paper)" : "var(--v2-ink)", paddingBottom: 4, ...style }}>
      TapMart
      <span aria-hidden style={{ position: "absolute", right: 0, bottom: 0, width: 12, height: 2, background: "var(--v2-accent)" }} />
    </span>
  );
}

export function Avatar({ src, name, initials, size = 40 }: { src: string | null; name: string; initials?: string; size?: number }) {
  return (
    <span className="avatar" aria-hidden style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" width={size} height={size} /> : (initials ?? name.trim()[0]?.toUpperCase())}
    </span>
  );
}

/** Money: DM Sans 600, tabular lining numerals. Discovery drops needless .00; balances keep two decimals. */
export function Money({ cents, basis, size = "money", whole = false, onInk = false, basisInk = false, inline = false }: { cents: number; basis?: string; size?: "money" | "money-compact" | "money-metric" | "money-public" | "money-balance"; whole?: boolean; onInk?: boolean; basisInk?: boolean; inline?: boolean }) {
  const amount = money(cents, { cents: !whole });
  if (inline) {
    return (
      <span style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
        <span className={size} style={{ color: onInk ? "var(--v2-paper)" : undefined }}>{amount}</span>
        {basis && <span className={basisInk ? "t-fact-ink" : "t-fact"} style={{ color: onInk ? "var(--v2-inverse-muted)" : undefined }}>{basis}</span>}
      </span>
    );
  }
  return (
    <span style={{ display: "block" }}>
      <span className={size} style={{ display: "block", color: onInk ? "var(--v2-paper)" : undefined }}>{amount}</span>
      {basis && <span className={basisInk ? "t-fact-ink" : "t-fact"} style={{ display: "block", marginTop: 4, color: onInk ? "var(--v2-inverse-muted)" : undefined }}>{basis}</span>}
    </span>
  );
}

/** The earning edge: a 2px ink line with a 12px brick terminal. */
export function Edge({ left = false, style, className = "" }: { left?: boolean; style?: CSSProperties; className?: string }) {
  return <span aria-hidden className={`edge${left ? " edge-left" : ""} ${className}`} style={{ display: "block", ...style }} />;
}

