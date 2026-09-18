import type { Beat } from "../Film";

/** Beats sit where their movement is complete, so a direct step lands on a settled state. Kept apart from the scene so the island shell can name them without loading it. */
export const DRIVE_BEATS: Beat[] = [
  { key: "enters", label: "Vehicle example", at: 0.08, dwell: 1000 },
  { key: "camera", label: "Placement preview", at: 0.32, dwell: 1000 },
  { key: "zones", label: "Rear doors", at: 0.45, dwell: 1000 },
  { key: "creative", label: "Spurroom Bikes", at: 0.65, dwell: 1200 },
  { key: "campaign", label: "Campaign", at: 0.83, dwell: 1300 },
  { key: "earning", label: "Monthly opportunity", at: 0.94, dwell: 1800 },
];
