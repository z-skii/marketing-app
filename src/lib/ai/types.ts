/**
 * Shared shapes for TapMart's AI-assisted Recreate loop.
 *
 * Everything here is data. Where an AI provider is not configured the
 * generators fall back to deterministic templates and say so via `source`,
 * so the UI can label the result honestly. Nothing here decides money:
 * business and admin approval stay authoritative.
 */

export type AiSource = "ai" | "template";

/** One step of the business-facing brief (what the video should contain). */
export type BriefStep = {
  n: number;
  text: string;
  /** What to look for in the reference at this moment (optional). */
  frame_hint?: string | null;
};

/** The campaign brief a business reviews and edits before publishing. */
export type CampaignBrief = {
  title: string;
  summary: string;
  steps: BriefStep[];
  must_keep: string[];
  can_change: string[];
  required_elements: string[];
  avoid: string[];
  spoken_lines: string[];
  duration_seconds: [number, number];
  orientation: "vertical" | "horizontal";
  editing_style: string;
  pace: "slow" | "medium" | "fast";
  location: string;
  suggested_pay_cents: number;
  suggested_slots: number;
  deadline_days: number;
};

/** One instruction shown to the person making the video. Short, visual. */
export type CreatorStep = {
  n: number;
  text: string;
  /** Reference frame or thumbnail to show beside the step (optional). */
  frame_url?: string | null;
  /** e.g. "0 to 3 s" */
  timing?: string | null;
};

/** What the campaign stores for creators, derived from the brief. */
export type CreatorGuide = {
  steps: CreatorStep[];
  duration_seconds: [number, number];
  orientation: "vertical" | "horizontal";
  rules: string[];
  avoid: string[];
  checklist: string[];
  source: AiSource;
};

export type CheckStatus = "pass" | "warn" | "fail" | "unknown";

export type CheckItem = {
  key: string;
  label: string;
  status: CheckStatus;
  note?: string | null;
};

/** Result of the pre-submission requirement check. Advisory only. */
export type SubmissionCheck = {
  items: CheckItem[];
  summary: string;
  /** `client` = duration and format only; `ai` = frames reviewed by the model; `none` = nothing could be checked. */
  checked_by: "client" | "ai" | "none";
  checked_at: string;
};

/** Numbers the browser can read from the file before upload. */
export type ClientMediaMeta = {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  sizeBytes: number | null;
  /** JPEG data URLs of a few frames, captured client-side, for the AI check. */
  frames?: string[];
};
