import type { CellValue, ReportColumn, ReportTable } from "./table";

/**
 * CSV serializer for ReportTable (see ./table.ts). Pure — no server imports — so it is unit-testable.
 * - UTF-8 BOM so Excel opens it with the right encoding.
 * - CRLF line endings (RFC 4180).
 * - Money/pct/hours are written as plain numbers (no "$" or "%") so spreadsheets parse them; hours as decimal hours.
 * - Cells containing a comma, quote, newline or leading whitespace are quoted; quotes doubled.
 * - Formula injection guard: cells starting with = + - @ are prefixed with a single quote.
 */
export function csvEscape(raw: string): string {
  let s = raw;
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s) || /^\s|\s$/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function csvCell(value: CellValue, col: ReportColumn): string {
  if (value == null || value === "") return "";
  switch (col.kind) {
    case "money": return typeof value === "number" ? value.toFixed(2) : csvEscape(String(value));
    case "hours": return typeof value === "number" ? (value / 60).toFixed(2) : csvEscape(String(value));
    case "pct": return typeof value === "number" ? value.toFixed(2) : csvEscape(String(value));
    case "change": return typeof value === "number" ? `${value > 0 ? "+" : ""}${value.toFixed(2)}%` : csvEscape(String(value));
    case "int": return typeof value === "number" ? String(Math.round(value)) : csvEscape(String(value));
    case "badge": return csvEscape(String(value).replace(/_/g, " "));
    default: return csvEscape(String(value));
  }
}

export function tableToCsv(table: ReportTable): string {
  const cols = table.columns; // hidden columns are included in exports on purpose (e.g. previous-period values)
  const lines: string[] = [];
  lines.push(cols.map((c) => csvEscape(c.label)).join(","));
  for (const row of table.rows) lines.push(cols.map((c) => csvCell(row.cells[c.key] ?? null, c)).join(","));
  if (table.totals) lines.push(cols.map((c) => csvCell(table.totals![c.key] ?? null, c)).join(","));
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

/** storeday-daily-2026-09-01_2026-09-30.csv */
export function csvFilename(report: string, from: string, to: string): string {
  const safe = (s: string) => s.replace(/[^a-z0-9_-]/gi, "");
  return `storeday-${safe(report)}-${safe(from)}_${safe(to)}.csv`;
}
