/**
 * The deterministic car placement diagram: a side elevation in 2px ink
 * strokes with the rear-door zone filled in cobalt wash; the caption is HTML.
 * Built in code, never projected onto a photograph.
 */
export function PlacementDiagram({ width = 160, zone = "Rear doors" }: { width?: number; zone?: string }) {
  const h = Math.round(width * 2 / 3);
  return (
    <svg width={width} height={h} viewBox="0 0 1200 800" role="img" aria-label={`Placement diagram: ${zone} highlighted`} style={{ display: "block" }}>
      <rect x="0" y="0" width="1200" height="800" fill="#FFFFFF" />
      <line x1="80" y1="620" x2="1120" y2="620" stroke="#CBD3DD" strokeWidth="2" />
      {/* body */}
      <path d="M150 560 L150 430 Q160 330 260 320 L330 320 L420 200 Q440 170 480 170 L780 170 Q820 170 840 200 L930 320 L1020 335 Q1060 345 1060 400 L1060 560 Z" fill="none" stroke="#151B23" strokeWidth="8" strokeLinejoin="round" />
      {/* windows */}
      <path d="M350 320 L430 205 L580 205 L580 320 Z M615 320 L615 205 L770 205 L830 320 Z" fill="none" stroke="#151B23" strokeWidth="6" strokeLinejoin="round" />
      {/* doors */}
      <line x1="597" y1="205" x2="597" y2="560" stroke="#151B23" strokeWidth="6" />
      <line x1="330" y1="320" x2="330" y2="560" stroke="#151B23" strokeWidth="6" />
      <line x1="860" y1="320" x2="860" y2="560" stroke="#151B23" strokeWidth="6" />
      {/* rear door zone */}
      <rect x="615" y="345" width="235" height="200" fill="#E7EDFF" stroke="#2450E8" strokeWidth="8" />
      {/* wheels */}
      <circle cx="330" cy="580" r="70" fill="#FFFFFF" stroke="#151B23" strokeWidth="8" />
      <circle cx="880" cy="580" r="70" fill="#FFFFFF" stroke="#151B23" strokeWidth="8" />
      <circle cx="330" cy="580" r="28" fill="none" stroke="#151B23" strokeWidth="6" />
      <circle cx="880" cy="580" r="28" fill="none" stroke="#151B23" strokeWidth="6" />
    </svg>
  );
}
