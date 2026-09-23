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
  /** Width and height of the printable area, and the projector depth (always metres). */
  size: [number, number, number];
  /** "fraction": centre is given as fractions of the fitted body (length, height, width) and resolved after the mesh loads. */
  units?: "m" | "fraction";
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
  | { kind: "glb"; url: string; draco?: boolean; meshopt?: boolean; ktx2?: boolean;
      /** Keep the file's own materials (a single textured mesh) instead of repainting body meshes. */
      keepMaterials?: boolean;
      /** Fit the loaded mesh to dims.length along its longest horizontal axis, centre it and put it on the ground. */
      autoFit?: boolean }
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
  /** Measured facts about the asset file, for the honest report on screen. */
  assetFacts?: { triangles: number; meshes: number; textures: string; fileBytes: number; technique: string };
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

/**
 * Zones for a single mesh sedan whose exact geometry is only known after
 * it loads: centres as fractions of the fitted body (length from the nose,
 * height from the ground, width from the driver side). Resolved in
 * engine/scene.ts. Only surfaces a four door sedan really has.
 */
const SEDAN_ZONES_FRACTION: PlacementZone[] = [
  { id: "driver_door", label: "Driver front door", side: "driver", units: "fraction", center: [0.095, 0.42, 0.5], normal: [0, 0, 1], up: [0, 1, 0], size: [0.86, 0.46, 0.7], meshTargets: [], camera: "driver" },
  { id: "driver_rear_door", label: "Driver rear door", side: "driver", units: "fraction", center: [-0.095, 0.42, 0.5], normal: [0, 0, 1], up: [0, 1, 0], size: [0.8, 0.46, 0.7], meshTargets: [], camera: "driver" },
  { id: "passenger_door", label: "Passenger front door", side: "passenger", units: "fraction", center: [0.095, 0.42, -0.5], normal: [0, 0, -1], up: [0, 1, 0], size: [0.86, 0.46, 0.7], meshTargets: [], camera: "passenger" },
  { id: "passenger_rear_door", label: "Passenger rear door", side: "passenger", units: "fraction", center: [-0.095, 0.42, -0.5], normal: [0, 0, -1], up: [0, 1, 0], size: [0.8, 0.46, 0.7], meshTargets: [], camera: "passenger" },
];

/** A generated sedan mesh used only to engineer the system; it is not a BMW and is never labelled as one. */
function generatedSedan(id: string, url: string, provider: string, rotationY: number, facts: VehicleModel["assetFacts"]): VehicleModel {
  return {
    id, make: "Generic", model: "sports sedan (temporary engineering mesh)", generation: null, yearStart: 2026, yearEnd: null, bodyStyle: "Sedan", demo: false,
    asset: { kind: "glb", url, keepMaterials: true, autoFit: true },
    transform: { scale: 1, rotationY, offset: [0, 0, 0] },
    dims: { length: 4.794, width: 1.903, height: 1.433, wheelbase: 2.857 },
    bodyMeshes: [],
    zones: SEDAN_ZONES_FRACTION,
    cameras: G80_CAMERAS,
    thumbnail: { preset: "hero", width: 640, height: 400 },
    license: {
      source: `Generated for TapMart on 2026-09-22 with ${provider} through TapMart's Higgsfield account (text to 3D, prompt: unbranded four door sports sedan)`,
      creator: "TapMart (AI generated)",
      license: "TapMart's own generated asset under the Higgsfield terms of service",
      commercialUse: true, attributionRequired: false, modificationAllowed: true,
      notes: "A generic sedan generated from a text prompt so the placement engine can be built and tested on real geometry. It is not the BMW M3 Competition G80: a licensed G80 GLB is still required for the demo vehicle and drops into this catalog entry.",
    },
    assetFacts: facts,
  };
}

export const SEDAN_TRIPO = generatedSedan("gen-sedan-tripo", "/vehicles/tapmart-temp-sedan.glb", "Tripo (tripo_3d, detailed geometry and textures, PBR)", 0, { triangles: 138455, meshes: 1, textures: "3 WebP at 2048 px (base colour, occlusion roughness metallic, normal), Draco compressed geometry", fileBytes: 1000016, technique: "THREE.DecalGeometry projected onto the body triangles inside the selected zone box" });

/**
 * The G80 for the placement lab: "BMW M3 (G80)" by alex20010804 on
 * Sketchfab, CC BY 4.0. Prototype only. Attribution is required wherever
 * it is shown, and it is neither endorsed by BMW nor cleared for
 * production or commercial use (see docs/vehicles-3d.md). Zones are in
 * metres in the vehicle frame and are calibrated against the mesh; only
 * the four doors are offered until they are right.
 */
export const G80_ALEX: VehicleModel = {
  id: "bmw-m3-g80-alex",
  make: "BMW",
  model: "M3 (G80)",
  generation: "G80",
  yearStart: 2021,
  yearEnd: null,
  bodyStyle: "Sedan",
  demo: true,
  asset: { kind: "glb", url: "/vehicles/bmw-m3-g80.glb", autoFit: true },
  transform: { scale: 1, rotationY: 0, offset: [0, 0, 0] },
  dims: { length: 4.794, width: 1.903, height: 1.433, wheelbase: 2.857 },
  bodyMeshes: [],
  zones: [
    { id: "driver_door", label: "Driver front door", side: "driver", center: [0.5, 0.62, 0.93], normal: [0, 0, 1], up: [0, 1, 0], size: [0.86, 0.46, 0.5], meshTargets: [], camera: "driver" },
    { id: "driver_rear_door", label: "Driver rear door", side: "driver", center: [-0.42, 0.62, 0.93], normal: [0, 0, 1], up: [0, 1, 0], size: [0.8, 0.46, 0.5], meshTargets: [], camera: "driver" },
    { id: "passenger_door", label: "Passenger front door", side: "passenger", center: [0.5, 0.62, -0.93], normal: [0, 0, -1], up: [0, 1, 0], size: [0.86, 0.46, 0.5], meshTargets: [], camera: "passenger" },
    { id: "passenger_rear_door", label: "Passenger rear door", side: "passenger", center: [-0.42, 0.62, -0.93], normal: [0, 0, -1], up: [0, 1, 0], size: [0.8, 0.46, 0.5], meshTargets: [], camera: "passenger" },
  ],
  cameras: G80_CAMERAS,
  thumbnail: { preset: "hero", width: 640, height: 400 },
  license: {
    source: "Sketchfab, https://sketchfab.com/3d-models/bmw-m3-g80-e7d8be35e2f34b7f84e0543fff7fda27 (downloaded by TapMart from the author's page)",
    creator: "alex20010804",
    license: "CC BY 4.0",
    commercialUse: false,
    attributionRequired: true,
    modificationAllowed: true,
    notes: "Prototype use only. The CC BY licence covers the file and requires the credit shown on screen; it does not cover BMW's design rights or trademarks. Not endorsed by BMW and not cleared for production or commercial use.",
  },
};


/**
 * AI 3D TEST. A BMW M3 Competition G80 reconstructed by a generative
 * multi view image to 3D model from reference photographs and the car's
 * public dimensions (4,794 x 1,903 x 1,433 mm, 2,857 mm wheelbase). No
 * existing BMW mesh was used. Every fact about the file is measured and
 * printed on the lab page; the assessment below is honest about what the
 * model invented. Candidates keep the other providers' results for
 * comparison through /labs/ai-g80?v=<id>.
 */
export type AiReport = {
  geometry: string; provider: string; inputs: string; timeAndCost: string; file: string; textures: string;
  dimensions: string; decal: string; accurate: string[]; wrong: string[];
  references: { label: string; url: string }[]; referenceLicense: string; rights: string;
};

const AI_G80_ZONES: PlacementZone[] = [
  { id: "driver_door", label: "Driver front door", side: "driver", units: "fraction", center: [0.095, 0.42, 0.5], normal: [0, 0, 1], up: [0, 1, 0], size: [0.86, 0.46, 0.7], meshTargets: [], camera: "driver" },
];

/** The G80 presets with the hero pulled back a little: the generated car is wider than the real one and the lab stage is the whole viewport. */
const AI_G80_CAMERAS: CameraPreset[] = G80_CAMERAS.map((c) => c.key === "hero" ? { ...c, position: [c.target[0] + (c.position[0] - c.target[0]) * 1.14, c.target[1] + (c.position[1] - c.target[1]) * 1.14, c.target[2] + (c.position[2] - c.target[2]) * 1.14] } : c);

function aiG80(id: string, url: string, provider: string, rotationY: number, zones: PlacementZone[], facts?: VehicleModel["assetFacts"]): VehicleModel {
  return {
    id, make: "BMW", model: "M3 Competition (AI reconstruction)", generation: "G80", yearStart: 2021, yearEnd: null, bodyStyle: "Sedan", demo: true,
    asset: { kind: "glb", url, keepMaterials: true, autoFit: true },
    transform: { scale: 1, rotationY, offset: [0, 0, 0] },
    dims: { length: 4.794, width: 1.903, height: 1.433, wheelbase: 2.857 },
    bodyMeshes: [],
    zones,
    cameras: AI_G80_CAMERAS,
    thumbnail: { preset: "hero", width: 640, height: 400 },
    license: {
      source: "Generated for TapMart on 2026-09-23 through TapMart's Higgsfield account from four CC BY-SA 4.0 reference photographs on Wikimedia Commons (Damian B Oh) and BMW's published dimensions",
      creator: `AI reconstruction: ${provider}`,
      license: "TapMart's own generated asset under the Higgsfield terms of service; the reference photographs are CC BY-SA 4.0",
      commercialUse: false, attributionRequired: true, modificationAllowed: true,
      notes: "An experiment. Generated geometry that resembles a BMW design is not cleared for commercial use: BMW's design rights and trademarks are not covered by the photo licence or the generation terms.",
    },
    assetFacts: facts,
  };
}

const AI_FACTS = {
  tripo: { triangles: 475008, meshes: 1, textures: "3 WebP at 2048 px (base colour, occlusion roughness metallic, normal), from 4096 px JPEG originals; Draco geometry", fileBytes: 2161160, technique: "THREE.DecalGeometry projected onto the generated body triangles inside the door box" },
  meshy: { triangles: 309236, meshes: 1, textures: "4 WebP at 2048 px (base colour, normal, metallic roughness, emissive); Draco geometry", fileBytes: 3527028, technique: "THREE.DecalGeometry projected onto the generated body triangles inside the door box" },
  hunyuan2: { triangles: 300000, meshes: 1, textures: "3 WebP at 2048 px (base colour, normal, metallic roughness), from 4096 px PNG originals; Draco geometry", fileBytes: 1289404, technique: "THREE.DecalGeometry projected onto the generated body triangles inside the door box" },
};

export const AI_G80_CANDIDATES: Record<string, VehicleModel> = {
  "ai-g80-tripo": aiG80("ai-g80-tripo", "/vehicles/ai-g80-tripo.glb", "Tripo H3.1 multiview to 3D, four photographs", 0, AI_G80_ZONES, AI_FACTS.tripo),
  "ai-g80-meshy": aiG80("ai-g80-meshy", "/vehicles/ai-g80-meshy.glb", "Meshy multi image to 3D, four cutout photographs", Math.PI, AI_G80_ZONES, AI_FACTS.meshy),
  "ai-g80-hunyuan2": aiG80("ai-g80-hunyuan2", "/vehicles/ai-g80-hunyuan2.glb", "Hunyuan3D v3 multi view image to 3D, four cutout photographs", 0, AI_G80_ZONES, AI_FACTS.hunyuan2),
};
/** The candidate on /labs/ai-g80 by default: the one whose proportions match the real car (mo's pick). */
export const AI_G80: VehicleModel = AI_G80_CANDIDATES["ai-g80-meshy"];

export const AI_G80_REPORT: AiReport = {
  geometry: "A real triangle mesh in a GLB file, rendered by three.js. Not an image, not a splat, not a downloaded BMW model. Generated by a multi image to 3D model from four photographs of one real car; the mesh, its textures and every surface the photographs did not show were produced by that model.",
  provider: "Meshy multi image to 3D (texture and PBR, symmetry on), run through TapMart's Higgsfield account on 2026-09-23. Two other providers ran on the same photographs: Tripo H3.1 multiview (?v=ai-g80-tripo, the most detailed but a quarter too short) and Hunyuan3D v3 (?v=ai-g80-hunyuan2, the cleanest surfaces but a two door side and too short).",
  inputs: "Four photographs of one Alpine White M3 Competition G80 in a car park, cut out from their background: front, rear, rear three quarter (passenger side) and front three quarter (passenger side). No straight side view exists in the series. Public dimensions 4,794 x 1,903 x 1,433 mm and 2,857 mm wheelbase scale the mesh to real size.",
  timeAndCost: "About 4 minutes from submission to GLB. 30 Higgsfield credits for this generation; 146 credits across the six generations and five cutouts of the whole experiment, from the account's existing plan. No new key or purchase.",
  file: "GLB, 3.36 MB on the web (309,236 triangles, 27.0 MB as generated; Draco compressed, textures resized). One mesh, one PBR material, positions, normals and one UV set. Wheels, glass, lights and body are one surface with no separate parts.",
  textures: "Base colour, normal, metallic roughness and emissive maps, 2048 px as generated, WebP on the web.",
  dimensions: "The bounding box is 2.31 long for every 1 wide and 3.14 long for every 1 tall; the real car is 2.32 (over mirrors) and 3.35. Scaled to the real length the mesh is 2,073 mm wide over the mirrors (real 2,067) and 1,528 mm tall (real 1,433, 7 percent tall). The other providers were about a quarter too short.",
  decal: "The Demo Coffee Co. creative is projected with THREE.DecalGeometry onto the generated triangles inside a driver front door box, so it follows the surface and stays attached while the car turns. The door box is placed by hand on the fitted mesh; the generated door has no separate geometry.",
  accurate: [
    "Proportions: length to width and length to height are within a few percent of the real car, so the side view and the wheelbase read as a G80, which no other provider managed.",
    "Front: the vertical kidney grille, slim headlights and the lower bumper read as an M3 Competition G80.",
    "Rear: the light shape, the diffuser and the four exhaust tips match the photographs.",
    "Fender gills, M mirrors, spoiler lip, wheel design and the roof panel are where they should be.",
  ],
  wrong: [
    "The kidney grille and the headlight graphics are softer than the photographs: the grille bars are painted rather than cut, and the lights lose their inner detail.",
    "Surface texture is softer than the photographs: door shut lines, the hood crease and the window frame are painted on rather than modelled, and the paint has a mottled look under studio light.",
    "The headlight and grille interiors are flattened into the texture; up close they are shallow.",
    "Wheels are part of the body surface, not separate parts.",
    "Everything the four photographs did not show (the underside, the roof edge, the far side details) was invented by the model.",
  ],
  references: [
    { label: "Alpine White (10), front", url: "https://commons.wikimedia.org/wiki/File:BMW_G80_M3_Competition_Alpine_White_(10).jpg" },
    { label: "(8), front three quarter", url: "https://commons.wikimedia.org/wiki/File:BMW_G80_M3_Competition_Alpine_White_(8).jpg" },
    { label: "(12), rear three quarter", url: "https://commons.wikimedia.org/wiki/File:BMW_G80_M3_Competition_Alpine_White_(12).jpg" },
    { label: "(14), rear three quarter", url: "https://commons.wikimedia.org/wiki/File:BMW_G80_M3_Competition_Alpine_White_(14).jpg" },
    { label: "(17), rear", url: "https://commons.wikimedia.org/wiki/File:BMW_G80_M3_Competition_Alpine_White_(17).jpg" },
  ],
  referenceLicense: "Photographs by Damian B Oh on Wikimedia Commons, CC BY-SA 4.0. Dimensions from ultimatespecs.com and encycarpedia.com.",
  rights: "An experiment, not a product asset. The photo licence requires this credit and share alike terms for derived work; BMW's design rights and trademarks are not covered by it or by the generation terms, so this model is not cleared for commercial use.",
};


/**
 * CONTROLLED SYNTHETIC CAPTURE TEST (Prototype 2). Sixteen AI generated
 * views of one consistent G80 (docs/captures/ai-g80-controlled) were the
 * capture; the four orthogonal views went to two providers blind. Nothing
 * here is a downloaded model. Facts are measured after the run.
 */
function synG80(id: string, url: string, provider: string, rotationY: number, facts?: VehicleModel["assetFacts"]): VehicleModel {
  return {
    ...aiG80(id, url, provider, rotationY, AI_G80_ZONES, facts),
    model: "M3 Competition (synthetic capture reconstruction)",
    license: {
      source: "Generated for TapMart on 2026-09-23 through TapMart's Higgsfield account from sixteen AI generated reference views of one consistent car (Nano Banana, Google) and BMW's published dimensions",
      creator: `AI reconstruction: ${provider}`,
      license: "TapMart's own generated asset under the Higgsfield terms of service",
      commercialUse: false, attributionRequired: false, modificationAllowed: true,
      notes: "Controlled synthetic capture test. Generated geometry that resembles a BMW design is not cleared for commercial use.",
    },
  };
}

export const SYN_G80: Record<string, VehicleModel> = {
  "syn-g80-meshy": synG80("syn-g80-meshy", "/vehicles/syn-g80-meshy.glb", "Meshy multi image to 3D, four synthetic views", Math.PI, { triangles: 308192, meshes: 1, textures: "4 WebP at 2048 px (base colour, normal, metallic roughness, emissive); Draco geometry", fileBytes: 3617168, technique: "THREE.DecalGeometry projected onto the generated body triangles inside the door box" }),
  "syn-g80-tripo": synG80("syn-g80-tripo", "/vehicles/syn-g80-tripo.glb", "Tripo H3.1 multiview to 3D, four synthetic views", Math.PI, { triangles: 477892, meshes: 1, textures: "3 WebP at 2048 px (base colour, occlusion roughness metallic, normal), from 4096 px JPEG originals; Draco geometry; simplified from 1,911,614 triangles", fileBytes: 2203280, technique: "THREE.DecalGeometry projected onto the generated body triangles inside the door box" }),
};

export const VEHICLES: Record<string, VehicleModel> = { [G80_DEMO.id]: G80_DEMO, [SEDAN_TRIPO.id]: SEDAN_TRIPO, [G80_ALEX.id]: G80_ALEX, ...AI_G80_CANDIDATES, ...SYN_G80 };
/** The CC BY credit line, exactly as the lab prints it. */
export const G80_ATTRIBUTION = { text: "\"BMW M3 (G80)\" by alex20010804 on Sketchfab, licensed CC BY 4.0", modelUrl: "https://sketchfab.com/3d-models/bmw-m3-g80-e7d8be35e2f34b7f84e0543fff7fda27", authorUrl: "https://sketchfab.com/alex20010804", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" };
/** The vehicle the placement lab shows: the licensed G80 once it exists, until then the best temporary mesh. */
export const LAB_VEHICLE_ID = SEDAN_TRIPO.id;
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
  // Measured on the lab page: about 75 percent of the stage width on a desktop studio, 85 percent on a 4:5 phone stage.
  const fit = Math.max(0.9, Math.pow(1.45 / Math.max(0.5, aspect), 0.7));
  const [tx, ty, tz] = preset.target;
  const [px, py, pz] = preset.position;
  return { position: [tx + (px - tx) * fit, ty + (py - ty) * fit, tz + (pz - tz) * fit], target: preset.target, fit };
}

/**
 * Framing for one zone: the zone's own preset direction, the target moved
 * onto the panel and the camera brought in so the placement reads while
 * most of the car stays in view. Narrow stages keep more distance.
 */
export function frameZone(vehicle: VehicleModel, zone: PlacementZone, aspect: number): { position: Vec3; target: Vec3; fit: number } {
  const preset = vehicle.cameras.find((c) => c.key === zone.camera) ?? vehicle.cameras[0];
  const framed = framePreset(preset, aspect);
  const [cx, cy, cz] = zone.center;
  const target: Vec3 = [cx * 0.6, Math.max(0.5, cy * 0.85), cz * 0.6];
  const [px, py, pz] = framed.position;
  const [tx, ty, tz] = framed.target;
  const k = 0.95 * Math.sqrt(framed.fit);
  return { position: [target[0] + (px - tx) * k, target[1] + (py - ty) * k, target[2] + (pz - tz) * k], target, fit: framed.fit };
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
