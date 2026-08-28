/**
 * The platform's own icon set: tiny geometric marks drawn to match the
 * broadcast-terminal identity — hairline strokes, square corners, one accent.
 * Each icon is decorative; the accessible name lives in adjacent sr-only text.
 */

type IconProps = { className?: string };

const base = "inline-block shrink-0 align-[-0.125em]";

/** Visitors: a presence — head over shoulders, cut like a cameo. */
export function VisitorsIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"
      className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.3"
    >
      <circle cx="6" cy="3.6" r="2.1" />
      <path d="M1.8 10.6c0-2.4 1.9-3.6 4.2-3.6s4.2 1.2 4.2 3.6" />
    </svg>
  );
}

/** On now: a live transmission — center pulse with radiating arcs. */
export function LiveNowIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"
      className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.3"
    >
      <circle cx="6" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <path d="M3.2 8.8a4 4 0 0 1 0-5.6M8.8 3.2a4 4 0 0 1 0 5.6" />
    </svg>
  );
}

/** Reset: the day's clock — a dial with the hand at a minute to midnight. */
export function ResetIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"
      className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.3"
    >
      <circle cx="6" cy="6" r="4.6" />
      <path d="M6 3.4V6l1.8 1.2" />
    </svg>
  );
}

/** Spent: outflow — value leaving the tray. */
export function SpentIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"
      className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.3"
    >
      <path d="M1.8 7.4v2.8h8.4V7.4" />
      <path d="M6 7.2V1.6M3.6 4 6 1.6 8.4 4" />
    </svg>
  );
}

/** Remaining: the fuel gauge — what is still in the tank. */
export function RemainingIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"
      className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.3"
    >
      <rect x="1.2" y="3.8" width="8.4" height="4.4" />
      <path d="M10.8 5.4v1.2" />
      <rect x="2.4" y="5" width="3" height="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Opens: the cursor — a tap that went through. */
export function OpensIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"
      className={`${base} ${className}`} fill="currentColor" stroke="none"
    >
      <path d="M3.2 1.2v8.4l2.3-2.1 1.4 3.1 1.5-.7-1.4-3 3-.3z" />
    </svg>
  );
}

/** Open: the outbound arrow — a tap leaving for its destination. */
export function OpenArrowIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"
      className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.4"
    >
      <path d="M2.6 9.4 9.2 2.8M4.4 2.6h5v5" />
    </svg>
  );
}

/** Details: the info tile. */
export function DetailsIcon({ className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"
      className={`${base} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.3"
    >
      <rect x="1.5" y="1.5" width="9" height="9" />
      <path d="M6 5.6v3" />
      <circle cx="6" cy="3.7" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
