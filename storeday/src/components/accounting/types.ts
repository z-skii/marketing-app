import type { Database } from "@/types/database";
import type { DailyInputs } from "@/lib/calc/accounting";

/** Plain, client-safe shapes shared by the accounting pages and components. */
export type DailyReportRow = Database["public"]["Tables"]["daily_reports"]["Row"];
export type CloseoutRow = Database["public"]["Tables"]["closeout_reports"]["Row"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];

export interface StoreOption { id: string; name: string; timezone: string }

export interface AccountingSettings {
  currency: string;
  cashCheckEnabled: boolean;
  otherSalesEnabled: boolean;
  weekStartsOn: number;
}

export type MoneyField = keyof DailyInputs;
export type DraftPatch = Partial<Record<MoneyField, number | null>> & { notes?: string | null };

export const MONEY_FIELD_LABELS: Record<MoneyField, string> = {
  cash_sales: "Cash sales", card_sales: "Credit / card sales", other_sales: "Other sales",
  cash_goods: "Cash goods", check_goods: "Check goods", utilities: "Utilities", other_expenses: "Other expenses",
  expected_cash: "Expected closing cash", actual_cash: "Actual closing cash",
};

export const MONEY_FIELDS: MoneyField[] = ["cash_sales", "card_sales", "other_sales", "cash_goods", "check_goods", "utilities", "other_expenses", "expected_cash", "actual_cash"];

export interface LaborRow {
  shift_id: string;
  employee_id: string;
  employee_name: string;
  clock_in_at: string;
  clock_out_at: string | null;
  worked_minutes: number | null;
  hourly_rate: number | null;
  labor_cost: number | null;
  status: string;
  verification_status: string;
}

export interface DetailedExpense {
  id: string;
  amount: number;
  category_name: string;
  bucket: string;
  vendor: string | null;
  description: string | null;
  payment_method: string;
  status: string;
}

export interface AttentionItem {
  kind: string;
  severity: "warn" | "info" | string;
  message: string;
  shift_id?: string;
  employee?: string;
  amount?: number;
  started_at?: string;
}

export interface Comparisons {
  vs_yesterday: number | null;
  vs_last_week: number | null;
  vs_average: number | null;
  yesterday_sales: number | null;
  last_week_sales: number | null;
  average_sales: number | null;
  profit_vs_yesterday: number | null;
}

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export function parseAttention(json: unknown): AttentionItem[] {
  if (!Array.isArray(json)) return [];
  return json.filter((x): x is AttentionItem => !!x && typeof x === "object" && typeof (x as AttentionItem).message === "string");
}

export function parseComparisons(json: unknown): Comparisons {
  const j = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  const n = (k: string) => (typeof j[k] === "number" ? (j[k] as number) : j[k] == null ? null : Number(j[k]));
  return {
    vs_yesterday: n("vs_yesterday"), vs_last_week: n("vs_last_week"), vs_average: n("vs_average"),
    yesterday_sales: n("yesterday_sales"), last_week_sales: n("last_week_sales"), average_sales: n("average_sales"),
    profit_vs_yesterday: n("profit_vs_yesterday"),
  };
}

/** Local-storage mirror of a Quick Close draft. */
export interface LocalDraft { inputs: DailyInputs; notes: string; updatedAt: string }

export function localDraftKey(locationId: string, date: string) {
  return `qc:${locationId}:${date}`;
}
