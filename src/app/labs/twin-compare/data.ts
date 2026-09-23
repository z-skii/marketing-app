/**
 * Prototype 2: real phone capture to AI digital twin, two providers side by
 * side. Everything here is measured, never typed from memory: the mesh
 * numbers come from the measurement tool run on each provider's raw GLB,
 * the score is the rule in docs/vehicle-digital-twin-architecture.md
 * section 9, and `capture` says exactly which photographs went in.
 *
 * Until mo's photographs arrive this file points at the AI G80 experiment
 * meshes as a placeholder and says so on screen.
 */
export type Ratio = { key: "lw" | "lh" | "wl" | "wh"; label: string; mesh: number | null; real: number; errorPct: number | null; verdict: "PASS" | "REVIEW" | "FAIL" | "not measurable" };

export type CompareModel = {
  slot: "A" | "B";
  vehicleId: string;
  provider: string;
  inputs: string;
  credits: number;
  minutes: number;
  rawTriangles: number;
  webBytes: number;
  atRealLength: { width_mm: number; height_mm: number; wheelbase_mm: number | null };
  ratios: Ratio[];
  score: number;
  notes: string[];
};

export type CompareConfig = {
  status: "placeholder" | "ready";
  title: string;
  vehicle: { label: string; identification: string; dims: { length_mm: number; width_mirrors_mm: number; height_mm: number; wheelbase_mm: number }; dimsSource: string };
  capture: string;
  models: [CompareModel, CompareModel];
  winner: "A" | "B" | null;
  winnerReason: string;
  approvedSurface: "driver_door" | null;
};

const G80_DIMS = { length_mm: 4794, width_mirrors_mm: 2067, height_mm: 1433, wheelbase_mm: 2857 };

export const TWIN_COMPARE: CompareConfig = {
  status: "placeholder",
  title: "Prototype 2: phone capture to digital twin",
  vehicle: {
    label: "Placeholder: the AI G80 experiment meshes until the real capture arrives",
    identification: "BMW M3 Competition, G80, sedan (from the Wikimedia Commons series, not a TapMart capture)",
    dims: G80_DIMS,
    dimsSource: "ultimatespecs.com and encycarpedia.com, BMW M3 Competition G80 2021 to 2024",
  },
  capture: "Four CC BY-SA 4.0 photographs by Damian B Oh (front, rear, two rear three quarters or front three quarter), no straight side view.",
  models: [
    {
      slot: "A", vehicleId: "ai-g80-meshy", provider: "Meshy multi image to 3D", inputs: "cutouts of photos 8, 12, 10, 17", credits: 30, minutes: 4, rawTriangles: 309236, webBytes: 3527028,
      atRealLength: { width_mm: 2073, height_mm: 1528, wheelbase_mm: 2917 },
      ratios: [
        { key: "lw", label: "Length to width", mesh: 2.312, real: 2.319, errorPct: 0.3, verdict: "PASS" },
        { key: "lh", label: "Length to height", mesh: 3.137, real: 3.345, errorPct: 6.2, verdict: "FAIL" },
        { key: "wl", label: "Wheelbase to length", mesh: 0.608, real: 0.596, errorPct: 2.1, verdict: "PASS" },
        { key: "wh", label: "Width to height", mesh: 1.356, real: 1.442, errorPct: 6.0, verdict: "PASS" },
      ],
      score: 0.691,
      notes: ["Proportions right, textures soft, grille and lights painted rather than modelled."],
    },
    {
      slot: "B", vehicleId: "ai-g80-tripo", provider: "Tripo H3.1 multiview to 3D", inputs: "photos 10, 14, 17, 8 in the front, left, back, right slots", credits: 18, minutes: 5, rawTriangles: 1900141, webBytes: 2161160,
      atRealLength: { width_mm: 2588, height_mm: 2013, wheelbase_mm: 2494 },
      ratios: [
        { key: "lw", label: "Length to width", mesh: 1.853, real: 2.319, errorPct: 20.1, verdict: "FAIL" },
        { key: "lh", label: "Length to height", mesh: 2.382, real: 3.345, errorPct: 28.8, verdict: "FAIL" },
        { key: "wl", label: "Wheelbase to length", mesh: 0.520, real: 0.596, errorPct: 12.7, verdict: "FAIL" },
        { key: "wh", label: "Width to height", mesh: 1.286, real: 1.442, errorPct: 10.9, verdict: "REVIEW" },
      ],
      score: 0.011,
      notes: ["Far more detail, but a quarter too short: the three quarter photographs in its side slots read as a shorter car."],
    },
  ],
  winner: "A",
  winnerReason: "Chosen on measurements: A is within tolerance on three of four ratios; B fails all of them.",
  approvedSurface: "driver_door",
};
