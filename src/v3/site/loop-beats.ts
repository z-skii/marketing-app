import type { Beat } from "../Film";

/** Beats sit where their movement is complete, so a direct step lands on a settled state. Kept apart from the scene so the island shell can name them without loading it. */
export const LOOP_BEATS: Beat[] = [
  { key: "story", label: "Story", at: 0, dwell: 1000 },
  { key: "signup", label: "Signup", at: 0.16, dwell: 1100 },
  { key: "card", label: "Member card", at: 0.28, dwell: 700 },
  { key: "sep8", label: "September 8", at: 0.36, dwell: 800 },
  { key: "sep10", label: "September 10", at: 0.46, dwell: 550 },
  { key: "sep13", label: "September 13", at: 0.54, dwell: 550 },
  { key: "sep16", label: "September 16", at: 0.62, dwell: 550 },
  { key: "sep17", label: "Reward", at: 0.7, dwell: 1100 },
  { key: "attribution", label: "Attribution", at: 0.985, dwell: 2000 },
];
