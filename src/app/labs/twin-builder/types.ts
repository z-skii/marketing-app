/** Output of the skeleton fitter (Phase 1B, scratch script fit1b.py, archived under docs/captures/twin-builder). */
export type CurveStatus = "reference_confirmed" | "measured" | "partial" | "uncertain" | "prior";
export type Phase1Status = "recovered" | "partial" | "uncertain" | "prior";
export type CurveLabel = "MEASURED_FROM_CAPTURE" | "REFERENCE_CONFIRMED" | "DIMENSION_CONSTRAINED" | "SYMMETRY_DERIVED" | "AI_HYPOTHESIS" | "GENERIC_PRIOR";

export type ViewDetail = { error_px: number; error_mm?: number; coverage: number; polygons: string[] };

export type SkeletonCurve = {
  name: string;
  base: string;
  side: "l" | "r" | "c";
  closed: boolean;
  status: CurveStatus;
  phase1_status: Phase1Status;
  labels: CurveLabel[];
  confidence: number;
  error_px: number | null;
  error_mm: number | null;
  coverage: number | null;
  views: number;
  ref_views: number;
  ref_error_px: number | null;
  syn_views: number;
  syn_error_px: number | null;
  ai_agreement_mm: number | null;
  control: number[][];
  samples: number[][];
  detail: Record<string, ViewDetail>;
};

export type SkeletonCamera = {
  kind: "syn" | "ref";
  label: string;
  az: number;
  el: number;
  dist: number;
  sx: number;
  sy: number;
  fov: number;
  size: [number, number];
  position: number[];
  target: number[];
  initial: { az: number; el: number; dist: number; sx: number; sy: number; fov: number };
  provenance: Record<string, string | null | undefined>;
  image: string;
};

export type DimEntry = { fitted: number; official: number; error_mm: number };

export type WheelError = {
  view: string; kind: "syn" | "ref"; wheel: string; outline_rms_px?: number; outline_rms_mm?: number; centre_error_px?: number; centre_error_mm?: number;
  ellipse_centre_delta_px: number; radius_ratio: number; projected: number[]; evidence: number[];
};

export type Skeleton = {
  label: string;
  phase: string;
  frame: string;
  dims: Record<string, DimEntry>;
  wheels: Record<string, { centre: number[]; tyre_r: number; rim_r: number }>;
  wheel_errors: WheelError[];
  wheel_summary: {
    n: number; centre_error_mm_mean: number | null; centre_error_mm_median: number | null; centre_error_mm_max: number | null; outline_rms_mm_mean: number | null;
    radius_ratio_mean: number | null; radius_ratio_ref: number | null; radius_ratio_syn: number | null;
    ref: { n: number; centre_error_mm_mean: number | null; centre_error_mm_median: number | null; centre_error_mm_max: number | null };
    syn: { n: number; centre_error_mm_mean: number | null; centre_error_mm_median: number | null; centre_error_mm_max: number | null };
  };
  residuals: { data_rms_px_all: number; data_rms_px_syn: number; data_rms_px_ref: number };
  cameras: Record<string, SkeletonCamera>;
  curves: SkeletonCurve[];
  groups: Record<string, { curves: string[]; statuses: CurveStatus[]; error_px: number | null }>;
  status_counts: Record<CurveStatus, number>;
  phase1_status_counts: Record<Phase1Status, number>;
  label_counts: Partial<Record<CurveLabel, number>>;
  comparison: { phase1: { status_counts: Record<Phase1Status, number>; dims: Record<string, DimEntry>; wheel_error_px_mean: number; wheel_error_mm_mean: number; curve_status: Record<string, Phase1Status>; curve_error_px: Record<string, number | null>; cameras: Record<string, { az: number; el: number; dist: number; fov: number }>; data_rms_px: number } };
};

export type ReferenceEntry = {
  id: string; index: number; role: string; variant: string; creator: string; license: string; license_version: string; license_url: string; source: string; page_url: string;
  image: string; overlay: string | null; width: number; height: number; used_for_fit: boolean; camera: { az: number; el: number; fov: number; dist: number } | null; iou: number | null;
};

export type ReferencePack = {
  label: string;
  created_at: string;
  approved: boolean;
  identity: Record<string, string>;
  dimensions: Record<string, { value: number; unit: string; source: string; confidence: string }>;
  wheels_tyres: { years: string; trim: string; front: string; rear: string; tyre_r_front: number; tyre_r_rear: number; source: string }[];
  sources: { id: string; kind: string; title: string; url: string; rights_class: string; licence: string; used_for: string }[];
  references: ReferenceEntry[];
  coverage: Record<string, { ref_views: number; syn_views: number; status: CurveStatus; error_px: number | null; confidence: number; curves: string[] }>;
  features_learned: { feature: string; statement: string; status: CurveStatus; confidence: number }[];
  variants: { name: string; affects: string[]; note: string }[];
  knowledge_graph: Record<string, string[]>;
  conflicts: { topic: string; synthetic: string; reference: string; resolution: string }[];
  provenance_notes: string[];
};

export const STATUS_COLOUR: Record<CurveStatus, string> = { reference_confirmed: "#5ee08a", measured: "#d8e04a", partial: "#ffb347", uncertain: "#ff5a5a", prior: "#3d9bff" };
export const STATUS_LABEL: Record<CurveStatus, string> = {
  reference_confirmed: "confirmed by real G80 reference photographs",
  measured: "measured from the synthetic capture, no reference confirmation",
  partial: "partly recovered (one view or a looser fit)",
  uncertain: "uncertain (evidence disagrees or the fit stayed loose)",
  prior: "no image evidence: shape from the prior, symmetry or the AI hypothesis",
};
export const LABEL_TEXT: Record<CurveLabel, string> = {
  MEASURED_FROM_CAPTURE: "measured from the 16 view capture",
  REFERENCE_CONFIRMED: "confirmed by reference photographs",
  DIMENSION_CONSTRAINED: "held by a trusted dimension",
  SYMMETRY_DERIVED: "mirrored from the other side or centre symmetric",
  AI_HYPOTHESIS: "agrees with the AI hypothesis boundary (weak)",
  GENERIC_PRIOR: "generic body style prior only",
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
  { key: "reference", label: "REFERENCE", phase: "Phase 1B", built: true, note: "What the engine learned about the G80 before fitting: identity, trusted dimensions, licensed reference photographs, coverage and confidence." },
  { key: "skeleton", label: "SKELETON", phase: "Phase 1B", built: true, note: "Structural curve network fitted with the evidence hierarchy: dimensions, reference consensus, capture, AI hypotheses, prior. No surfaces." },
  { key: "surfaces", label: "SURFACES", phase: "Phase 2", built: false, note: "Clean body surfaces built from the skeleton (G1/G2 filling and Gordon surfaces), inspected in matte clay." },
  { key: "panels", label: "PANELS", phase: "Phase 3", built: false, note: "Real panel structure: doors, hood, trunk, fenders, bumpers as separate panels with seams and gaps." },
  { key: "parts", label: "PARTS", phase: "Phase 4", built: false, note: "Identity parts: lights, grille, mirrors, wheels. Parametric first, library second, generated candidates only through review." },
  { key: "master", label: "MASTER", phase: "Phase 5", built: false, note: "Assembly master, 1M+ triangles, inspected in clay before any material." },
  { key: "final", label: "FINAL", phase: "Phases 6 and 7", built: false, note: "TapMart materials and the runtime ad on the real driver front door surface." },
] as const;
export type StageKey = (typeof STAGES)[number]["key"];
