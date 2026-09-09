import { computeDailyTotals, round2, type DailyInputs, type DailyTotals, type DetailedExpenseTotals, type LaborSummary } from "@/lib/calc/accounting";
import type { Database } from "@/types/database";
import type { ReportStatus, StoreOption } from "./types";

type ViewRow = Database["public"]["Views"]["daily_accounting"]["Row"];

/** One store's numbers for one day — the unit Month View aggregates and edits. */
export interface DayLine {
  locationId: string;
  locationName: string;
  reportId: string | null;
  status: ReportStatus | null;
  inputs: DailyInputs;
  labor: LaborSummary;
  detailed: DetailedExpenseTotals;
}

export interface DayRow { date: string; lines: DayLine[] }

export interface DaySums {
  cash: number; card: number; other: number; sales: number; cashGoods: number; checkGoods: number; goods: number;
  labor: number; laborMinutes: number; utilities: number; otherExp: number; expenses: number; profit: number;
  reports: number; closed: number; hasData: boolean;
}

const n = (v: number | string | null | undefined) => (v == null ? 0 : Number(v));
const nn = (v: number | string | null | undefined) => (v == null ? null : Number(v));

export function lineFromViewRow(r: ViewRow, locationName: string): DayLine {
  return {
    locationId: r.location_id ?? "", locationName, reportId: r.daily_report_id, status: r.status,
    inputs: {
      cash_sales: nn(r.cash_sales), card_sales: nn(r.card_sales), other_sales: nn(r.other_sales), cash_goods: nn(r.cash_goods), check_goods: nn(r.check_goods),
      utilities: nn(r.utilities), other_expenses: nn(r.other_expenses), expected_cash: nn(r.expected_cash), actual_cash: nn(r.actual_cash),
    },
    labor: { employeeCount: n(r.labor_employee_count), minutes: n(r.labor_minutes), cost: round2(n(r.labor_total) - n(r.detailed_labor)) },
    detailed: { goods: n(r.detailed_goods), labor: n(r.detailed_labor), utilities: n(r.detailed_utilities), other: n(r.detailed_other) },
  };
}

/** Builds one row per calendar day in `dates`, with a line per store that has data. */
export function buildDayRows(dates: string[], rows: ViewRow[], locations: StoreOption[]): DayRow[] {
  const names = new Map(locations.map((l) => [l.id, l.name]));
  const order = new Map(locations.map((l, i) => [l.id, i]));
  return dates.map((date) => ({
    date,
    lines: rows.filter((r) => r.business_date === date && r.location_id && names.has(r.location_id))
      .map((r) => lineFromViewRow(r, names.get(r.location_id!) ?? ""))
      .sort((a, b) => (order.get(a.locationId) ?? 0) - (order.get(b.locationId) ?? 0)),
  }));
}

export function lineTotals(line: DayLine): DailyTotals {
  return computeDailyTotals(line.inputs, line.labor, line.detailed);
}

export function sumLines(lines: DayLine[]): DaySums {
  const s: DaySums = { cash: 0, card: 0, other: 0, sales: 0, cashGoods: 0, checkGoods: 0, goods: 0, labor: 0, laborMinutes: 0, utilities: 0, otherExp: 0, expenses: 0, profit: 0, reports: 0, closed: 0, hasData: lines.length > 0 };
  for (const l of lines) {
    const t = lineTotals(l);
    s.cash += l.inputs.cash_sales ?? 0; s.card += l.inputs.card_sales ?? 0; s.other += l.inputs.other_sales ?? 0; s.sales += t.totalSales;
    s.cashGoods += l.inputs.cash_goods ?? 0; s.checkGoods += l.inputs.check_goods ?? 0; s.goods += t.goodsTotal;
    s.labor += t.laborTotal; s.laborMinutes += t.laborMinutes; s.utilities += t.utilitiesTotal; s.otherExp += t.otherTotal;
    s.expenses += t.totalExpenses; s.profit += t.profit;
    if (l.reportId) s.reports += 1; if (l.status === "closed") s.closed += 1;
  }
  for (const k of Object.keys(s) as Array<keyof DaySums>) if (typeof s[k] === "number") (s[k] as number) = round2(s[k] as number);
  return s;
}

export function sumDays(days: DayRow[]): DaySums {
  return sumLines(days.flatMap((d) => d.lines));
}
