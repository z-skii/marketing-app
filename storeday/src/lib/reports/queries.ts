import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { OrgContext } from "@/lib/auth";
import type { Database } from "@/types/database";
import { accountingByLocation, dailyRows, type DailyAccountingRow } from "@/lib/data/accounting";
import { estimatePayroll, type OvertimeRules } from "@/lib/calc/payroll";
import { pctChange } from "@/lib/calc/accounting";
import { daysInRange, formatMonth, formatTime, monthRange, previousRange, resolveRange, shortRangeLabel, weeksInRange, type DateRange, type RangePreset } from "@/lib/utils/time";
import { n, ratioPct, reportHref, type ExportName, type ReportFilters, type ReportRow, type ReportTable } from "./table";

/**
 * Every report is produced here and ONLY here, as a ReportTable (see ./table.ts).
 * The React pages and /api/export/csv both call buildReport()/the named builders below, so
 * there is one source of truth for what a "Weekly Report" contains. All money comes from the
 * daily_accounting view or the accounting_* RPCs; this file only sums view columns and formats.
 */

type Tables = Database["public"]["Tables"];

export interface ReportParams {
  orgId: string;
  currency: string;
  weekStartsOn: number;
  otherSalesEnabled: boolean;
  today: string;
  range: DateRange;
  /** Accessible stores (owner: all; manager: assigned). */
  locations: Array<{ id: string; name: string; timezone: string }>;
  /** Selected store or null = all accessible. */
  locationId: string | null;
  /** null = all accessible (RLS decides); otherwise the single selected store. */
  locationIds: string[] | null;
  employeeId: string | null;
  categoryId: string | null;
  byStore: boolean;
  groupWeek: boolean;
  /** YYYY-MM for the month export. */
  month: string | null;
  overtime: OvertimeRules;
  filters: ReportFilters;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve URL search params (page) or query params (CSV route) into validated report params. */
export function resolveReportParams(ctx: OrgContext, sp: Record<string, string | string[] | undefined>): ReportParams {
  const get = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v[0] : v; };
  const preset = (get("range") as RangePreset) || "this_month";
  const month = get("month") && /^\d{4}-\d{2}$/.test(get("month")!) ? get("month")! : null;
  const range = month
    ? { ...monthRange(month), preset: "custom" as const, label: formatMonth(`${month}-01`) }
    : resolveRange(preset, ctx.today, ctx.settings.week_starts_on, { from: get("from"), to: get("to") });
  const locationParam = get("location") ?? null;
  const location = locationParam && ctx.locations.some((l) => l.id === locationParam) ? locationParam : null;
  const employee = get("employee") && UUID_RE.test(get("employee")!) ? get("employee")! : null;
  const category = get("category") && UUID_RE.test(get("category")!) ? get("category")! : null;
  const filters: ReportFilters = {
    range: range.preset, from: range.preset === "custom" ? range.from : undefined, to: range.preset === "custom" ? range.to : undefined,
    location, employee, category, by: get("by") === "store" ? "store" : null, group: get("group") === "week" ? "week" : null,
  };
  return {
    orgId: ctx.org.id,
    currency: ctx.settings.currency || ctx.org.currency || "USD",
    weekStartsOn: ctx.settings.week_starts_on,
    otherSalesEnabled: ctx.settings.other_sales_enabled,
    today: ctx.today,
    range,
    locations: ctx.locations.map((l) => ({ id: l.id, name: l.name, timezone: l.timezone })),
    locationId: location,
    locationIds: location ? [location] : null,
    employeeId: employee,
    categoryId: category,
    byStore: filters.by === "store" && !location, // per-store grouping is meaningless with a single store selected
    groupWeek: filters.group === "week",
    month,
    overtime: {
      enabled: ctx.settings.overtime_enabled,
      weeklyThresholdHours: n(ctx.settings.overtime_weekly_hours) || 40,
      dailyThresholdHours: ctx.settings.overtime_daily_hours == null ? null : n(ctx.settings.overtime_daily_hours),
      multiplier: n(ctx.settings.overtime_multiplier) || 1.5,
      weekStartsOn: ctx.settings.week_starts_on,
    },
    filters,
  };
}

// ------------------------------------------------------------------ aggregation of view rows

interface Agg {
  cash: number; card: number; other_sales: number; sales: number;
  goods: number; labor: number; utilities: number; other: number; expenses: number; profit: number;
  minutes: number; days: number; closed: number; cash_difference: number;
}

const EMPTY_AGG: Agg = { cash: 0, card: 0, other_sales: 0, sales: 0, goods: 0, labor: 0, utilities: 0, other: 0, expenses: 0, profit: 0, minutes: 0, days: 0, closed: 0, cash_difference: 0 };

/** Sum the view's derived columns. No formulas here — total_sales/profit/etc. are computed by the view. */
function aggregate(rows: DailyAccountingRow[]): Agg {
  const a = { ...EMPTY_AGG };
  for (const r of rows) {
    a.cash += n(r.cash_sales); a.card += n(r.card_sales); a.other_sales += n(r.other_sales); a.sales += n(r.total_sales);
    a.goods += n(r.goods_total); a.labor += n(r.labor_total); a.utilities += n(r.utilities_total); a.other += n(r.other_total);
    a.expenses += n(r.total_expenses); a.profit += n(r.profit); a.minutes += n(r.labor_minutes);
    a.cash_difference += n(r.cash_difference);
    if (r.daily_report_id) a.days += 1;
    if (r.status === "closed") a.closed += 1;
  }
  return a;
}

function r2(x: number): number { return Math.round(x * 100) / 100; }

function financialCells(a: Agg, p: ReportParams): Record<string, number | null> {
  return {
    cash: r2(a.cash), card: r2(a.card), ...(p.otherSalesEnabled ? { other_sales: r2(a.other_sales) } : {}), sales: r2(a.sales),
    goods: r2(a.goods), labor: r2(a.labor), utilities: r2(a.utilities), other: r2(a.other), expenses: r2(a.expenses),
    profit: r2(a.profit), margin: ratioPct(a.profit, a.sales), labor_pct: ratioPct(a.labor, a.sales),
  };
}

function financialColumns(p: ReportParams, opts: { salesBreakdown?: boolean; laborPct?: boolean } = {}): ReportTable["columns"] {
  return [
    ...(opts.salesBreakdown !== false ? [
      { key: "cash", label: "Cash", kind: "money" as const },
      { key: "card", label: "Card", kind: "money" as const },
      ...(p.otherSalesEnabled ? [{ key: "other_sales", label: "Other sales", kind: "money" as const }] : []),
    ] : []),
    { key: "sales", label: "Sales", kind: "money" },
    { key: "goods", label: "Goods", kind: "money" },
    { key: "labor", label: "Labor", kind: "money" },
    { key: "utilities", label: "Utilities", kind: "money" },
    { key: "other", label: "Other", kind: "money" },
    { key: "expenses", label: "Expenses", kind: "money" },
    { key: "profit", label: "Profit", kind: "money" },
    { key: "margin", label: "Margin", kind: "pct" },
    ...(opts.laborPct ? [{ key: "labor_pct", label: "Labor %", kind: "pct" as const }] : []),
  ];
}

function storeName(p: ReportParams, id: string | null | undefined): string {
  return p.locations.find((l) => l.id === id)?.name ?? "Store";
}

function storeTimezone(p: ReportParams, id: string | null | undefined): string {
  return p.locations.find((l) => l.id === id)?.timezone ?? "UTC";
}

function subtitle(p: ReportParams): string {
  const store = p.locationId ? storeName(p, p.locationId) : "All stores";
  return `${store} · ${p.range.label === "Custom" ? shortRangeLabel(p.range) : `${p.range.label} (${shortRangeLabel(p.range)})`}`;
}

function quickCloseHref(locationId: string | null, date: string | null): string | null {
  if (!locationId || !date) return null;
  return `/accounting/quick-close?location=${locationId}&date=${date}`;
}

// ------------------------------------------------------------------ daily

export async function dailyReport(supabase: ServerSupabase, p: ReportParams): Promise<ReportTable> {
  const rows = await dailyRows(supabase, p.orgId, p.locationIds, p.range.from, p.range.to);
  rows.sort((a, b) => (a.business_date ?? "").localeCompare(b.business_date ?? "") || storeName(p, a.location_id).localeCompare(storeName(p, b.location_id)));
  const out: ReportRow[] = rows.map((r) => ({
    cells: {
      date: r.business_date, store: storeName(p, r.location_id),
      ...financialCells(aggregate([r]), p),
      margin: r.margin_pct == null ? null : n(r.margin_pct),
      status: r.status ?? "",
    },
    href: quickCloseHref(r.location_id, r.business_date),
  }));
  const t = aggregate(rows);
  return {
    name: "daily", title: "Daily Report", subtitle: subtitle(p), currency: p.currency,
    columns: [
      { key: "date", label: "Date", kind: "date", primary: true },
      { key: "store", label: "Store", kind: "text" },
      ...financialColumns(p),
      { key: "status", label: "Status", kind: "badge", badge: "report" },
    ],
    rows: out,
    totals: { date: "Total", store: `${rows.length} store-days`, ...financialCells(t, p), status: `${t.closed} closed` },
  };
}

// ------------------------------------------------------------------ weekly / monthly

function bucketRows<K extends string>(rows: DailyAccountingRow[], keyOf: (r: DailyAccountingRow) => K): Map<K, DailyAccountingRow[]> {
  const m = new Map<K, DailyAccountingRow[]>();
  for (const r of rows) { const k = keyOf(r); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r); }
  return m;
}

/** Rows for one period bucket: per store (+ subtotal) when byStore, otherwise one aggregated row. */
function periodRows(p: ReportParams, label: Record<string, string>, rows: DailyAccountingRow[], subtotalLabel: string): ReportRow[] {
  const base = (a: Agg) => ({ ...financialCells(a, p), days: a.days, closed: a.closed });
  if (!p.byStore) return [{ cells: { ...label, ...base(aggregate(rows)) } }];
  const byStore = bucketRows(rows, (r) => r.location_id ?? "");
  const stores = p.locations.filter((l) => byStore.has(l.id));
  const out: ReportRow[] = stores.map((l) => ({ cells: { ...label, store: l.name, ...base(aggregate(byStore.get(l.id) ?? [])) } }));
  out.push({ cells: { ...label, store: subtotalLabel, ...base(aggregate(rows)) }, emphasis: "subtotal" });
  return out;
}

export async function weeklyReport(supabase: ServerSupabase, p: ReportParams): Promise<ReportTable> {
  const rows = await dailyRows(supabase, p.orgId, p.locationIds, p.range.from, p.range.to);
  const weeks = weeksInRange(p.range, p.weekStartsOn);
  const out: ReportRow[] = [];
  for (const w of weeks) {
    const inWeek = rows.filter((r) => r.business_date != null && r.business_date >= w.from && r.business_date <= w.to);
    out.push(...periodRows(p, { week: w.label, dates: shortRangeLabel(w) }, inWeek, "All stores"));
  }
  const t = aggregate(rows);
  return {
    name: "weekly", title: "Weekly Report", subtitle: subtitle(p), currency: p.currency,
    columns: [
      { key: "week", label: "Week", kind: "text", primary: true },
      { key: "dates", label: "Dates", kind: "text" },
      ...(p.byStore ? [{ key: "store", label: "Store", kind: "text" as const }] : []),
      ...financialColumns(p, { salesBreakdown: false, laborPct: true }),
      { key: "days", label: "Days", kind: "int" },
      { key: "closed", label: "Closed", kind: "int" },
    ],
    rows: out,
    totals: { week: "Total", dates: shortRangeLabel(p.range), ...(p.byStore ? { store: "" } : {}), ...financialCells(t, p), days: t.days, closed: t.closed },
    notes: ["Weeks are clipped to the selected period, so the period total equals the sum of its weeks."],
  };
}

export async function monthlyReport(supabase: ServerSupabase, p: ReportParams): Promise<ReportTable> {
  const rows = await dailyRows(supabase, p.orgId, p.locationIds, p.range.from, p.range.to);
  const months: string[] = [];
  for (let m = p.range.from.slice(0, 7); m <= p.range.to.slice(0, 7);) {
    months.push(m);
    const [y, mo] = m.split("-").map(Number);
    m = `${mo === 12 ? y + 1 : y}-${String(mo === 12 ? 1 : mo + 1).padStart(2, "0")}`;
  }
  const out: ReportRow[] = [];
  for (const m of months) {
    const inMonth = rows.filter((r) => (r.business_date ?? "").startsWith(m));
    out.push(...periodRows(p, { month: formatMonth(`${m}-01`) }, inMonth, "All stores"));
  }
  const t = aggregate(rows);
  return {
    name: "monthly", title: "Monthly Report", subtitle: subtitle(p), currency: p.currency,
    columns: [
      { key: "month", label: "Month", kind: "text", primary: true },
      ...(p.byStore ? [{ key: "store", label: "Store", kind: "text" as const }] : []),
      ...financialColumns(p, { salesBreakdown: false, laborPct: true }),
      { key: "days", label: "Days", kind: "int" },
      { key: "closed", label: "Closed", kind: "int" },
    ],
    rows: out,
    totals: { month: "Total", ...(p.byStore ? { store: "" } : {}), ...financialCells(t, p), days: t.days, closed: t.closed },
  };
}

// ------------------------------------------------------------------ expenses

type ExpenseJoined = Tables["expenses"]["Row"] & { expense_categories: { name: string; bucket: string } | null };

export async function expenseReport(supabase: ServerSupabase, p: ReportParams): Promise<{ byCategory: ReportTable; list: ReportTable }> {
  let q = supabase.from("expenses").select("*, expense_categories(name, bucket)").eq("organization_id", p.orgId)
    .gte("business_date", p.range.from).lte("business_date", p.range.to).order("business_date", { ascending: false }).order("created_at", { ascending: false });
  if (p.locationIds) q = q.in("location_id", p.locationIds);
  if (p.categoryId) q = q.eq("category_id", p.categoryId);
  const { data } = await q;
  const rows = (data ?? []) as ExpenseJoined[];
  const total = rows.reduce((s, e) => s + n(e.amount), 0);
  const paid = rows.filter((e) => e.status === "paid").reduce((s, e) => s + n(e.amount), 0);

  const cats = new Map<string, { name: string; bucket: string; count: number; total: number }>();
  for (const e of rows) {
    const key = e.category_id;
    const c = cats.get(key) ?? { name: e.expense_categories?.name ?? "Uncategorized", bucket: e.expense_categories?.bucket ?? "other", count: 0, total: 0 };
    c.count += 1; c.total += n(e.amount);
    cats.set(key, c);
  }
  const catRows: ReportRow[] = [...cats.entries()].sort((a, b) => b[1].total - a[1].total).map(([id, c]) => ({
    cells: { category: c.name, bucket: c.bucket, count: c.count, total: r2(c.total), share: ratioPct(c.total, total) },
    href: reportHref("expenses", { ...p.filters, category: id }),
  }));

  const byCategory: ReportTable = {
    name: "expenses_by_category", title: "By category", subtitle: subtitle(p), currency: p.currency,
    columns: [
      { key: "category", label: "Category", kind: "text", primary: true },
      { key: "bucket", label: "Bucket", kind: "text" },
      { key: "count", label: "Count", kind: "int" },
      { key: "total", label: "Total", kind: "money" },
      { key: "share", label: "Share", kind: "pct" },
    ],
    rows: catRows,
    totals: { category: "Total", bucket: "", count: rows.length, total: r2(total), share: total > 0 ? 100 : null },
  };

  const list: ReportTable = {
    name: "expenses", title: "Expense Report", subtitle: subtitle(p), currency: p.currency,
    columns: [
      { key: "date", label: "Date", kind: "date", primary: true },
      { key: "store", label: "Store", kind: "text" },
      { key: "category", label: "Category", kind: "text" },
      { key: "bucket", label: "Bucket", kind: "text", hidden: true },
      { key: "vendor", label: "Vendor", kind: "text" },
      { key: "description", label: "Description", kind: "text" },
      { key: "payment", label: "Payment", kind: "text" },
      { key: "status", label: "Status", kind: "badge", badge: "expense" },
      { key: "amount", label: "Amount", kind: "money" },
    ],
    rows: rows.map((e) => ({
      cells: {
        date: e.business_date, store: storeName(p, e.location_id), category: e.expense_categories?.name ?? "", bucket: e.expense_categories?.bucket ?? "",
        vendor: e.vendor ?? "", description: e.description ?? "", payment: e.payment_method.replace("_", " "), status: e.status, amount: n(e.amount),
      },
      href: `/expenses/${e.id}`,
    })),
    totals: { date: "Total", store: `${rows.length} expenses`, category: "", vendor: "", description: "", payment: "", status: `${r2(paid) === r2(total) ? "all paid" : `${fmtShort(paid, p.currency)} paid`}`, amount: r2(total) },
    notes: ["Only paid expenses count toward the daily accounting; expected ones are listed for planning."],
  };
  return { byCategory, list };
}

function fmtShort(v: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

// ------------------------------------------------------------------ employee hours

type ShiftJoined = Pick<Tables["shifts"]["Row"], "id" | "employee_id" | "location_id" | "business_date" | "clock_in_at" | "clock_out_at" | "worked_minutes" | "hourly_rate_snapshot" | "labor_cost" | "verification_status" | "break_minutes" | "source"> & {
  employees: { first_name: string; last_name: string } | null;
};

async function completedShifts(supabase: ServerSupabase, p: ReportParams, employeeId: string | null): Promise<ShiftJoined[]> {
  let q = supabase.from("shifts")
    .select("id, employee_id, location_id, business_date, clock_in_at, clock_out_at, worked_minutes, hourly_rate_snapshot, labor_cost, verification_status, break_minutes, source, employees(first_name, last_name)")
    .eq("organization_id", p.orgId).eq("status", "completed").gte("business_date", p.range.from).lte("business_date", p.range.to)
    .order("business_date").order("clock_in_at");
  if (p.locationIds) q = q.in("location_id", p.locationIds);
  if (employeeId) q = q.eq("employee_id", employeeId);
  const { data } = await q;
  return (data ?? []) as ShiftJoined[];
}

const FLAGGED = new Set(["location_issue", "missing_photo", "needs_review"]);

export async function hoursReport(supabase: ServerSupabase, p: ReportParams): Promise<{ summary: ReportTable; detail: ReportTable | null }> {
  const hoursCols: ReportTable["columns"] = [
    { key: "employee", label: "Employee", kind: "text", primary: true },
    { key: "shifts", label: "Shifts", kind: "int" },
    { key: "hours", label: "Hours", kind: "hours" },
    { key: "labor", label: "Labor", kind: "money" },
    { key: "flagged", label: "Flagged", kind: "int" },
  ];
  let summaryRows: Array<{ employee_id: string; name: string; shifts: number; minutes: number; labor: number; flagged: number }> = [];
  if (!p.locationIds) {
    const { data } = await supabase.rpc("employee_hours_summary", { p_org: p.orgId, p_from: p.range.from, p_to: p.range.to });
    summaryRows = (data ?? []).map((r) => ({ employee_id: r.employee_id, name: r.employee_name, shifts: n(r.shifts), minutes: n(r.minutes), labor: n(r.labor_cost), flagged: n(r.flagged) }));
  } else {
    // The RPC is org-wide; with a store filter the same counts come straight from the shifts of that store.
    const shifts = await completedShifts(supabase, p, null);
    const m = new Map<string, (typeof summaryRows)[number]>();
    for (const s of shifts) {
      const row = m.get(s.employee_id) ?? { employee_id: s.employee_id, name: `${s.employees?.first_name ?? ""} ${s.employees?.last_name ?? ""}`.trim(), shifts: 0, minutes: 0, labor: 0, flagged: 0 };
      row.shifts += 1; row.minutes += n(s.worked_minutes); row.labor += n(s.labor_cost); if (FLAGGED.has(s.verification_status)) row.flagged += 1;
      m.set(s.employee_id, row);
    }
    summaryRows = [...m.values()];
  }
  if (p.employeeId) summaryRows = summaryRows.filter((r) => r.employee_id === p.employeeId);
  summaryRows.sort((a, b) => b.minutes - a.minutes || a.name.localeCompare(b.name));
  const tot = summaryRows.reduce((t, r) => ({ shifts: t.shifts + r.shifts, minutes: t.minutes + r.minutes, labor: t.labor + r.labor, flagged: t.flagged + r.flagged }), { shifts: 0, minutes: 0, labor: 0, flagged: 0 });
  const summary: ReportTable = {
    name: "hours", title: "Employee Hours", subtitle: subtitle(p), currency: p.currency, columns: hoursCols,
    rows: summaryRows.map((r) => ({
      cells: { employee: r.name, shifts: r.shifts, hours: r.minutes, labor: r2(r.labor), flagged: r.flagged },
      href: p.employeeId ? null : reportHref("hours", { ...p.filters, employee: r.employee_id }),
    })),
    totals: { employee: "Total", shifts: tot.shifts, hours: tot.minutes, labor: r2(tot.labor), flagged: tot.flagged },
    notes: ["Completed shifts only. Flagged = clock-ins with a location issue, missing photo or needing review."],
  };
  if (!p.employeeId) return { summary, detail: null };

  const shifts = await completedShifts(supabase, p, p.employeeId);
  const name = summaryRows[0]?.name ?? (shifts[0] ? `${shifts[0].employees?.first_name ?? ""} ${shifts[0].employees?.last_name ?? ""}`.trim() : "Employee");
  const detail: ReportTable = {
    name: "hours", title: `${name} · shifts`, subtitle: subtitle(p), currency: p.currency,
    columns: [
      { key: "date", label: "Date", kind: "date", primary: true },
      { key: "store", label: "Store", kind: "text" },
      { key: "in", label: "In", kind: "text" },
      { key: "out", label: "Out", kind: "text" },
      { key: "break", label: "Break", kind: "hours" },
      { key: "hours", label: "Hours", kind: "hours" },
      { key: "rate", label: "Rate", kind: "money" },
      { key: "labor", label: "Labor", kind: "money" },
      { key: "verification", label: "Verification", kind: "badge", badge: "verification" },
    ],
    rows: shifts.map((s) => {
      const tz = storeTimezone(p, s.location_id);
      return {
        cells: {
          date: s.business_date, store: storeName(p, s.location_id), in: formatTime(s.clock_in_at, tz), out: formatTime(s.clock_out_at, tz),
          break: n(s.break_minutes), hours: n(s.worked_minutes), rate: s.hourly_rate_snapshot == null ? null : n(s.hourly_rate_snapshot), labor: s.labor_cost == null ? null : n(s.labor_cost),
          verification: s.verification_status,
        },
        href: `/shifts/${s.id}`,
      };
    }),
    totals: { date: "Total", store: `${shifts.length} shifts`, in: "", out: "", break: shifts.reduce((s, x) => s + n(x.break_minutes), 0), hours: shifts.reduce((s, x) => s + n(x.worked_minutes), 0), rate: null, labor: r2(shifts.reduce((s, x) => s + n(x.labor_cost), 0)), verification: "" },
  };
  return { summary, detail };
}

// ------------------------------------------------------------------ labor

export async function laborReport(supabase: ServerSupabase, p: ReportParams): Promise<ReportTable> {
  const rows = await dailyRows(supabase, p.orgId, p.locationIds, p.range.from, p.range.to);
  // Labor per store-day: from the view (all employees) or from that employee's shifts when one is selected.
  const laborByKey = new Map<string, { labor: number; minutes: number }>();
  if (p.employeeId) {
    for (const s of await completedShifts(supabase, p, p.employeeId)) {
      const k = `${s.location_id}|${s.business_date}`;
      const cur = laborByKey.get(k) ?? { labor: 0, minutes: 0 };
      cur.labor += n(s.labor_cost); cur.minutes += n(s.worked_minutes);
      laborByKey.set(k, cur);
    }
  }
  const salesByKey = new Map<string, number>();
  for (const r of rows) salesByKey.set(`${r.location_id}|${r.business_date}`, n(r.total_sales));
  const keys = new Set<string>([...salesByKey.keys(), ...laborByKey.keys()]);

  interface L { period: string; periodLabel: string; dates: string; location_id: string; date: string; labor: number; minutes: number; sales: number }
  const days: L[] = [];
  for (const k of keys) {
    const [location_id, date] = k.split("|");
    const view = rows.find((r) => r.location_id === location_id && r.business_date === date);
    const lab = p.employeeId ? (laborByKey.get(k) ?? { labor: 0, minutes: 0 }) : { labor: n(view?.labor_total), minutes: n(view?.labor_minutes) };
    if (p.employeeId && lab.minutes === 0 && lab.labor === 0) continue;
    days.push({ period: date, periodLabel: date, dates: "", location_id, date, labor: lab.labor, minutes: lab.minutes, sales: salesByKey.get(k) ?? 0 });
  }
  if (p.groupWeek) {
    for (const w of weeksInRange(p.range, p.weekStartsOn)) {
      for (const d of days) if (d.date >= w.from && d.date <= w.to) { d.period = w.from; d.periodLabel = w.label; d.dates = shortRangeLabel(w); }
    }
  }
  const grouped = new Map<string, L>();
  for (const d of days) {
    const k = `${d.period}|${d.location_id}`;
    const cur = grouped.get(k) ?? { ...d, labor: 0, minutes: 0, sales: 0 };
    cur.labor += d.labor; cur.minutes += d.minutes; cur.sales += d.sales;
    grouped.set(k, cur);
  }
  const out = [...grouped.values()].sort((a, b) => a.period.localeCompare(b.period) || storeName(p, a.location_id).localeCompare(storeName(p, b.location_id)));
  const tot = out.reduce((t, r) => ({ labor: t.labor + r.labor, minutes: t.minutes + r.minutes, sales: t.sales + r.sales }), { labor: 0, minutes: 0, sales: 0 });
  return {
    name: "labor", title: "Labor Report", subtitle: subtitle(p), currency: p.currency,
    columns: [
      ...(p.groupWeek
        ? [{ key: "period", label: "Week", kind: "text" as const, primary: true }, { key: "dates", label: "Dates", kind: "text" as const }]
        : [{ key: "period", label: "Date", kind: "date" as const, primary: true }]),
      { key: "store", label: "Store", kind: "text" },
      { key: "labor", label: "Labor", kind: "money" },
      { key: "hours", label: "Hours", kind: "hours" },
      { key: "sales", label: "Sales", kind: "money" },
      { key: "labor_pct", label: "Labor %", kind: "pct" },
    ],
    rows: out.map((r) => ({
      cells: { period: p.groupWeek ? r.periodLabel : r.period, ...(p.groupWeek ? { dates: r.dates } : {}), store: storeName(p, r.location_id), labor: r2(r.labor), hours: r.minutes, sales: r2(r.sales), labor_pct: ratioPct(r.labor, r.sales) },
      href: p.groupWeek ? null : quickCloseHref(r.location_id, r.date),
    })),
    totals: { period: "Total", ...(p.groupWeek ? { dates: "" } : {}), store: "", labor: r2(tot.labor), hours: tot.minutes, sales: r2(tot.sales), labor_pct: ratioPct(tot.labor, tot.sales) },
    notes: p.employeeId ? ["Labor % compares this employee's labor with the store's total sales that day."] : ["Labor = completed shifts (worked minutes × rate) plus detailed expenses in the Labor bucket."],
  };
}

// ------------------------------------------------------------------ store comparison

export async function comparisonReport(supabase: ServerSupabase, p: ReportParams): Promise<ReportTable> {
  const prev = previousRange(p.range);
  const [cur, before] = await Promise.all([
    accountingByLocation(supabase, p.orgId, p.range.from, p.range.to),
    accountingByLocation(supabase, p.orgId, prev.from, prev.to),
  ]);
  const prevBy = new Map(before.map((r) => [r.location_id, r]));
  const stores = p.locations.filter((l) => !p.locationId || l.id === p.locationId);
  const rows = stores.map((l) => {
    const c = cur.find((r) => r.location_id === l.id);
    const b = prevBy.get(l.id);
    const sales = n(c?.total_sales), profit = n(c?.profit), expenses = n(c?.total_expenses), labor = n(c?.labor_total);
    return {
      location: l, sales, profit, expenses, labor, margin: c?.margin_pct == null ? null : n(c.margin_pct),
      prev_sales: n(b?.total_sales), prev_profit: n(b?.profit), prev_expenses: n(b?.total_expenses),
      days: n(c?.days_with_data), closed: n(c?.days_closed),
    };
  }).sort((a, b) => b.sales - a.sales);
  const tot = rows.reduce((t, r) => ({ sales: t.sales + r.sales, profit: t.profit + r.profit, expenses: t.expenses + r.expenses, labor: t.labor + r.labor, prev_sales: t.prev_sales + r.prev_sales, prev_profit: t.prev_profit + r.prev_profit, prev_expenses: t.prev_expenses + r.prev_expenses, days: t.days + r.days, closed: t.closed + r.closed }), { sales: 0, profit: 0, expenses: 0, labor: 0, prev_sales: 0, prev_profit: 0, prev_expenses: 0, days: 0, closed: 0 });
  return {
    name: "comparison", title: "Store Comparison", subtitle: `${p.range.label === "Custom" ? shortRangeLabel(p.range) : p.range.label} vs. previous ${shortRangeLabel(prev)}`, currency: p.currency,
    columns: [
      { key: "rank", label: "#", kind: "int" },
      { key: "store", label: "Store", kind: "text", primary: true },
      { key: "sales", label: "Sales", kind: "money" },
      { key: "prev_sales", label: "Prev. sales", kind: "money", hidden: true },
      { key: "sales_change", label: "Δ Sales", kind: "change" },
      { key: "profit", label: "Profit", kind: "money" },
      { key: "prev_profit", label: "Prev. profit", kind: "money", hidden: true },
      { key: "profit_change", label: "Δ Profit", kind: "change" },
      { key: "expenses", label: "Expenses", kind: "money" },
      { key: "prev_expenses", label: "Prev. expenses", kind: "money", hidden: true },
      { key: "expenses_change", label: "Δ Expenses", kind: "change", invert: true },
      { key: "margin", label: "Margin", kind: "pct" },
      { key: "labor_pct", label: "Labor %", kind: "pct" },
      { key: "days", label: "Days", kind: "int" },
      { key: "closed", label: "Closed", kind: "int" },
    ],
    rows: rows.map((r, i) => ({
      cells: {
        rank: i + 1, store: r.location.name, sales: r2(r.sales), prev_sales: r2(r.prev_sales), sales_change: pctChange(r.sales, r.prev_sales),
        profit: r2(r.profit), prev_profit: r2(r.prev_profit), profit_change: pctChange(r.profit, r.prev_profit),
        expenses: r2(r.expenses), prev_expenses: r2(r.prev_expenses), expenses_change: pctChange(r.expenses, r.prev_expenses),
        margin: r.margin, labor_pct: ratioPct(r.labor, r.sales), days: r.days, closed: r.closed,
      },
      href: reportHref("daily", { ...p.filters, location: r.location.id }),
    })),
    totals: rows.length > 1 ? {
      rank: null, store: "All stores", sales: r2(tot.sales), prev_sales: r2(tot.prev_sales), sales_change: pctChange(tot.sales, tot.prev_sales),
      profit: r2(tot.profit), prev_profit: r2(tot.prev_profit), profit_change: pctChange(tot.profit, tot.prev_profit),
      expenses: r2(tot.expenses), prev_expenses: r2(tot.prev_expenses), expenses_change: pctChange(tot.expenses, tot.prev_expenses),
      margin: ratioPct(tot.profit, tot.sales), labor_pct: ratioPct(tot.labor, tot.sales), days: tot.days, closed: tot.closed,
    } : null,
    notes: [`Change compares with the previous period of the same length (${shortRangeLabel(prev)}). Ranked by sales.`],
  };
}

// ------------------------------------------------------------------ month view export (one row per day)

export async function monthReport(supabase: ServerSupabase, p: ReportParams): Promise<ReportTable> {
  const month = p.month ?? p.range.from.slice(0, 7);
  const range = monthRange(month);
  const rows = await dailyRows(supabase, p.orgId, p.locationIds, range.from, range.to);
  const byDate = bucketRows(rows, (r) => r.business_date ?? "");
  const out: ReportRow[] = daysInRange(range).map((d) => {
    const dayRows = byDate.get(d) ?? [];
    if (dayRows.length === 0) return { cells: { date: d, ...Object.fromEntries(financialColumns(p).map((c) => [c.key, null])), status: "" }, href: quickCloseHref(p.locationId, d) };
    const a = aggregate(dayRows);
    const single = dayRows.length === 1 ? dayRows[0] : null;
    return {
      cells: { date: d, ...financialCells(a, p), margin: single ? (single.margin_pct == null ? null : n(single.margin_pct)) : ratioPct(a.profit, a.sales), status: single ? single.status ?? "" : `${a.closed}/${dayRows.length} closed` },
      href: quickCloseHref(p.locationId, d),
    };
  });
  const t = aggregate(rows);
  return {
    name: "month", title: `Month View · ${formatMonth(`${month}-01`)}`, subtitle: p.locationId ? storeName(p, p.locationId) : "All stores", currency: p.currency,
    columns: [
      { key: "date", label: "Date", kind: "date", primary: true },
      ...financialColumns(p),
      { key: "status", label: "Status", kind: p.locationId ? "badge" : "text", badge: "report" },
    ],
    rows: out,
    totals: { date: "Total", ...financialCells(t, p), status: `${t.closed} closed` },
  };
}

// ------------------------------------------------------------------ payroll estimate

export async function payrollReport(supabase: ServerSupabase, p: ReportParams): Promise<ReportTable> {
  const shifts = await completedShifts(supabase, p, p.employeeId);
  const names = new Map<string, string>();
  for (const s of shifts) names.set(s.employee_id, `${s.employees?.first_name ?? ""} ${s.employees?.last_name ?? ""}`.trim());
  const est = estimatePayroll(shifts.map((s) => ({ employee_id: s.employee_id, business_date: s.business_date, worked_minutes: n(s.worked_minutes), hourly_rate: n(s.hourly_rate_snapshot) })), p.overtime)
    .sort((a, b) => b.grossPay - a.grossPay);
  const tot = est.reduce((t, e) => ({ shifts: t.shifts + e.shifts, reg: t.reg + e.regularMinutes, ot: t.ot + e.overtimeMinutes, total: t.total + e.totalMinutes, regPay: t.regPay + e.regularPay, otPay: t.otPay + e.overtimePay, gross: t.gross + e.grossPay }), { shifts: 0, reg: 0, ot: 0, total: 0, regPay: 0, otPay: 0, gross: 0 });
  const ot = p.overtime;
  return {
    name: "payroll", title: "Payroll Estimate", subtitle: subtitle(p), currency: p.currency,
    columns: [
      { key: "employee", label: "Employee", kind: "text", primary: true },
      { key: "shifts", label: "Shifts", kind: "int" },
      { key: "regular_hours", label: "Regular", kind: "hours" },
      { key: "overtime_hours", label: "Overtime", kind: "hours" },
      { key: "total_hours", label: "Total hours", kind: "hours" },
      { key: "rate", label: "Rate", kind: "money" },
      { key: "regular_pay", label: "Regular pay", kind: "money" },
      { key: "overtime_pay", label: "OT pay", kind: "money" },
      { key: "gross", label: "Gross", kind: "money" },
    ],
    rows: est.map((e) => ({
      cells: { employee: names.get(e.employee_id) ?? "Employee", shifts: e.shifts, regular_hours: e.regularMinutes, overtime_hours: e.overtimeMinutes, total_hours: e.totalMinutes, rate: e.rate, regular_pay: e.regularPay, overtime_pay: e.overtimePay, gross: e.grossPay },
      href: `/employees/${e.employee_id}`,
    })),
    totals: { employee: "Total", shifts: tot.shifts, regular_hours: tot.reg, overtime_hours: tot.ot, total_hours: tot.total, rate: null, regular_pay: r2(tot.regPay), overtime_pay: r2(tot.otPay), gross: r2(tot.gross) },
    notes: [
      ot.enabled ? `Overtime: over ${ot.weeklyThresholdHours}h/week${ot.dailyThresholdHours != null ? ` or ${ot.dailyThresholdHours}h/day` : ""} at ${ot.multiplier}× (week starts ${ot.weekStartsOn === 0 ? "Sunday" : "Monday"}).` : "Overtime rules are off.",
      "Estimate only — no taxes or withholdings.",
    ],
  };
}

// ------------------------------------------------------------------ dispatcher (CSV route + pages)

/** The single table a CSV export of `name` contains. */
export async function buildReport(supabase: ServerSupabase, p: ReportParams, name: ExportName): Promise<ReportTable> {
  switch (name) {
    case "daily": return dailyReport(supabase, p);
    case "weekly": return weeklyReport(supabase, p);
    case "monthly": return monthlyReport(supabase, p);
    case "expenses": return (await expenseReport(supabase, p)).list;
    case "hours": { const h = await hoursReport(supabase, p); return h.detail ?? h.summary; }
    case "labor": return laborReport(supabase, p);
    case "comparison": return comparisonReport(supabase, p);
    case "month": return monthReport(supabase, p);
    case "payroll": return payrollReport(supabase, p);
  }
}

/** Employee + category options for the filter bar. */
export async function reportFilterOptions(supabase: ServerSupabase, orgId: string) {
  const [emp, cat] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, employment_status").eq("organization_id", orgId).order("first_name"),
    supabase.from("expense_categories").select("id, name, is_active").eq("organization_id", orgId).order("sort_order").order("name"),
  ]);
  return {
    employees: (emp.data ?? []).map((e) => ({ value: e.id, label: `${e.first_name} ${e.last_name}`.trim() + (e.employment_status !== "active" ? ` (${e.employment_status})` : "") })),
    categories: (cat.data ?? []).map((c) => ({ value: c.id, label: c.is_active ? c.name : `${c.name} (inactive)` })),
  };
}

/** Enforce that a manager may see reports; owners always can. */
export function canSeeReports(ctx: OrgContext): boolean {
  return ctx.isOwner || (ctx.isManager && ctx.can("can_view_reports"));
}

export function isValidDate(s: string | null | undefined): s is string {
  return !!s && DATE_RE.test(s);
}
