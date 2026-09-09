import type { RangePreset } from "@/lib/utils/time";

/**
 * ReportTable — the ONE shape every report is built into.
 *
 * Producers: src/lib/reports/queries.ts (reads the daily_accounting view / RPCs, never re-implements formulas).
 * Consumers: <ReportTableView> (React, desktop table + mobile cards), tableToCsv() (CSV export),
 *            and later a PDF renderer — all of them only need `columns`, `rows` and `totals`.
 *
 * Column `kind` drives formatting in every consumer:
 *   text      plain string
 *   date      YYYY-MM-DD → "Tue, Sep 8" in the UI, ISO in CSV
 *   money     dollars (number) → "$1,234.56" in the UI, 1234.56 in CSV
 *   int       whole number
 *   hours     MINUTES (number) → "8.2h" in the UI, decimal hours in CSV
 *   pct       percentage points (number) → "12.3%"
 *   change    percentage change → ChangePill in the UI, "+12.3%" in CSV
 *   badge     status string → StatusBadge (uses `badge` to pick the domain)
 *
 * Rows are plain, serialisable objects (no functions) so a table can cross the server → client boundary.
 */
export type CellValue = string | number | null;

export type ColumnKind = "text" | "date" | "money" | "int" | "hours" | "pct" | "change" | "badge";

export interface ReportColumn {
  key: string;
  label: string;
  kind: ColumnKind;
  /** For kind "badge": which statusBadge domain to use. */
  badge?: "report" | "shift" | "verification" | "expense" | "employment";
  /** For kind "change": invert colours (a decrease is good, e.g. expenses). */
  invert?: boolean;
  /** Show a muted secondary value (e.g. previous-period figure) below the main cell — key of another column that is hidden. */
  hidden?: boolean;
  /** Primary column on mobile cards (row title). Defaults to the first text/date column. */
  primary?: boolean;
}

export interface ReportRow {
  cells: Record<string, CellValue>;
  /** Optional drill-down link (rendered by the React table only). */
  href?: string | null;
  /** Visual emphasis for subtotal rows (e.g. weekly totals when grouped per store). */
  emphasis?: "subtotal" | null;
}

export interface ReportTable {
  /** Machine name, also the CSV report name: daily | weekly | monthly | expenses | hours | labor | comparison | month | payroll */
  name: string;
  title: string;
  subtitle?: string;
  currency: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  /** Totals row keyed by column key. Null when totals make no sense (e.g. rankings). */
  totals: Record<string, CellValue> | null;
  /** Short notes shown under the table and as trailing comment lines in the CSV. */
  notes?: string[];
}

export type ReportName = "daily" | "weekly" | "monthly" | "expenses" | "hours" | "labor" | "comparison";
export type ExportName = ReportName | "month" | "payroll";

export const REPORTS: Array<{ name: ReportName; label: string; description: string }> = [
  { name: "daily", label: "Daily", description: "One row per store per day." },
  { name: "weekly", label: "Weekly", description: "Weeks in the period, clipped to it, so the month total equals the sum of its weeks." },
  { name: "monthly", label: "Monthly", description: "One row per calendar month in the period." },
  { name: "expenses", label: "Expenses", description: "Detailed expenses by category and as a list." },
  { name: "hours", label: "Employee Hours", description: "Completed shifts per employee. Flagged = location issue, missing photo or needs review." },
  { name: "labor", label: "Labor", description: "Labor cost and hours per store, with labor as a percentage of sales." },
  { name: "comparison", label: "Store Comparison", description: "Every store side by side against the previous period." },
];

export const EXPORT_NAMES: ExportName[] = ["daily", "weekly", "monthly", "expenses", "hours", "labor", "comparison", "month", "payroll"];

export function isReportName(v: string | null | undefined): v is ReportName {
  return REPORTS.some((r) => r.name === v);
}

export function isExportName(v: string | null | undefined): v is ExportName {
  return EXPORT_NAMES.includes(v as ExportName);
}

/** Money value or null → number; used when summing view columns that may be null. */
export function n(v: number | string | null | undefined): number {
  if (v == null || v === "") return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

/** Ratio in percent (2 decimals) — same formula the SQL RPCs use for margin_pct: numerator / denominator * 100. */
export function ratioPct(numerator: number, denominator: number): number | null {
  if (!denominator || denominator <= 0) return null;
  return Math.round((numerator / denominator) * 10000) / 100;
}

// ------------------------------------------------------------------ URL filters shared by pages, links and the CSV route

export interface ReportFilters {
  range: RangePreset;
  from?: string;
  to?: string;
  location: string | null;
  employee: string | null;
  category: string | null;
  by: "store" | null;
  group: "week" | null;
}

export function filtersToQuery(f: Partial<ReportFilters>): URLSearchParams {
  const q = new URLSearchParams();
  if (f.range) q.set("range", f.range);
  if (f.range === "custom") { if (f.from) q.set("from", f.from); if (f.to) q.set("to", f.to); }
  if (f.location) q.set("location", f.location);
  if (f.employee) q.set("employee", f.employee);
  if (f.category) q.set("category", f.category);
  if (f.by) q.set("by", f.by);
  if (f.group) q.set("group", f.group);
  return q;
}

export function reportHref(name: ReportName, f: Partial<ReportFilters>): string {
  const q = filtersToQuery(f).toString();
  return `/reports/${name}${q ? `?${q}` : ""}`;
}

export function exportHref(name: ExportName, f: Partial<ReportFilters> & { month?: string | null }): string {
  const q = filtersToQuery(f);
  q.set("report", name);
  if (f.month) q.set("month", f.month);
  return `/api/export/csv?${q.toString()}`;
}
