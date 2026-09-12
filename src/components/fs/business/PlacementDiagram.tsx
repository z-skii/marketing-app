/**
 * The Frame Shift placement diagram: a side elevation of a car drawn in
 * ink strokes, with the offered or chosen placements filled in a cobalt
 * wash. Built in code, never projected onto a photograph, so it can never
 * pretend an ad is installed. Zones use the product's vehicle zone keys.
 */
export type ZoneKey =
  | "driver_door" | "passenger_door" | "driver_rear_door" | "passenger_rear_door"
  | "rear_window" | "rear_panel" | "bumper" | "hood" | "full_side" | "partial_wrap" | "full_wrap";

/** Regions in the 1200 x 800 drawing space. Passenger-side zones share the driver-side outline (one elevation). */
const REGIONS: Record<ZoneKey, { x: number; y: number; w: number; h: number }[]> = {
  driver_door: [{ x: 345, y: 340, w: 240, h: 205 }],
  passenger_door: [{ x: 345, y: 340, w: 240, h: 205 }],
  driver_rear_door: [{ x: 615, y: 345, w: 235, h: 200 }],
  passenger_rear_door: [{ x: 615, y: 345, w: 235, h: 200 }],
  rear_window: [{ x: 640, y: 215, w: 180, h: 95 }],
  rear_panel: [{ x: 880, y: 350, w: 160, h: 195 }],
  bumper: [{ x: 150, y: 470, w: 60, h: 90 }, { x: 1000, y: 470, w: 60, h: 90 }],
  hood: [{ x: 170, y: 330, w: 150, h: 90 }],
  full_side: [{ x: 345, y: 340, w: 695, h: 205 }],
  partial_wrap: [{ x: 345, y: 340, w: 695, h: 205 }, { x: 640, y: 215, w: 180, h: 95 }],
  full_wrap: [{ x: 160, y: 190, w: 890, h: 360 }],
};

export function PlacementDiagram({ zones, width = 160, label, dark = false, style }: {
  zones: readonly string[]; width?: number; label?: string; dark?: boolean; style?: React.CSSProperties;
}) {
  const h = Math.round((width * 2) / 3);
  const ink = dark ? "#F6F8FB" : "#151B23";
  const ground = dark ? "#101820" : "#FFFFFF";
  const line = dark ? "#3A4756" : "#CBD3DD";
  const wash = dark ? "rgba(175, 200, 255, 0.28)" : "#E7EDFF";
  const accent = dark ? "#AFC8FF" : "#2450E8";
  const chosen = zones.filter((z): z is ZoneKey => z in REGIONS);
  return (
    <svg width={width} height={h} viewBox="0 0 1200 800" role="img" aria-label={label ?? (chosen.length ? `Placement diagram: ${chosen.length} placement${chosen.length === 1 ? "" : "s"} highlighted` : "Placement diagram: no placement chosen")} style={{ display: "block", maxWidth: "100%", height: "auto", ...style }}>
      <rect x="0" y="0" width="1200" height="800" fill={ground} />
      <line x1="80" y1="620" x2="1120" y2="620" stroke={line} strokeWidth="2" />
      {chosen.flatMap((z) => REGIONS[z].map((r, i) => (
        <rect key={`${z}-${i}`} x={r.x} y={r.y} width={r.w} height={r.h} fill={wash} stroke={accent} strokeWidth="8" />
      )))}
      <path d="M150 560 L150 430 Q160 330 260 320 L330 320 L420 200 Q440 170 480 170 L780 170 Q820 170 840 200 L930 320 L1020 335 Q1060 345 1060 400 L1060 560 Z" fill="none" stroke={ink} strokeWidth="8" strokeLinejoin="round" />
      <path d="M350 320 L430 205 L580 205 L580 320 Z M615 320 L615 205 L770 205 L830 320 Z" fill="none" stroke={ink} strokeWidth="6" strokeLinejoin="round" />
      <line x1="597" y1="205" x2="597" y2="560" stroke={ink} strokeWidth="6" />
      <line x1="330" y1="320" x2="330" y2="560" stroke={ink} strokeWidth="6" />
      <line x1="860" y1="320" x2="860" y2="560" stroke={ink} strokeWidth="6" />
      <circle cx="330" cy="580" r="70" fill={ground} stroke={ink} strokeWidth="8" />
      <circle cx="880" cy="580" r="70" fill={ground} stroke={ink} strokeWidth="8" />
      <circle cx="330" cy="580" r="28" fill="none" stroke={ink} strokeWidth="6" />
      <circle cx="880" cy="580" r="28" fill="none" stroke={ink} strokeWidth="6" />
    </svg>
  );
}
