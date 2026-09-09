import { Stat } from "@/components/ui/stat";
import { formatMoney, formatPct } from "@/lib/utils/currency";
import { formatHours } from "@/lib/utils/time";
import type { ReportTable } from "@/lib/reports/table";

/** KPI tiles derived from a table's totals row — only the keys the table actually has. */
export function ReportSummary({ table }: { table: ReportTable }) {
  const t = table.totals;
  if (!t) return null;
  const num = (k: string) => (typeof t[k] === "number" ? (t[k] as number) : null);
  const tiles: Array<{ label: string; value: string; tone?: "success" | "danger" | "warn" | "default"; sub?: string }> = [];
  const c = table.currency;
  if ("sales" in t) tiles.push({ label: "Sales", value: formatMoney(num("sales"), { currency: c }) });
  if ("expenses" in t) tiles.push({ label: "Expenses", value: formatMoney(num("expenses"), { currency: c }) });
  if ("profit" in t) { const p = num("profit"); tiles.push({ label: "Profit", value: formatMoney(p, { currency: c }), tone: p == null ? "default" : p < 0 ? "danger" : "success" }); }
  if ("margin" in t) tiles.push({ label: "Margin", value: formatPct(num("margin")) });
  if ("labor" in t && !("expenses" in t)) tiles.push({ label: "Labor", value: formatMoney(num("labor"), { currency: c }) });
  if ("labor_pct" in t) tiles.push({ label: "Labor %", value: formatPct(num("labor_pct")) });
  if ("hours" in t) tiles.push({ label: "Hours", value: formatHours(num("hours")) });
  if ("total_hours" in t) tiles.push({ label: "Hours", value: formatHours(num("total_hours")) });
  if ("gross" in t) tiles.push({ label: "Gross (est.)", value: formatMoney(num("gross"), { currency: c }) });
  if ("shifts" in t) tiles.push({ label: "Shifts", value: String(num("shifts") ?? 0) });
  if ("flagged" in t) { const f = num("flagged") ?? 0; tiles.push({ label: "Flagged", value: String(f), tone: f > 0 ? "warn" : "default" }); }
  if ("amount" in t) tiles.push({ label: "Total", value: formatMoney(num("amount"), { currency: c }) });
  if ("count" in t && !("amount" in t)) tiles.push({ label: "Expenses", value: String(num("count") ?? 0) });
  if (tiles.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
      {tiles.slice(0, 6).map((x) => <Stat key={x.label} label={x.label} value={x.value} tone={x.tone} sub={x.sub} size="sm" />)}
    </div>
  );
}
