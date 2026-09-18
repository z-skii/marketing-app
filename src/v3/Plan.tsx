/** The supported rear door zone on a simple side elevation: a flat plan, never a wrap painted onto the photographed car. Same drawing as the V2 diagram, with a valid intrinsic height. */
export function Plan({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 1200 800" width="100%" aria-hidden style={{ display: "block", height: "auto" }}>
      <line x1="80" y1="620" x2="1120" y2="620" stroke="var(--v3-line)" strokeWidth="4" />
      <g fill="none" stroke="var(--v3-ink)" strokeWidth="8" strokeLinejoin="round">
        <path d="M150 560 L150 430 Q160 330 260 320 L330 320 L420 200 Q440 170 480 170 L780 170 Q820 170 840 200 L930 320 L1020 335 Q1060 345 1060 400 L1060 560 Z" />
        <path d="M350 320 L430 205 L580 205 L580 320 Z M615 320 L615 205 L770 205 L830 320 Z" strokeWidth="6" />
        <line x1="597" y1="205" x2="597" y2="560" strokeWidth="6" /><line x1="330" y1="320" x2="330" y2="560" strokeWidth="6" /><line x1="860" y1="320" x2="860" y2="560" strokeWidth="6" />
        <circle cx="330" cy="580" r="70" fill="var(--v3-paper)" /><circle cx="880" cy="580" r="70" fill="var(--v3-paper)" />
        <circle cx="330" cy="580" r="28" strokeWidth="6" /><circle cx="880" cy="580" r="28" strokeWidth="6" />
      </g>
      <rect x="615" y="345" width="235" height="200" fill={selected ? "var(--v3-ink)" : "#ECEFEC"} stroke="var(--v3-ink)" strokeWidth="8" style={{ transition: "fill 160ms cubic-bezier(0.2, 0, 0, 1)" }} />
    </svg>
  );
}
