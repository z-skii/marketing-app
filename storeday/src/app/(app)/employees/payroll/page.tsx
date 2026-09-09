import Link from "next/link";
import { Download } from "lucide-react";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listEmployees } from "@/lib/data/team";
import { estimatePayroll, type OvertimeRules, type PayrollShift } from "@/lib/calc/payroll";
import { round2 } from "@/lib/calc/accounting";
import { formatMoney } from "@/lib/utils/currency";
import { formatMinutes, resolveRange, type RangePreset } from "@/lib/utils/time";
import { PageHeader, Tabs, TableWrap, EmptyState } from "@/components/ui/misc";
import { DateRangeBar, StoreSelect } from "@/components/ui/filters";
import { Alert } from "@/components/ui/form";
import { Stat } from "@/components/ui/stat";

export const dynamic = "force-dynamic";

const PRESETS: RangePreset[] = ["this_week", "last_week", "this_month", "custom"];

export default async function PayrollEstimatePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireManagerContext();
  const sp = await searchParams;
  const preset = PRESETS.includes(sp.range as RangePreset) ? (sp.range as RangePreset) : "this_week";
  const range = resolveRange(preset, ctx.today, ctx.settings.week_starts_on, sp);
  const locationId = sp.location && ctx.locations.some((l) => l.id === sp.location) ? sp.location : null;
  const supabase = await createSupabaseServerClient();

  let q = supabase.from("shifts").select("employee_id, business_date, worked_minutes, hourly_rate_snapshot")
    .eq("organization_id", ctx.org.id).eq("status", "completed").gte("business_date", range.from).lte("business_date", range.to);
  if (locationId) q = q.eq("location_id", locationId);
  const [{ data: shifts }, employees] = await Promise.all([q, listEmployees(supabase, ctx.org.id, { includeInactive: true })]);

  const rules: OvertimeRules = {
    enabled: ctx.settings.overtime_enabled,
    weeklyThresholdHours: Number(ctx.settings.overtime_weekly_hours),
    dailyThresholdHours: ctx.settings.overtime_daily_hours == null ? null : Number(ctx.settings.overtime_daily_hours),
    multiplier: Number(ctx.settings.overtime_multiplier),
    weekStartsOn: ctx.settings.week_starts_on,
  };
  const input: PayrollShift[] = (shifts ?? []).map((s) => ({ employee_id: s.employee_id, business_date: s.business_date, worked_minutes: s.worked_minutes ?? 0, hourly_rate: Number(s.hourly_rate_snapshot ?? 0) }));
  const names = new Map(employees.map((e) => [e.id, e.full_name]));
  const rows = estimatePayroll(input, rules).map((p) => ({ ...p, name: names.get(p.employee_id) ?? "Former employee" })).sort((a, b) => a.name.localeCompare(b.name));
  const totals = rows.reduce((t, r) => ({
    regularMinutes: t.regularMinutes + r.regularMinutes, overtimeMinutes: t.overtimeMinutes + r.overtimeMinutes,
    regularPay: t.regularPay + r.regularPay, overtimePay: t.overtimePay + r.overtimePay, grossPay: t.grossPay + r.grossPay, shifts: t.shifts + r.shifts,
  }), { regularMinutes: 0, overtimeMinutes: 0, regularPay: 0, overtimePay: 0, grossPay: 0, shifts: 0 });
  const missingRate = input.filter((s) => s.hourly_rate <= 0 && s.worked_minutes > 0).length;
  const currency = ctx.settings.currency;
  const csv = `/api/export/csv?report=payroll&from=${range.from}&to=${range.to}${locationId ? `&location=${locationId}` : ""}`;
  const money = (n: number) => formatMoney(n, { currency });

  return (
    <div>
      <PageHeader title="Payroll estimate" description={`${range.label} · ${range.from} → ${range.to}`}
        actions={<a href={csv} className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-md border border-border bg-surface text-[13.5px] font-medium hover:bg-surface-2"><Download className="h-4 w-4" />Export CSV</a>} />
      <Tabs items={[{ href: "/employees", label: "Employees" }, { href: "/employees/payroll", label: "Payroll estimate", active: true }, ...(ctx.isOwner ? [{ href: "/employees?tab=invitations", label: "Invitations" }] : [])]} />
      <Alert tone="warn" title="Estimate — not a payroll system" className="mb-3">
        Gross wages from completed Verified Shifts × the rate on each shift. No taxes, withholdings, tips or benefits.
        Overtime: {rules.enabled ? <>over {rules.weeklyThresholdHours}h/week{rules.dailyThresholdHours != null ? ` or ${rules.dailyThresholdHours}h/day` : ""} at {rules.multiplier}×</> : "off"} — configured in <Link href="/settings" className="underline">Settings</Link>.
      </Alert>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <DateRangeBar presets={PRESETS} />
        {ctx.locations.length > 1 && <StoreSelect locations={ctx.locations.map((l) => ({ id: l.id, name: l.name }))} />}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <Stat label="Estimated gross" value={money(round2(totals.grossPay))} size="md" />
        <Stat label="Regular hours" value={formatMinutes(totals.regularMinutes)} sub={money(round2(totals.regularPay))} />
        <Stat label="Overtime hours" value={formatMinutes(totals.overtimeMinutes)} sub={money(round2(totals.overtimePay))} tone={totals.overtimeMinutes > 0 ? "warn" : "default"} />
        <Stat label="Shifts" value={totals.shifts} sub={`${rows.length} ${rows.length === 1 ? "employee" : "employees"}`} />
      </div>
      {missingRate > 0 && <Alert tone="info" className="mb-3">{missingRate} completed {missingRate === 1 ? "shift has" : "shifts have"} no pay rate and count as $0. Add a rate on the employee profile with an effective date on or before those shifts.</Alert>}
      {rows.length === 0 ? (
        <EmptyState title="No completed shifts in this period" description="Payroll is estimated from Verified Shift clock-ins. Pick another range or add manual shifts from the Who's Working page." />
      ) : (
        <>
          <TableWrap className="hidden md:block">
            <table className="table">
              <thead><tr><th>Employee</th><th className="num">Regular h</th><th className="num">OT h</th><th className="num">Rate</th><th className="num">Regular $</th><th className="num">OT $</th><th className="num">Estimated gross</th><th className="num">Shifts</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employee_id}>
                    <td><Link href={`/employees/${r.employee_id}`} className="font-medium hover:underline">{r.name}</Link></td>
                    <td className="num">{formatMinutes(r.regularMinutes)}</td>
                    <td className={`num ${r.overtimeMinutes > 0 ? "text-warn font-medium" : "text-text-3"}`}>{r.overtimeMinutes > 0 ? formatMinutes(r.overtimeMinutes) : "—"}</td>
                    <td className="num">{r.rate > 0 ? `${money(r.rate)}/hr` : <span className="text-text-3">no rate</span>}</td>
                    <td className="num">{money(r.regularPay)}</td>
                    <td className="num">{r.overtimePay > 0 ? money(r.overtimePay) : <span className="text-text-3">—</span>}</td>
                    <td className="num font-semibold">{money(r.grossPay)}</td>
                    <td className="num">{r.shifts}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td>Total</td><td className="num">{formatMinutes(totals.regularMinutes)}</td><td className="num">{formatMinutes(totals.overtimeMinutes)}</td><td></td><td className="num">{money(round2(totals.regularPay))}</td><td className="num">{money(round2(totals.overtimePay))}</td><td className="num">{money(round2(totals.grossPay))}</td><td className="num">{totals.shifts}</td></tr>
              </tfoot>
            </table>
          </TableWrap>
          <div className="md:hidden space-y-2">
            {rows.map((r) => (
              <Link key={r.employee_id} href={`/employees/${r.employee_id}`} className="card block px-3.5 py-3">
                <div className="flex items-center justify-between"><span className="font-medium">{r.name}</span><span className="tnum font-semibold">{money(r.grossPay)}</span></div>
                <div className="mt-1 text-[12.5px] text-text-2 tnum flex flex-wrap gap-x-3">
                  <span>{formatMinutes(r.regularMinutes)} reg</span>
                  {r.overtimeMinutes > 0 && <span className="text-warn">{formatMinutes(r.overtimeMinutes)} OT</span>}
                  <span>{r.rate > 0 ? `${money(r.rate)}/hr` : "no rate"}</span>
                  <span>{r.shifts} shifts</span>
                </div>
              </Link>
            ))}
            <div className="card px-3.5 py-3 flex items-center justify-between font-semibold"><span>Total</span><span className="tnum">{money(round2(totals.grossPay))}</span></div>
          </div>
        </>
      )}
    </div>
  );
}
