import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { groupDetailedExpenses, summarizeLabor, type DetailedExpenseTotals, type LaborSummary } from "@/lib/calc/accounting";

type Tables = Database["public"]["Tables"];
export type DailyReport = Tables["daily_reports"]["Row"];
export type DailyAccountingRow = Database["public"]["Views"]["daily_accounting"]["Row"];
export type Shift = Tables["shifts"]["Row"];
export type Expense = Tables["expenses"]["Row"];
export type ExpenseCategory = Tables["expense_categories"]["Row"];
export type AccountingTotals = Database["public"]["Functions"]["accounting_totals"]["Returns"][number];
export type AccountingByDay = Database["public"]["Functions"]["accounting_by_day"]["Returns"][number];
export type AccountingByLocation = Database["public"]["Functions"]["accounting_by_location"]["Returns"][number];
export type LaborDetailRow = Database["public"]["Functions"]["labor_detail"]["Returns"][number];
export type CloseoutReport = Tables["closeout_reports"]["Row"];

/** Everything Quick Close needs for one location/day, in parallel. */
export async function loadDayContext(supabase: ServerSupabase, locationId: string, date: string) {
  const [report, labor, expenses, activeShifts, closeouts] = await Promise.all([
    supabase.from("daily_reports").select("*").eq("location_id", locationId).eq("business_date", date).maybeSingle(),
    supabase.rpc("labor_detail", { p_loc: locationId, p_date: date }),
    supabase.from("expenses").select("*, expense_categories(name, bucket)").eq("location_id", locationId).eq("business_date", date).order("created_at"),
    supabase.from("shifts").select("*, employees(first_name, last_name)").eq("location_id", locationId).eq("status", "active"),
    supabase.from("closeout_reports").select("*").eq("location_id", locationId).eq("business_date", date).order("closed_at", { ascending: false }).limit(1),
  ]);
  const laborRows = labor.data ?? [];
  const laborSummary: LaborSummary = summarizeLabor(laborRows.map((r) => ({ employee_id: r.employee_id, worked_minutes: r.worked_minutes, labor_cost: r.labor_cost, status: r.status })));
  const detailed: DetailedExpenseTotals = groupDetailedExpenses(
    (expenses.data ?? []).map((e) => ({ amount: Number(e.amount), bucket: (e.expense_categories as { bucket: "goods" | "labor" | "utilities" | "other" } | null)?.bucket ?? "other", status: e.status })),
  );
  return {
    report: report.data ?? null,
    labor: laborRows,
    laborSummary,
    expenses: (expenses.data ?? []).map((e) => ({ ...e, amount: Number(e.amount), category_name: (e.expense_categories as { name: string } | null)?.name ?? "", bucket: (e.expense_categories as { bucket: string } | null)?.bucket ?? "other" })),
    detailed,
    activeShifts: (activeShifts.data ?? []).map((s) => ({ ...s, employee_name: `${(s.employees as { first_name: string; last_name: string } | null)?.first_name ?? ""} ${(s.employees as { last_name: string } | null)?.last_name ?? ""}`.trim() })),
    lastCloseout: closeouts.data?.[0] ?? null,
  };
}

export function reportToInputs(r: DailyReport | null) {
  return {
    cash_sales: num(r?.cash_sales), card_sales: num(r?.card_sales), other_sales: num(r?.other_sales),
    cash_goods: num(r?.cash_goods), check_goods: num(r?.check_goods), utilities: num(r?.utilities),
    other_expenses: num(r?.other_expenses), expected_cash: num(r?.expected_cash), actual_cash: num(r?.actual_cash),
  };
}

export function num(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function accountingTotals(supabase: ServerSupabase, orgId: string, locationIds: string[] | null, from: string, to: string): Promise<AccountingTotals | null> {
  const { data } = await supabase.rpc("accounting_totals", { p_org: orgId, p_location_ids: locationIds, p_from: from, p_to: to });
  return data?.[0] ?? null;
}

export async function accountingByDay(supabase: ServerSupabase, orgId: string, locationIds: string[] | null, from: string, to: string): Promise<AccountingByDay[]> {
  const { data } = await supabase.rpc("accounting_by_day", { p_org: orgId, p_location_ids: locationIds, p_from: from, p_to: to });
  return data ?? [];
}

export async function accountingByLocation(supabase: ServerSupabase, orgId: string, from: string, to: string): Promise<AccountingByLocation[]> {
  const { data } = await supabase.rpc("accounting_by_location", { p_org: orgId, p_from: from, p_to: to });
  return data ?? [];
}

export async function dailyRows(supabase: ServerSupabase, orgId: string, locationIds: string[] | null, from: string, to: string): Promise<DailyAccountingRow[]> {
  let q = supabase.from("daily_accounting").select("*").eq("organization_id", orgId).gte("business_date", from).lte("business_date", to).order("business_date");
  if (locationIds && locationIds.length) q = q.in("location_id", locationIds);
  const { data } = await q;
  return data ?? [];
}
