import { format } from "date-fns";
import type { SeriesPoint } from "@/components/ui/chart";
import type { AccountingByDay } from "@/lib/data/accounting";
import { addISODays, daysInRange, fromISODate, toISODate } from "@/lib/utils/time";
import { startOfWeek } from "date-fns";
import { round2 } from "@/lib/calc/accounting";

export type ChartWindow = "7d" | "30d" | "90d" | "1y";
export const CHART_WINDOWS: Array<{ value: ChartWindow; label: string; days: number }> = [
  { value: "7d", label: "7D", days: 7 },
  { value: "30d", label: "30D", days: 30 },
  { value: "90d", label: "90D", days: 90 },
  { value: "1y", label: "1Y", days: 365 },
];

export function chartRange(window: ChartWindow, today: string): { from: string; to: string } {
  const w = CHART_WINDOWS.find((c) => c.value === window) ?? CHART_WINDOWS[1];
  return { from: addISODays(today, -(w.days - 1)), to: today };
}

/** Continuous daily series (missing days = 0). For 1y, aggregates by week so the chart stays readable. */
export function buildSeries(rows: AccountingByDay[], range: { from: string; to: string }, opts: { byWeek?: boolean; weekStartsOn?: number } = {}): SeriesPoint[] {
  const by = new Map(rows.map((r) => [r.business_date, r]));
  const days = daysInRange(range);
  if (!opts.byWeek) {
    const fmt = days.length > 45 ? "MMM d" : "EEE d";
    return days.map((d) => {
      const r = by.get(d);
      return { date: d, label: format(fromISODate(d), days.length <= 7 ? "EEE" : fmt), sales: r?.total_sales ?? 0, profit: r?.profit ?? 0, expenses: r?.total_expenses ?? 0 };
    });
  }
  const wso = (opts.weekStartsOn ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const weeks = new Map<string, SeriesPoint>();
  for (const d of days) {
    const wk = toISODate(startOfWeek(fromISODate(d), { weekStartsOn: wso }));
    const p = weeks.get(wk) ?? { date: wk, label: format(fromISODate(wk), "MMM d"), sales: 0, profit: 0, expenses: 0 };
    const r = by.get(d);
    p.sales = round2(p.sales + (r?.total_sales ?? 0));
    p.profit = round2(p.profit + (r?.profit ?? 0));
    p.expenses = round2((p.expenses ?? 0) + (r?.total_expenses ?? 0));
    weeks.set(wk, p);
  }
  return Array.from(weeks.values());
}
