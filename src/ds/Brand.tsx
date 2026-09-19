/** The TapMart mark and wordmark on the product tokens: the offset frame in TapMart red, the name in ink. */
export function Mark({ size = 28, className = "", color = "var(--tm-red)" }: { size?: number; className?: string; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className} fill={color}>
      <path d="M3 3H19V9H9V23H3Z" />
      <path d="M13 23H23V9H29V29H13Z" />
    </svg>
  );
}

export function Wordmark({ size = 24, dark = false, className = "" }: { size?: number; dark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display font-700 tracking-[-0.04em] ${className}`} style={{ fontSize: size, lineHeight: `${size + 2}px`, color: dark ? "var(--env-on-dark)" : "var(--tm-text)" }}>
      <Mark size={Math.round(size * 0.95)} />
      <span>TapMart</span>
    </span>
  );
}
