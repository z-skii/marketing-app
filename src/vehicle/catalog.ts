/**
 * The vehicle catalog: every 3D vehicle TapMart can show, with its asset,
 * its normalised frame, its advertising zones, its camera presets and its
 * licence. Client safe: no server code, no database. Adding a vehicle means
 * adding an entry here (and its GLB under public/vehicles/) and validating
 * the zones on the mesh. The viewer, the editor and the thumbnails never
 * know which vehicle they are showing.
 *
 * Frame (metres): the car points its nose along +X, up is +Y, the driver
 * (left) side is +Z. The ground is y = 0 and the car is centred on x = z = 0.
 */

/** Product placement keys, the same strings campaigns and bookings store. */
export type ZoneKey =
  | "driver_door" | "driver_rear_door" | "passenger_door" | "passenger_rear_door"
  | "rear_window" | "rear_panel" | "hood" | "full_side";

export type Vec3 = [number, number, number];

/** One advertising surface: a projector box on the real mesh. */
export type PlacementZone = {
  id: ZoneKey;
  label: string;
  side: "driver" | "passenger" | "front" | "rear" | "top";
  /** Centre of the panel in the vehicle frame. */
  center: Vec3;
  /** Outward normal of the panel. */
  normal: Vec3;
  /** Which way is "up" on the artwork, in the vehicle frame. */
  up: Vec3;
  /** Width and height of the printable area, and the projector depth. */
  size: [number, number, number];
  /** Names of the meshes the artwork may project onto; empty means every body mesh. */
  meshTargets: string[];
  /** The camera preset that looks straight at it. */
  camera: CameraPresetKey;
};

export type CameraPresetKey = "hero" | "driver" | "front" | "rear" | "passenger";
export type CameraPreset = { key: CameraPresetKey; label: string; position: Vec3; target: Vec3 };

export type LicenseMetadata = {
  source: string;
  creator: string;
  license: string;
  commercialUse: boolean;
  attributionRequired: boolean;
  modificationAllowed: boolean;
  notes: string;
};

export type VehicleAsset =
  | { kind: "glb"; url: string; draco?: boolean; meshopt?: boolean; ktx2?: boolean }
  /** A mesh generated in code (src/vehicle/engine/sedan.ts). Legally clean; visibly a placeholder. */
  | { kind: "procedural"; generator: "sedan" };

export type VehicleModel = {
  id: string;
  make: string;
  model: string;
  generation: string | null;
  yearStart: number;
  yearEnd: number | null;
  bodyStyle: string;
  /** True for TapMart's demonstration vehicle, never a person's confirmed car. */
  demo: boolean;
  asset: VehicleAsset;
  /** Applied to the loaded asset to bring it into the vehicle frame. */
  transform: { scale: number; rotationY: number; offset: Vec3 };
  /** Length, width, height in metres, used to frame cameras and validate zones. */
  dims: { length: number; width: number; height: number; wheelbase: number };
  /** Mesh names that count as paintable body panels (empty: every mesh not named glass, wheel, tyre, light). */
  bodyMeshes: string[];
  zones: PlacementZone[];
  cameras: CameraPreset[];
  thumbnail: { preset: CameraPresetKey; width: number; height: number };
  license: LicenseMetadata;
};

const G80_CAMERAS: CameraPreset[] = [
  { key: "hero", label: "Hero", position: [6.56, 2.1, 5.94], target: [0.15, 0.55, 0] },
  { key: "driver", label: "Driver", position: [0.81, 1.41, 8.64], target: [0, 0.6, 0] },
  { key: "front", label: "Front", position: [8.77, 1.7, 1.62], target: [0.4, 0.55, 0] },
  { key: "rear", label: "Rear", position: [-8.5, 1.82, -1.89], target: [-0.4, 0.6, 0] },
  { key: "passenger", label: "Passenger", position: [0.81, 1.41, -8.64], target: [0, 0.6, 0] },
];

/**
 * TapMart's demonstration vehicle: BMW M3 Competition, G80, sedan. The
 * geometry is a placeholder generated in code at the G80's real outer
 * dimensions (4,794 x 1,903 x 1,433 mm, 2,857 mm wheelbase) until a
 * licensed G80 GLB is added; the zones, cameras and thumbnails are defined
 * on this frame so the GLB drops in without touching the viewer or editor.
 */
export const G80_DEMO: VehicleModel = {
  id: "bmw-m3-competition-g80",
  make: "BMW",
  model: "M3 Competition",
  generation: "G80",
  yearStart: 2021,
  yearEnd: null,
  bodyStyle: "Sedan",
  demo: true,
  asset: { kind: "procedural", generator: "sedan" },
  transform: { scale: 1, rotationY: 0, offset: [0, 0, 0] },
  dims: { length: 4.794, width: 1.903, height: 1.433, wheelbase: 2.857 },
  bodyMeshes: ["body", "cabin"],
  zones: [
    { id: "driver_door", label: "Driver front door", side: "driver", center: [0.5, 0.62, 0.93], normal: [0, 0, 1], up: [0, 1, 0], size: [0.86, 0.46, 0.5], meshTargets: ["body"], camera: "driver" },
    { id: "driver_rear_door", label: "Driver rear door", side: "driver", center: [-0.42, 0.62, 0.93], normal: [0, 0, 1], up: [0, 1, 0], size: [0.8, 0.46, 0.5], meshTargets: ["body"], camera: "driver" },
    { id: "passenger_door", label: "Passenger front door", side: "passenger", center: [0.5, 0.62, -0.93], normal: [0, 0, -1], up: [0, 1, 0], size: [0.86, 0.46, 0.5], meshTargets: ["body"], camera: "passenger" },
    { id: "passenger_rear_door", label: "Passenger rear door", side: "passenger", center: [-0.42, 0.62, -0.93], normal: [0, 0, -1], up: [0, 1, 0], size: [0.8, 0.46, 0.5], meshTargets: ["body"], camera: "passenger" },
    { id: "full_side", label: "Full side (driver)", side: "driver", center: [-0.25, 0.62, 0.93], normal: [0, 0, 1], up: [0, 1, 0], size: [2.4, 0.46, 0.5], meshTargets: ["body"], camera: "driver" },
    { id: "hood", label: "Hood", side: "top", center: [1.6, 0.985, 0], normal: [0, 1, 0], up: [-1, 0, 0], size: [1.15, 0.95, 0.5], meshTargets: ["body"], camera: "front" },
    { id: "rear_panel", label: "Rear (trunk lid)", side: "rear", center: [-2.36, 0.78, 0], normal: [-1, 0, 0], up: [0, 1, 0], size: [1.2, 0.3, 0.5], meshTargets: ["body"], camera: "rear" },
    { id: "rear_window", label: "Rear window", side: "rear", center: [-1.0, 1.2, 0], normal: [-0.72, 0.69, 0], up: [0.69, 0.72, 0], size: [1.1, 0.34, 0.5], meshTargets: ["cabin"], camera: "rear" },
  ],
  cameras: G80_CAMERAS,
  thumbnail: { preset: "hero", width: 640, height: 400 },
  license: {
    source: "Generated in code: src/vehicle/engine/sedan.ts (no third party asset)",
    creator: "TapMart",
    license: "Proprietary, TapMart",
    commercialUse: true,
    attributionRequired: false,
    modificationAllowed: true,
    notes: "Placeholder geometry at G80 dimensions. Not a BMW model. See docs/vehicles-3d.md for the licensed G80 asset still needed.",
  },
};

export const VEHICLES: Record<string, VehicleModel> = { [G80_DEMO.id]: G80_DEMO };
export const DEFAULT_VEHICLE_ID = G80_DEMO.id;

export function getVehicle(id: string | null | undefined): VehicleModel {
  return (id && VEHICLES[id]) || G80_DEMO;
}

/** Vertical field of view every vehicle camera uses: a longer lens, less distortion. */
export const CAMERA_FOV = 26;

/**
 * Presets are tuned for a wide stage (aspect about 1.9). Narrower stages
 * (phones, square thumbnails) pull the camera back along its own line so
 * the whole car still fits with the same margin.
 */
export function framePreset(preset: CameraPreset, aspect: number): { position: Vec3; target: Vec3; fit: number } {
  const fit = Math.max(1, 1.9 / Math.max(0.5, aspect));
  const [tx, ty, tz] = preset.target;
  const [px, py, pz] = preset.position;
  return { position: [tx + (px - tx) * fit, ty + (py - ty) * fit, tz + (pz - tz) * fit], target: preset.target, fit };
}

export function zoneOf(vehicle: VehicleModel, id: string | null | undefined): PlacementZone | null {
  return vehicle.zones.find((z) => z.id === id) ?? null;
}

/** The product zones this vehicle can show in 3D, in the order the picker lists them. */
export function supportedZones(vehicle: VehicleModel): PlacementZone[] {
  return vehicle.zones;
}

/** The first zone the 3D system can draw for a campaign's placement list (wraps are not surfaces). */
export function firstDrawableZone(vehicle: VehicleModel, zones: readonly string[]): PlacementZone | null {
  for (const z of zones) { const hit = zoneOf(vehicle, z); if (hit) return hit; }
  if (zones.some((z) => z === "partial_wrap" || z === "full_wrap")) return zoneOf(vehicle, "full_side");
  return null;
}

export const PAINT: Record<string, string> = {
  black: "#111316", white: "#E9EAEA", silver: "#B9BCC1", gray: "#5E6268", grey: "#5E6268",
  red: "#8E1B1B", blue: "#1C3A6B", green: "#20452E", isle: "#1E6E72", default: "#B9BCC1",
};
export function paintFor(color: string | null | undefined): string {
  const key = (color ?? "").trim().toLowerCase();
  for (const k of Object.keys(PAINT)) if (k !== "default" && key.includes(k)) return PAINT[k];
  return PAINT.default;
}
