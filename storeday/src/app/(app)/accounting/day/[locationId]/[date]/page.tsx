import Link from "next/link";
import { notFound } from "next/navigation";
import { requireManagerContext, pickLocation } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadDayContext, reportToInputs } from "@/lib/data/accounting";
import { computeDailyTotals } from "@/lib/calc/accounting";
import { formatMoney, formatPct } from "@/lib/utils/currency";
import { formatDateTime, formatWeekdayDate } from "@/lib/utils/time";
import { PageHeader } from "@/components/ui/misc";
import { Card, SectionLabel } from "@/components/ui/card";
import { KV, Stat } from "@/components/ui/stat";
import { StatusBadge } from "@/components/ui/badge";
import { LaborPanel } from "@/components/accounting/labor-panel";
import { AttentionList } from "@/components/accounting/attention-list";
import { MONEY_FIELD_LABELS, MONEY_FIELDS, parseAttention, type LaborRow, type MoneyField } from "@/components/accounting/types";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = { "day.closed": "Closed the day", "day.reopened": "Reopened the day", "report.edited_closed": "Edited a closed day" };

function diffs(before: unknown, after: unknown): Array<{ key: string; label: string; from: unknown; to: unknown }> {
  const b = (before && typeof before === "object" ? before : {}) as Record<string, unknown>;
  const a = (after && typeof after === "object" ? after : {}) as Record<string, unknown>;
  const keys: Array<{ key: string; label: string }> = [...MONEY_FIELDS.map((k) => ({ key: k, label: MONEY_FIELD_LABELS[k as MoneyField] })), { key: "notes", label: "Notes" }, { key: "status", label: "Status" }];
  return keys.filter(({ key }) => key in a || key in b).filter(({ key }) => String(a[key] ?? "") !== String(b[key] ?? "")).map(({ key, label }) => ({ key, label, from: b[key] ?? null, to: a[key] ?? null }));
}

export default async function DayRecordPage({ params }: { params: Promise<{ locationId: string; date: string }> }) {
  const ctx = await requireManagerContext();
  const { locationId, date } = await params;
  const location = pickLocation(ctx, locationId);
  if (!location || !/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const supabase = await createSupabaseServerClient();
  const day = await loadDayContext(supabase, location.id, date);
  const currency = ctx.settings.currency;
  const [{ data: closeouts }, { data: logs }] = await Promise.all([
    supabase.from("closeout_reports").select("*").eq("location_id", location.id).eq("business_date", date).order("closed_at", { ascending: false }),
    day.report ? supabase.from("activity_logs").select("*").eq("entity_id", day.report.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] as never[] }),
  ]);
  const actorIds = Array.from(new Set([...(closeouts ?? []).map((c) => c.closed_by), ...(logs ?? []).map((l) => l.actor_id)].filter((x): x is string => !!x)));
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds) : { data: [] };
  const who = (id: string | null) => { const p = (actors ?? []).find((a) => a.id === id); return p?.full_name || p?.email || "Someone"; };

  const inputs = reportToInputs(day.report);
  const totals = computeDailyTotals(inputs, day.laborSummary, day.detailed);
  const m = (v: number | null | undefined) => (v == null ? "—" : formatMoney(v, { currency }));
  const labor: LaborRow[] = day.labor.map((r) => ({ shift_id: r.shift_id, employee_id: r.employee_id, employee_name: r.employee_name, clock_in_at: r.clock_in_at, clock_out_at: r.clock_out_at, worked_minutes: r.worked_minutes, hourly_rate: r.hourly_rate == null ? null : Number(r.hourly_rate), labor_cost: r.labor_cost == null ? null : Number(r.labor_cost), status: r.status, verification_status: r.verification_status }));
  const fmtVal = (k: string, v: unknown) => (k === "status" || k === "notes" ? String(v ?? "—") : v == null ? "—" : formatMoney(Number(v), { currency }));

  return (
    <>
      <PageHeader title={<span className="inline-flex items-center gap-2">{formatWeekdayDate(date)} <StatusBadge kind="report" value={day.report?.status} /></span>}
        description={<Link href={`/stores/${location.id}`} className="hover:underline">{location.name}</Link>} back={{ href: `/accounting/month?location=${location.id}&month=${date.slice(0, 7)}`, label: "Month view" }}
        actions={<Link href={`/accounting/quick-close?location=${location.id}&date=${date}`} className="inline-flex h-8.5 items-center rounded-md bg-accent px-3 text-[13.5px] font-medium text-white hover:bg-accent-hover">Open in Quick Close</Link>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <Stat label="Sales" value={m(totals.totalSales)} size="sm" />
        <Stat label="Expenses" value={m(totals.totalExpenses)} size="sm" />
        <Stat label="Profit" value={m(totals.profit)} size="sm" tone={totals.profit < 0 ? "danger" : "success"} />
        <Stat label="Margin" value={formatPct(totals.marginPct)} size="sm" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 space-y-4">
          <div><SectionLabel>Sales</SectionLabel><KV label="Cash" value={m(inputs.cash_sales)} /><KV label="Card" value={m(inputs.card_sales)} />{ctx.settings.other_sales_enabled && <KV label="Other" value={m(inputs.other_sales)} />}<KV label="Total sales" value={m(totals.totalSales)} strong /></div>
          <div><SectionLabel>Goods / inventory</SectionLabel><KV label="Cash goods" value={m(inputs.cash_goods)} /><KV label="Check goods" value={m(inputs.check_goods)} />{day.detailed.goods > 0 && <KV label="Detailed goods" value={m(day.detailed.goods)} />}<KV label="Goods" value={m(totals.goodsTotal)} strong /></div>
          <div><SectionLabel>Expenses</SectionLabel><KV label="Utilities" value={m(inputs.utilities)} /><KV label="Other" value={m(inputs.other_expenses)} /><KV label="Labor" value={m(totals.laborTotal)} /><KV label="Total expenses" value={m(totals.totalExpenses)} strong /></div>
          {ctx.settings.cash_check_enabled && <div><SectionLabel>Cash check</SectionLabel><KV label="Expected" value={m(inputs.expected_cash)} /><KV label="Actual" value={m(inputs.actual_cash)} /><KV label="Over / short" value={totals.cashDifference == null ? "—" : `${totals.cashDifference > 0 ? "+" : ""}${formatMoney(totals.cashDifference, { currency })}`} tone={totals.cashDifference == null ? undefined : totals.cashDifference < 0 ? "danger" : totals.cashDifference > 0 ? "warn" : "success"} strong /></div>}
          {day.report?.notes && <div><SectionLabel>Notes</SectionLabel><p className="text-[13px] whitespace-pre-wrap">{day.report.notes}</p></div>}
        </Card>
        <div className="space-y-4">
          <Card className="p-4"><SectionLabel>Labor</SectionLabel><LaborPanel rows={labor} summary={day.laborSummary} timezone={location.timezone} currency={currency} defaultOpen /></Card>
          <Card className="p-4">
            <SectionLabel>Detailed expenses</SectionLabel>
            {day.expenses.length === 0 ? <p className="text-[12.5px] text-text-3">None recorded.</p> : (
              <table className="table"><thead><tr><th>Category</th><th>Vendor</th><th>Paid</th><th className="num">Amount</th></tr></thead><tbody>
                {day.expenses.map((e) => <tr key={e.id}><td>{e.category_name} <span className="text-text-3">· {e.bucket}</span></td><td className="text-text-2">{e.vendor ?? "—"}</td><td><StatusBadge kind="expense" value={e.status} /></td><td className="num font-medium">{m(e.amount)}</td></tr>)}
              </tbody></table>
            )}
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <Card className="p-4">
          <SectionLabel>Closeout history</SectionLabel>
          {(closeouts ?? []).length === 0 ? <p className="text-[12.5px] text-text-3">Not closed yet.</p> : (
            <div className="space-y-3">
              {(closeouts ?? []).map((c, i) => (
                <div key={c.id} className={cn("text-[13px]", i > 0 && "opacity-70")}>
                  <div className="flex items-center justify-between"><span className="font-medium">{formatDateTime(c.closed_at, location.timezone)} · {who(c.closed_by)}</span>{i === 0 && <span className="text-[11px] text-success">Latest</span>}</div>
                  <div className="text-text-2 tnum">Sales {m(c.total_sales)} · Expenses {m(c.total_expenses)} · Profit {m(c.profit)}{c.cash_difference != null && ` · Cash ${c.cash_difference > 0 ? "+" : ""}${formatMoney(c.cash_difference, { currency })}`}</div>
                  <AttentionList items={parseAttention(c.attention)} className="mt-1" />
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <SectionLabel>Activity</SectionLabel>
          {(logs ?? []).length === 0 ? <p className="text-[12.5px] text-text-3">No activity recorded.</p> : (
            <ul className="space-y-3">
              {(logs ?? []).map((l) => {
                const d = diffs(l.before_data, l.after_data);
                return (
                  <li key={l.id} className="text-[13px]">
                    <div className="flex items-center justify-between gap-2"><span className="font-medium">{ACTION_LABELS[l.action] ?? l.action}</span><span className="text-[11.5px] text-text-3 tnum">{formatDateTime(l.created_at, location.timezone)}</span></div>
                    <div className="text-text-2">{who(l.actor_id)}{l.note && <span> · Reason: <i>{l.note}</i></span>}</div>
                    {d.length > 0 && (
                      <ul className="mt-1 text-[12px] tnum">
                        {d.map((x) => <li key={x.key}><span className="text-text-3">{x.label}:</span> <span className="line-through text-text-3">{fmtVal(x.key, x.from)}</span> → <b>{fmtVal(x.key, x.to)}</b></li>)}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
