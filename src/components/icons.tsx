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
