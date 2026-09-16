
/**
 * Frame Shift primitives shared by every migrated production screen: the
 * offset-frame mark and wordmark, avatars, and money. Server-renderable;
 * nothing here reads data.
 */

/** The offset-frame mark: two frame halves; the negative space is the recognisable part. */
export function Mark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className} fill="currentColor">
      <path d="M3 3H19V9H9V23H3Z" />
      <path d="M13 23H23V9H29V29H13Z" />
    </svg>
  );
}

export function Wordmark({ dark = false, size = 30 }: { dark?: boolean; size?: number }) {
  return (
    <span className="fs-display" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: size, lineHeight: `${size + 2}px`, letterSpacing: "-0.04em", color: dark ? "var(--fs-on-dark)" : "var(--fs-ink)" }}>
      <span style={{ display: "inline-flex", color: dark ? "var(--fs-focus-dark)" : "var(--fs-accent)" }}><Mark size={28} /></span>
      <span>TapMart</span>
    </span>
  );
}

/** A person or business avatar; initials on the underlay when there is no image. Never a placeholder photo. */
export function Avatar({ src, name, size = 40, square = false }: { src: string | null | undefined; name: string; size?: number; square?: boolean }) {
  const radius = square ? 8 : "50%";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", flexShrink: 0 }} />;
  }
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return <span aria-hidden style={{ display: "inline-grid", placeItems: "center", width: size, height: size, borderRadius: radius, background: "var(--fs-underlay)", color: "var(--fs-ink)", fontWeight: 600, fontSize: Math.round(size * 0.4), flexShrink: 0 }}>{initial}</span>;
}

/** Frame Shift money always keeps its cents: $75.00, never $75. */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}

/** An amount and its basis. The amount never animates and is always tabular. */
export function Money({ cents, per, className = "fs-money", dark = false }: { cents: number; per?: string; className?: string; dark?: boolean }) {
  return (
    <span style={{ display: "block" }}>
      <span className={className} style={{ display: "block", color: dark ? "#fff" : "var(--fs-ink)" }}>{formatMoney(cents)}</span>
      {per && <span className="fs-t-meta" style={{ display: "block", color: dark ? "#FFFFFF" : undefined }}>{per}</span>}
    </span>
  );
}

/** Literal status text; colour only ever accompanies a word. */
export function Status({ tone, children, className = "" }: { tone: "confirmed" | "waiting" | "problem" | "neutral"; children: React.ReactNode; className?: string }) {
  return <span className={`fs-status is-${tone} ${className}`}>{children}</span>;
}
