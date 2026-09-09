import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { formatMoney, formatPct } from "@/lib/utils/currency";
import { formatHours, formatShortDate } from "@/lib/utils/time";
import { ChangePill } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/badge";
import { TableWrap } from "@/components/ui/misc";
import type { CellValue, ReportColumn, ReportTable } from "@/lib/reports/table";

/**
 * Renders a ReportTable (src/lib/reports/table.ts): dense table on desktop, cards on mobile.
 * Server component — no interactivity needed; links come from row.href.
 */
export function ReportTableView({ table, className, emptyText = "No data for this period." }: { table: ReportTable; className?: string; emptyText?: string }) {
  const cols = table.columns.filter((c) => !c.hidden);
  const primary = cols.find((c) => c.primary) ?? cols.find((c) => c.kind === "text" || c.kind === "date") ?? cols[0];
  const badges = cols.filter((c) => c.kind === "badge");
  const rest = cols.filter((c) => c !== primary && c.kind !== "badge");
  if (table.rows.length === 0) {
    return <div className={cn("card px-4 py-8 text-center text-[13px] text-text-3", className)}>{emptyText}</div>;
  }
  return (
    <div className={className}>
      {/* Desktop */}
      <TableWrap className="hidden md:block">
        <table className="table">
          <thead>
            <tr>{cols.map((c) => <th key={c.key} className={cn(isNumeric(c) && "text-right")}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i} className={cn(row.emphasis === "subtotal" && "bg-surface-2/50 font-medium")}>
                {cols.map((c, j) => (
                  <td key={c.key} className={cn(isNumeric(c) && "num", c.kind === "text" && j > 0 && "max-w-[240px] truncate")}>
                    {j === 0 && row.href ? <Link href={row.href} className="hover:text-accent hover:underline">{renderCell(row.cells[c.key] ?? null, c, table.currency)}</Link> : renderCell(row.cells[c.key] ?? null, c, table.currency)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {table.totals && (
            <tfoot>
              <tr>{cols.map((c) => <td key={c.key} className={cn(isNumeric(c) && "num")}>{renderCell(table.totals![c.key] ?? null, c, table.currency, true)}</td>)}</tr>
            </tfoot>
          )}
        </table>
      </TableWrap>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {table.rows.map((row, i) => {
          const body = (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className={cn("text-[13.5px] font-medium truncate", row.emphasis === "subtotal" && "text-text-2")}>{renderCell(row.cells[primary.key] ?? null, primary, table.currency)}</div>
                <div className="flex items-center gap-1.5 shrink-0">{badges.map((b) => <span key={b.key}>{renderCell(row.cells[b.key] ?? null, b, table.currency)}</span>)}</div>
              </div>
              <dl className="mt-1.5 grid grid-cols-3 gap-x-3 gap-y-1">
                {rest.map((c) => {
                  const v = row.cells[c.key];
                  if (v == null || v === "") return null;
                  return (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-[10.5px] uppercase tracking-wide text-text-3 truncate">{c.label}</dt>
                      <dd className={cn("text-[13px] truncate", isNumeric(c) && "tnum")}>{renderCell(v, c, table.currency)}</dd>
                    </div>
                  );
                })}
              </dl>
            </>
          );
          const cls = cn("card px-3 py-2.5 block", row.emphasis === "subtotal" && "bg-surface-2/60");
          return row.href ? <Link key={i} href={row.href} className={cn(cls, "active:bg-surface-2")}>{body}</Link> : <div key={i} className={cls}>{body}</div>;
        })}
        {table.totals && (
          <div className="card px-3 py-2.5 bg-surface-2 border-border-strong">
            <div className="text-[13.5px] font-semibold">{renderCell(table.totals[primary.key] ?? "Total", primary, table.currency, true)}</div>
            <dl className="mt-1.5 grid grid-cols-3 gap-x-3 gap-y-1">
              {rest.map((c) => {
                const v = table.totals![c.key];
                if (v == null || v === "") return null;
                return (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-[10.5px] uppercase tracking-wide text-text-3 truncate">{c.label}</dt>
                    <dd className={cn("text-[13px] font-semibold truncate", isNumeric(c) && "tnum")}>{renderCell(v, c, table.currency, true)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}
      </div>

      {table.notes && table.notes.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[12px] text-text-3">{table.notes.map((t) => <li key={t}>{t}</li>)}</ul>
      )}
    </div>
  );
}

function isNumeric(c: ReportColumn): boolean {
  return c.kind === "money" || c.kind === "int" || c.kind === "hours" || c.kind === "pct" || c.kind === "change";
}

export function renderCell(value: CellValue, col: ReportColumn, currency: string, totals = false): React.ReactNode {
  if (value == null || value === "") return <span className="text-text-3">{totals ? "" : "—"}</span>;
  switch (col.kind) {
    case "date": return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatShortDate(value) : String(value);
    case "money": return typeof value === "number" ? formatMoney(value, { currency }) : String(value);
    case "int": return typeof value === "number" ? Math.round(value).toLocaleString("en-US") : String(value);
    case "hours": return typeof value === "number" ? formatHours(value) : String(value);
    case "pct": return typeof value === "number" ? formatPct(value) : String(value);
    case "change": return typeof value === "number" ? <ChangePill value={value} invert={col.invert} /> : String(value);
    case "badge": return typeof value === "string" && col.badge && value ? <StatusBadge kind={col.badge} value={value} /> : <span className="text-[12px] text-text-2">{String(value)}</span>;
    default: return String(value);
  }
}
