/**
 * Accounting calculations — the single TypeScript source of truth for the numbers
 * the UI computes live while typing. Mirrors the `daily_accounting` SQL view exactly.
 *
 *   TOTAL SALES     = cash + card + other
 *   GOODS           = cash goods + check goods + detailed expenses in the "goods" bucket
 *   LABOR           = Σ worked hours × hourly rate (+ detailed expenses in the "labor" bucket)
 *   UTILITIES       = utilities field + detailed "utilities" expenses
 *   OTHER           = other field + detailed "other" expenses
 *   TOTAL EXPENSES  = goods + labor + utilities + other
 *   NET PROFIT      = total sales − total expenses
 *   MARGIN          = profit / total sales × 100
 *   CASH OVER/SHORT = actual cash − expected cash
 */

export type Money = number; // dollars, rounded to cents

export function round2(n: number | null | undefined): Money {
  if (n == null || !Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function sum(...values: Array<number | null | undefined>): Money {
  return round2(values.reduce<number>((acc, v) => acc + (v ?? 0), 0));
}

export type AccountingBucket = "goods" | "labor" | "utilities" | "other";

export interface DailyInputs {
  cash_sales: number | null;
  card_sales: number | null;
  other_sales: number | null;
  cash_goods: number | null;
  check_goods: number | null;
  utilities: number | null;
  other_expenses: number | null;
  expected_cash: number | null;
  actual_cash: number | null;
}

export const EMPTY_INPUTS: DailyInputs = {
  cash_sales: null, card_sales: null, other_sales: null, cash_goods: null, check_goods: null,
  utilities: null, other_expenses: null, expected_cash: null, actual_cash: null,
};

/** Detailed expenses already grouped by bucket (from the expenses table). */
export interface DetailedExpenseTotals {
  goods: number;
  labor: number;
  utilities: number;
  other: number;
}

export const NO_DETAILED: DetailedExpenseTotals = { goods: 0, labor: 0, utilities: 0, other: 0 };

export interface LaborSummary {
  employeeCount: number;
  minutes: number;
  cost: Money;
}

export const NO_LABOR: LaborSummary = { employeeCount: 0, minutes: 0, cost: 0 };

export interface DailyTotals {
  totalSales: Money;
  goodsTotal: Money;
  laborTotal: Money;
  utilitiesTotal: Money;
  otherTotal: Money;
  totalExpenses: Money;
  profit: Money;
  marginPct: number | null;
  cashDifference: Money | null;
  laborMinutes: number;
  laborEmployeeCount: number;
}

export function computeDailyTotals(
  inputs: Partial<DailyInputs>,
  labor: LaborSummary = NO_LABOR,
  detailed: DetailedExpenseTotals = NO_DETAILED,
): DailyTotals {
  const totalSales = sum(inputs.cash_sales, inputs.card_sales, inputs.other_sales);
  const goodsTotal = sum(inputs.cash_goods, inputs.check_goods, detailed.goods);
  const laborTotal = sum(labor.cost, detailed.labor);
  const utilitiesTotal = sum(inputs.utilities, detailed.utilities);
  const otherTotal = sum(inputs.other_expenses, detailed.other);
  const totalExpenses = sum(goodsTotal, laborTotal, utilitiesTotal, otherTotal);
  const profit = round2(totalSales - totalExpenses);
  const marginPct = totalSales > 0 ? round2((profit / totalSales) * 100) : null;
  const cashDifference =
    inputs.expected_cash != null && inputs.actual_cash != null
      ? round2(inputs.actual_cash - inputs.expected_cash)
      : null;
  return {
    totalSales, goodsTotal, laborTotal, utilitiesTotal, otherTotal, totalExpenses, profit, marginPct, cashDifference,
    laborMinutes: labor.minutes, laborEmployeeCount: labor.employeeCount,
  };
}

/** Labor cost for one shift. Minutes × rate, rounded to cents. */
export function shiftLaborCost(workedMinutes: number, hourlyRate: number): Money {
  return round2((Math.max(0, workedMinutes) / 60) * (hourlyRate || 0));
}

export function summarizeLabor(shifts: Array<{ employee_id: string; worked_minutes: number | null; labor_cost: number | null; status: string }>): LaborSummary {
  const done = shifts.filter((s) => s.status === "completed");
  return {
    employeeCount: new Set(done.map((s) => s.employee_id)).size,
    minutes: done.reduce((a, s) => a + (s.worked_minutes ?? 0), 0),
    cost: sum(...done.map((s) => s.labor_cost)),
  };
}

export function groupDetailedExpenses(rows: Array<{ amount: number; bucket: AccountingBucket; status?: string }>): DetailedExpenseTotals {
  const t = { ...NO_DETAILED };
  for (const r of rows) {
    if (r.status && r.status !== "paid") continue;
    t[r.bucket] = round2(t[r.bucket] + r.amount);
  }
  return t;
}

/** Percentage change, null when there is no meaningful base. */
export function pctChange(current: number, previous: number | null | undefined): number | null {
  if (previous == null || previous === 0) return null;
  return round2(((current - previous) / Math.abs(previous)) * 100);
}

/** Expected drawer cash = starting cash + cash sales − cash goods paid from the drawer − cash paid-outs. */
export function expectedClosingCash(args: { startingCash: number; cashSales: number | null; cashGoods: number | null; cashPaidOuts?: number }): Money {
  return sum(args.startingCash, args.cashSales, -(args.cashGoods ?? 0), -(args.cashPaidOuts ?? 0));
}

/** A day is "ready to close" when at least sales have been entered. */
export function isReadyToClose(inputs: Partial<DailyInputs>): boolean {
  return inputs.cash_sales != null && inputs.card_sales != null;
}

export function missingFields(inputs: Partial<DailyInputs>): Array<keyof DailyInputs> {
  const required: Array<keyof DailyInputs> = ["cash_sales", "card_sales"];
  return required.filter((k) => inputs[k] == null);
}
