/**
 * The smart vehicle system: shapes shared by the scan UX, the job pipeline
 * and the providers. Every provider can be unconfigured; the pipeline then
 * stops at an honest state (`waiting_provider`) instead of inventing a model.
 */

export const SCAN_ANGLES = [
  "front", "front_left", "left", "rear_left", "rear", "rear_right", "right", "front_right",
] as const;
export type ScanAngle = (typeof SCAN_ANGLES)[number];

export const SCAN_ANGLE_LABEL: Record<ScanAngle, string> = {
  front: "Front", front_left: "Front left", left: "Driver side", rear_left: "Rear left",
  rear: "Rear", rear_right: "Rear right", right: "Passenger side", front_right: "Front right",
};

export type ScanStatus =
  | "queued"
  | "validating"
  | "needs_retake"
  | "recognizing"
  | "reconstructing"
  | "waiting_provider"
  | "complete"
  | "failed";

/** What the phone captured. Photos are keyed by angle; video is optional. */
export type ScanCapture = {
  photos: { angle: ScanAngle; url: string }[];
  detail_photos: { label: string; url: string }[];
  video_urls: string[];
  device?: { user_agent?: string; has_depth?: boolean } | null;
};

export type QualityIssue = {
  code: "missing_angle" | "too_few_photos" | "blurry" | "dark" | "partial" | "no_media";
  label: string;
  angle?: ScanAngle | null;
};

export type ScanQuality = {
  /** 0 to 100, how much of the walk-around is covered. */
  coverage_pct: number;
  photo_count: number;
  has_video: boolean;
  issues: QualityIssue[];
  /** Plain-language grade: "Excellent coverage", "Good coverage", "Needs more angles". */
  label: string;
};

export type VehicleRecognition = {
  year_min: number | null;
  year_max: number | null;
  make: string | null;
  model: string | null;
  body_type: string | null;
  color: string | null;
  trim: string | null;
  /** 0 to 1. Below 0.6 the UI asks instead of asserting. */
  confidence: number;
  provider: string;
  checked_at: string;
};

export type VehicleModelAsset = {
  glb_url: string;
  poster_url: string | null;
  /** Lower-detail variants for phones, largest first. */
  lod_urls: string[];
  provider: string;
  /** Plain-language quality: "High-quality scan", "Standard scan". */
  quality_label: string;
  built_at: string;
};

export type VehicleScan = {
  id: string;
  vehicle_id: string | null;
  owner_id: string;
  status: ScanStatus;
  stage: string | null;
  progress: number;
  capture: ScanCapture;
  quality: ScanQuality | null;
  recognition: VehicleRecognition | null;
  model: VehicleModelAsset | null;
  provider: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type CatalogEntry = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  body_type: string | null;
  /** Length, width, height in millimetres where known. */
  dims: { length_mm?: number; width_mm?: number; height_mm?: number } | null;
  source: "vpic" | "local";
};

export interface VehicleRecognitionProvider {
  id: string;
  available(): boolean;
  recognize(imageUrls: string[]): Promise<VehicleRecognition | null>;
}

export interface VehicleCatalogProvider {
  id: "vpic" | "local";
  available(): boolean;
  makes(year: number): Promise<string[]>;
  models(year: number, make: string): Promise<CatalogEntry[]>;
}

export type ReconstructionStatus = "queued" | "running" | "done" | "failed";

export interface ReconstructionProvider {
  id: string;
  label: string;
  available(): boolean;
  /** Hand the capture to the provider; returns its job id. */
  submit(scan: VehicleScan): Promise<{ external_id: string }>;
  /** Ask about progress; `model` is set when done. */
  poll(externalId: string): Promise<{ status: ReconstructionStatus; progress: number; model?: VehicleModelAsset | null; error?: string | null }>;
}

/** Advertising placement zones on the vehicle, shared with campaigns. */
export const PLACEMENT_ZONES = [
  "driver_door", "passenger_door", "driver_rear_door", "passenger_rear_door",
  "rear_window", "rear_panel", "hood", "full_side", "partial_wrap", "full_wrap",
] as const;
export type PlacementZone = (typeof PLACEMENT_ZONES)[number];
