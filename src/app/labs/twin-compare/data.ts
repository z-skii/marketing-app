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
  captureSheetUrl: string;
  captureNote: string;
  models: [CompareModel, CompareModel];
  winner: "A" | "B" | null;
  winnerReason: string;
  approvedSurface: "driver_door" | null;
};

const G80_DIMS = { length_mm: 4794, width_mirrors_mm: 2067, height_mm: 1433, wheelbase_mm: 2857 };

export const TWIN_COMPARE: CompareConfig = {
  status: "ready",
  title: "Prototype 2: controlled synthetic capture to digital twin",
  vehicle: {
    label: "Controlled synthetic capture test",
    identification: "Identified blind from the views by the vision model as BMW M3, generation G80, sedan (make 0.99, model 0.96, generation 0.90, body 0.98, trim not asserted at 0.25, model years 2021 onward at 0.75)",
    dims: G80_DIMS,
    dimsSource: "BMW Group press specification sheet T0316649EN: 4,794 x 1,903 x 1,433 mm, wheelbase 2,857 mm; width over mirrors 2,067 mm from ultimatespecs.com",
  },
  captureSheetUrl: "/captures/ai-g80-controlled/contact-sheet.jpg",
  captureNote: "Controlled synthetic capture test: the sixteen source views are AI generated images of one consistent car, not phone photographs.",
  capture: "Sixteen AI generated views of one consistent BMW M3 Competition G80 (Nano Banana, Google, through TapMart's Higgsfield account; 24 generations including 8 regenerations, 48 credits). Both providers received the same four orthogonal views: 01 front, 04 straight driver side, 07 rear, 10 straight passenger side.",
  models: [
    {
      slot: "A", vehicleId: "syn-g80-meshy", provider: "Meshy multi image to 3D", inputs: "views 01, 04, 07, 10; texture and PBR on, 300k target, symmetry on", credits: 30, minutes: 8, rawTriangles: 308192, webBytes: 3617168,
      atRealLength: { width_mm: 2004, height_mm: 1447, wheelbase_mm: 2904 },
      ratios: [
        { key: "lw", label: "Length to width", mesh: 2.393, real: 2.319, errorPct: 3.2, verdict: "PASS" },
        { key: "lh", label: "Length to height", mesh: 3.313, real: 3.345, errorPct: 1.0, verdict: "PASS" },
        { key: "wl", label: "Wheelbase to length", mesh: 0.606, real: 0.596, errorPct: 1.6, verdict: "PASS" },
        { key: "wh", label: "Width to height", mesh: 1.385, real: 1.442, errorPct: 4.0, verdict: "PASS" },
      ],
      score: 0.733,
      notes: ["Every ratio inside tolerance; the silhouette, wheelbase and overhangs read as a G80.", "Surfaces are smooth with mild ripples on the doors; the paint came out near black instead of graphite and the grille bars are painted rather than cut."],
    },
    {
      slot: "B", vehicleId: "syn-g80-tripo", provider: "Tripo H3.1 multiview to 3D", inputs: "views 01, 04, 07, 10 in the front, left, back, right slots; detailed geometry and texture, PBR", credits: 18, minutes: 4, rawTriangles: 1911614, webBytes: 2203280,
      atRealLength: { width_mm: 2138, height_mm: 1580, wheelbase_mm: 2836 },
      ratios: [
        { key: "lw", label: "Length to width", mesh: 2.242, real: 2.319, errorPct: 3.3, verdict: "PASS" },
        { key: "lh", label: "Length to height", mesh: 3.035, real: 3.345, errorPct: 9.3, verdict: "FAIL" },
        { key: "wl", label: "Wheelbase to length", mesh: 0.592, real: 0.596, errorPct: 0.7, verdict: "PASS" },
        { key: "wh", label: "Width to height", mesh: 1.354, real: 1.442, errorPct: 6.1, verdict: "REVIEW" },
      ],
      score: 0.555,
      notes: ["Length and wheelbase now right (the straight sides fixed the shortening seen in the first experiment), but the car is 10 percent too tall.", "Body surfaces are crumpled: dented doors, wavy rockers and arches, a warped hood; far more detail than A but not a clean panel anywhere."],
    },
  ],
  winner: "A",
  winnerReason: "Chosen on geometry: A passes all four ratios (score 73 percent) and has smooth door surfaces; B fails the height ratio (score 56 percent) and its doors are dented and wavy, which would show through any decal. Texture quality was not a factor.",
  approvedSurface: "driver_door",
};
