/** Output of the Phase 1 skeleton fitter (scratch script fit.py, archived under docs/captures/twin-builder). */
export type CurveStatus = "recovered" | "partial" | "uncertain" | "prior";

export type SkeletonCurve = {
  name: string;
  base: string;
  side: "l" | "r" | "c";
  closed: boolean;
  status: CurveStatus;
  error_px: number | null;
  error_mm: number | null;
  coverage: number | null;
  views: number;
  control: number[][];
  samples: number[][];
  detail: Record<string, { error_px: number; coverage: number; polygons: string[] }>;
};

export type SkeletonCamera = {
  file: string;
  az: number;
  el: number;
  dist: number;
  sx: number;
  sy: number;
  fov: number;
  position: number[];
  target: number[];
  initial: { az: number; el: number; dist: number; sx: number; sy: number };
};

export type DimEntry = { fitted: number; official: number; error_mm: number };

export type Skeleton = {
  label: string;
  frame: string;
  tag: string;
  image_size: [number, number];
  metres_per_px_mean: number;
  dims: Record<"length" | "width" | "height" | "wheelbase" | "tyre_radius", DimEntry>;
  wheels: Record<string, { centre: number[]; tyre_r: number; rim_r: number }>;
  wheel_errors: { view: string; wheel: string; error_px: number; error_mm: number; projected: number[]; evidence: number[] }[];
  cameras: Record<string, SkeletonCamera>;
  curves: SkeletonCurve[];
  groups: Record<string, { curves: string[]; statuses: CurveStatus[]; error_px: number | null }>;
  status_counts: Record<CurveStatus, number>;
};

export const STATUS_COLOUR: Record<CurveStatus, string> = { recovered: "#5ee08a", partial: "#ffb347", uncertain: "#ff5a5a", prior: "#3d9bff" };
export const STATUS_LABEL: Record<CurveStatus, string> = {
  recovered: "recovered from the images",
  partial: "partly recovered (evidence in one view or a looser fit)",
  uncertain: "uncertain (evidence disagrees or the fit stayed loose)",
  prior: "inferred from the vehicle prior (no image evidence used)",
};

export const VIEW_IDS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"] as const;
export const VIEW_NAMES: Record<string, string> = {
  "01": "front", "02": "front driver 3/4", "03": "front driver intermediate", "04": "driver side", "05": "rear driver intermediate", "06": "rear driver 3/4",
  "07": "rear", "08": "rear passenger 3/4", "09": "rear passenger intermediate", "10": "passenger side", "11": "front passenger intermediate",
  "12": "front passenger 3/4", "13": "front driver 3/4 high", "14": "rear driver 3/4 high", "15": "rear passenger 3/4 high", "16": "front passenger 3/4 high",
};

/** Standard angles for the skeleton viewer: azimuth and elevation in degrees, distance in metres (same convention as the fitter). */
export const ANGLES: Record<string, { label: string; az: number; el: number; dist: number }> = {
  front: { label: "Front", az: 0, el: 8, dist: 8.2 },
  front34: { label: "Front 3/4", az: 40, el: 10, dist: 8.6 },
  driver: { label: "Driver side", az: 90, el: 6, dist: 8.6 },
  rear34: { label: "Rear 3/4", az: 130, el: 10, dist: 8.6 },
  rear: { label: "Rear", az: 180, el: 8, dist: 8.2 },
  passenger: { label: "Passenger side", az: 270, el: 6, dist: 8.6 },
  top: { label: "Top", az: 90, el: 82, dist: 8.8 },
};

export const STAGES = [
  { key: "source", label: "SOURCE", phase: "Input", built: true, note: "The 16 controlled synthetic views and the skeleton reprojected over each of them." },
  { key: "skeleton", label: "SKELETON", phase: "Phase 1", built: true, note: "Structural curve network fitted jointly with the 16 cameras. No surfaces." },
  { key: "surfaces", label: "SURFACES", phase: "Phase 2", built: false, note: "Clean body surfaces built from the skeleton (G1/G2 filling and Gordon surfaces), inspected in matte clay." },
  { key: "panels", label: "PANELS", phase: "Phase 3", built: false, note: "Real panel structure: doors, hood, trunk, fenders, bumpers as separate panels with seams and gaps." },
  { key: "parts", label: "PARTS", phase: "Phase 4", built: false, note: "Identity parts: lights, grille, mirrors, wheels. Parametric first, library second, generated candidates only through review." },
  { key: "master", label: "MASTER", phase: "Phase 5", built: false, note: "Assembly master, 1M+ triangles, inspected in clay before any material." },
  { key: "final", label: "FINAL", phase: "Phases 6 and 7", built: false, note: "TapMart materials and the runtime ad on the real driver front door surface." },
] as const;
export type StageKey = (typeof STAGES)[number]["key"];
