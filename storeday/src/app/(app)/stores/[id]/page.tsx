import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Settings, Zap } from "lucide-react";
import { pickLocation, requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { accountingByDay, accountingTotals, dailyRows } from "@/lib/data/accounting";
import { pctChange } from "@/lib/calc/accounting";
import { formatMoney, formatPct } from "@/lib/utils/currency";
import { addISODays, formatShortDate, formatTime, previousRange, resolveRange, shortRangeLabel, todayIn, type RangePreset } from "@/lib/utils/time";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader, Segmented } from "@/components/ui/misc";
import { ChangePill, Stat, KV } from "@/components/ui/stat";
import { SalesProfitChart } from "@/components/ui/chart";
import { StoreWorkingList } from "@/components/dashboard/store-working";
import { RecentDaysTable } from "@/components/dashboard/recent-days-table";
import { buildSeries } from "@/components/dashboard/series";

const RANGES: Array<{ value: RangePreset; label: string }> = [
  { value: "today", label: "Today" }, { value: "this_week", label: "Week" }, { value: "this_month", label: "Month" }, { value: "this_year", label: "Year" },
];

function ChecklistBadge({ status, required, doneAt, byName, timezone }: { status: string | null | undefined; required: boolean; doneAt?: string | null; byName?: string | null; timezone: string }) {
  if (status === "completed") return <span className="inline-flex items-center gap-1.5"><Badge tone="success">Completed ✓</Badge><span className="text-[12px] text-text-3">{doneAt ? formatTime(doneAt, timezone) : ""}{byName ? ` · ${byName}` : ""}</span></span>;
  if (status === "in_progress") return <Badge tone="accent">In progress</Badge>;
  return <Badge tone={required ? "warn" : "neutral"}>{required ? "Not done" : "Not started"}</Badge>;
}

export default async function StorePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireManagerContext();
  const { id } = await params;
  const sp = await searchParams;
  const loc = pickLocation(ctx, id);
  if (!loc || loc.id !== id) notFound();
  const supabase = await createSupabaseServerClient();
  const currency = ctx.org.currency;
  const today = todayIn(loc.timezone);
  const rangeKey = (RANGES.some((r) => r.value === sp.range) ? sp.range : "today") as RangePreset;
  const range = resolveRange(rangeKey, today, ctx.settings.week_starts_on);
  const prev = previousRange(range);

  const [totals, prevTotals, status, active, todayRows, expenses, byDay, recent, settings] = await Promise.all([
    accountingTotals(supabase, ctx.org.id, [loc.id], range.from, range.to),
    accountingTotals(supabase, ctx.org.id, [loc.id], prev.from, prev.to),
    supabase.rpc("store_status", { p_org: ctx.org.id, p_date: today }),
    supabase.from("shifts").select("id, clock_in_at, verification_status, employees(first_name, last_name)").eq("location_id", loc.id).eq("status", "active").order("clock_in_at"),
    dailyRows(supabase, ctx.org.id, [loc.id], today, today),
    supabase.from("expenses").select("id, business_date, amount, vendor, description, status, expense_categories(name)").eq("location_id", loc.id).order("business_date", { ascending: false }).order("created_at", { ascending: false }).limit(8),
    accountingByDay(supabase, ctx.org.id, [loc.id], addISODays(today, -29), today),
    supabase.from("daily_accounting").select("*").eq("location_id", loc.id).order("business_date", { ascending: false }).limit(14),
    supabase.from("location_settings").select("require_opening_checklist, require_closing_checklist, require_accounting_closeout").eq("location_id", loc.id).maybeSingle(),
  ]);
  const st = (status.data ?? []).find((s) => s.location_id === loc.id) ?? null;
  const todayRow = todayRows[0] ?? null;
  const working = (active.data ?? []).map((s) => ({
    id: s.id, clock_in_at: s.clock_in_at, verification_status: s.verification_status,
    employee_name: `${(s.employees as { first_name: string } | null)?.first_name ?? ""} ${(s.employees as { last_name: string | null } | null)?.last_name ?? ""}`.trim(),
  }));
  const series = buildSeries(byDay, { from: addISODays(today, -29), to: today });
  const sub = `vs ${shortRangeLabel(prev)}`;
  const tile = (label: string, key: "total_sales" | "cash_sales" | "card_sales" | "total_expenses" | "goods_total" | "labor_total" | "utilities_total" | "profit", invert = false) => {
    const cur = totals?.[key] ?? 0, before = prevTotals?.[key];
    const change = pctChange(cur, before);
    const tone = key === "profit" && cur < 0 ? "danger" : "default";
    if (invert) return <Stat key={key} label={label} value={formatMoney(cur, { currency })} tone={tone} sub={<span className="inline-flex items-center gap-2"><ChangePill value={change} invert /><span>{sub}</span></span>} />;
    return <Stat key={key} label={label} value={formatMoney(cur, { currency })} change={change} sub={sub} tone={tone} />;
  };
  const address = [loc.address_line1, loc.city, loc.state, loc.postal_code].filter(Boolean).join(", ");

  return (
    <>
      <PageHeader title={loc.name} description={address || loc.timezone} back={{ href: "/stores", label: "Stores" }}
        actions={<div className="flex flex-wrap items-center gap-2">
          <Segmented items={RANGES.map((r) => ({ href: `/stores/${loc.id}?range=${r.value}`, label: r.label.toUpperCase(), active: r.value === rangeKey }))} />
          {ctx.isOwner && <>
            <Link href={`/stores/${loc.id}/edit`} className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-md border border-border bg-surface text-[13.5px] hover:bg-surface-2"><Pencil className="h-3.5 w-3.5" />Edit</Link>
            <Link href={`/stores/${loc.id}/settings`} className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-md border border-border bg-surface text-[13.5px] hover:bg-surface-2"><Settings className="h-3.5 w-3.5" />Settings</Link>
          </>}
        </div>} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {tile("Sales", "total_sales")}
        {tile("Cash", "cash_sales")}
        {tile("Card", "card_sales")}
        {tile("Expenses", "total_expenses", true)}
        {tile("Goods", "goods_total", true)}
        {tile("Labor", "labor_total", true)}
        {tile("Utilities", "utilities_total", true)}
        {tile("Profit", "profit")}
        <Stat label="Profit margin" value={formatPct(totals?.margin_pct ?? null)} change={totals?.margin_pct != null && prevTotals?.margin_pct != null ? Math.round((totals.margin_pct - prevTotals.margin_pct) * 10) / 10 : null} sub={prevTotals?.margin_pct != null ? `pts ${sub}` : sub} />
        <Stat label="Days closed" value={<>{totals?.days_closed ?? 0} <span className="text-text-3 font-normal">/ {totals?.days_with_data ?? 0}</span></>} sub="with data" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-2.5">
        <Card>
          <CardHeader title="Currently working" description={`${working.length} clocked in`} action={<Link href="/working" className="text-[12.5px] text-accent hover:underline">Who&apos;s working →</Link>} />
          <CardBody><StoreWorkingList shifts={working} timezone={loc.timezone} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Today's closeout" description={formatShortDate(today)} action={<StatusBadge kind="report" value={todayRow?.status ?? null} />} />
          <CardBody>
            {todayRow?.daily_report_id ? (
              <div className="grid grid-cols-2 gap-x-4">
                <KV label="Sales" value={formatMoney(todayRow.total_sales ?? 0, { currency })} strong />
                <KV label="Profit" value={formatMoney(todayRow.profit ?? 0, { currency })} strong tone={(todayRow.profit ?? 0) < 0 ? "danger" : undefined} />
                <KV label="Labor" value={formatMoney(todayRow.labor_total ?? 0, { currency })} />
                <KV label="Cash over/short" value={todayRow.cash_difference == null ? "—" : formatMoney(todayRow.cash_difference, { currency, signed: true })} tone={todayRow.cash_difference != null && todayRow.cash_difference < 0 ? "danger" : undefined} />
              </div>
            ) : <p className="text-[13px] text-text-3">Nothing entered yet for today.</p>}
            <Link href={`/accounting/quick-close?location=${loc.id}&date=${today}`} className="mt-3 inline-flex items-center gap-1.5 h-8.5 px-3 rounded-md bg-accent text-white text-[13.5px] font-medium hover:bg-accent-hover">
              <Zap className="h-4 w-4" />{todayRow?.status === "closed" ? "View Quick Close" : "Open Quick Close"}
            </Link>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Checklists" description="Today" action={<Link href="/store-check" className="text-[12.5px] text-accent hover:underline">Store Check →</Link>} />
          <CardBody className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-[13px]"><span className="text-text-2">Opening checklist</span><ChecklistBadge status={st?.opening_checklist_status} required={!!settings.data?.require_opening_checklist} doneAt={st?.opened_at} byName={st?.opened_by_name} timezone={loc.timezone} /></div>
            <div className="flex items-center justify-between gap-3 text-[13px]"><span className="text-text-2">Closing checklist</span><ChecklistBadge status={st?.closing_checklist_status} required={!!settings.data?.require_closing_checklist} doneAt={st?.closed_at} byName={st?.closed_by_name} timezone={loc.timezone} /></div>
            {st?.opened_at && st.opening_checklist_status !== "completed" && <p className="text-[12px] text-text-3">First clock-in {formatTime(st.opened_at, loc.timezone)}{st.opened_by_name ? ` by ${st.opened_by_name}` : ""}.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent expenses" action={<Link href={`/expenses?location=${loc.id}`} className="text-[12.5px] text-accent hover:underline">All expenses →</Link>} />
          <CardBody>
            {(expenses.data ?? []).length === 0 ? <p className="text-[13px] text-text-3">No expenses recorded.</p> : (
              <ul className="divide-y divide-border">
                {(expenses.data ?? []).map((e) => (
                  <li key={e.id} className="flex items-center gap-2 py-1.5 text-[13px]">
                    <span className="text-text-3 tnum w-14 shrink-0">{formatShortDate(e.business_date).replace(/^\w+, /, "")}</span>
                    <span className="min-w-0 truncate">{e.vendor || e.description || (e.expense_categories as { name: string } | null)?.name || "Expense"}<span className="text-text-3"> · {(e.expense_categories as { name: string } | null)?.name}</span></span>
                    {e.status === "expected" && <StatusBadge kind="expense" value={e.status} />}
                    <span className="ml-auto tnum font-medium">{formatMoney(Number(e.amount), { currency })}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-2.5">
        <CardHeader title="Sales & profit" description="Last 30 days" />
        <CardBody><SalesProfitChart data={series} currency={currency} /></CardBody>
      </Card>

      <Card className="mt-2.5 overflow-hidden">
        <CardHeader title="Recent days" description="Last 14 recorded days" action={<Link href={`/accounting/month?location=${loc.id}`} className="text-[12.5px] text-accent hover:underline">Month view →</Link>} />
        <RecentDaysTable rows={recent.data ?? []} locationId={loc.id} currency={currency} />
      </Card>
    </>
  );
}
