import type { Database } from "@/types/database";

export type BriefSeverity = "warn" | "info" | "good";

/** Attention item kinds. Kept as a union so the dashboard can pick which ones become badges. */
export type BriefItemKind =
  | "cash_short"
  | "cash_over"
  | "missing_closeout"
  | "not_closed_yet"
  | "missing_closing_checklist"
  | "missing_opening_checklist"
  | "outside_radius"
  | "missing_photo"
  | "needs_review"
  | "still_clocked_in"
  | "clocked_in_after_close"
  | "store_not_opened"
  | "sales_vs_last_week";

export interface BriefItem {
  kind: BriefItemKind;
  severity: BriefSeverity;
  message: string;
  href?: string;
  locationId?: string;
  shiftId?: string;
}

export type DailyAccountingRow = Database["public"]["Views"]["daily_accounting"]["Row"];
export type StoreStatusRow = Database["public"]["Functions"]["store_status"]["Returns"][number];

export interface BriefShift {
  id: string;
  employee_id: string;
  employee_name: string;
  clock_in_at: string;
  business_date: string;
  status: Database["public"]["Enums"]["shift_status"];
  verification_status: Database["public"]["Enums"]["verification_status"];
}

export interface BriefStoreSettings {
  require_accounting_closeout: boolean;
  require_closing_checklist: boolean;
  require_opening_checklist: boolean;
  opens_at: string | null;
  closes_at: string | null;
}

/** Everything the generator knows about one store for the brief date. */
export interface BriefStoreInput {
  location: { id: string; name: string; timezone: string };
  settings: BriefStoreSettings | null;
  /** daily_accounting row for the brief date (null = nothing recorded). */
  accounting: DailyAccountingRow | null;
  /** daily_accounting row for the day before the brief date (used for "missing closeout" when the brief is for today). */
  previousDay: DailyAccountingRow | null;
  /** Total sales on the same weekday one week earlier, if a report existed. */
  lastWeekSales: number | null;
  status: StoreStatusRow | null;
  /** Shifts currently active at this store (any business date). */
  activeShifts: BriefShift[];
  /** Shifts on the brief date with a verification problem. */
  flaggedShifts: BriefShift[];
  /** `closeout_reports.attention` JSON for the date, if the day was closed (kept for AI generators; rules re-derive from raw data). */
  closeoutAttention: unknown[];
  /** Local time context for this store. */
  localToday: string;
  localTime: string; // "HH:mm"
}

export interface BriefInput {
  orgId: string;
  date: string;
  /** Today in the org timezone. */
  today: string;
  timezone: string;
  currency: string;
  stores: BriefStoreInput[];
  /** Distinct employees with a (non-cancelled) shift on the date, across the selected stores. */
  employeesWorked: number;
}

export interface BriefStoreSummary {
  id: string;
  name: string;
  sales: number;
  profit: number;
  labor: number;
  cashDifference: number | null;
  status: "closed" | "open" | "none";
  vsLastWeek: number | null;
  working: number;
}

export interface DailyBrief {
  date: string;
  stats: {
    storesReported: number;
    storesTotal: number;
    totalSales: number;
    profit: number;
    employees: number;
    labor: number;
  };
  attention: BriefItem[];
  stores: BriefStoreSummary[];
  generator: "rules" | "ai";
}

/**
 * A brief generator turns the gathered input into the DailyBrief.
 * `RuleBasedBriefGenerator` is the default. An AI-backed generator (LLM summarisation of the same
 * BriefInput) can be added later by implementing this interface and swapping it in `buildDailyBrief`.
 */
export interface BriefGenerator {
  generate(input: BriefInput): Promise<DailyBrief>;
}
