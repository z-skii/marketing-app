import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireOrgContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { estimatePayroll } from "@/lib/calc/payroll";
import { formatMoney } from "@/lib/utils/currency";
import { formatMinutes, formatShortDate, formatTime, resolveRange, shortRangeLabel } from "@/lib/utils/time";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Stat } from "@/components/ui/stat";
import { VerificationBadge } from "@/components/shifts/verification-badge";

export const metadata: Metadata = { title: "My hours" };

export default async function MyHoursPage() {
  const ctx = await requireOrgContext();
  if (!ctx.employee) {
    return <EmptyState title="No hours yet" description="You are not set up as an employee, so there are no shifts to show." />;
  }
  const emp = ctx.employee;
  const supabase = await createSupabaseServerClient();
  const wso = ctx.settings.week_starts_on;
  const thisWeek = resolveRange("this_week", ctx.today, wso);
  const lastWeek = resolveRange("last_week", ctx.today, wso);
  const thisMonth = resolveRange("this_month", ctx.today, wso);
  const from = [lastWeek.from, thisMonth.from].sort()[0];

  const [{ data: shifts }, { data: rates }] = await Promise.all([
    supabase
      .from("shifts")
      .select("id, business_date, clock_in_at, clock_out_at, status, verification_status, worked_minutes, break_minutes, location_id, locations(name, timezone)")
      .eq("employee_id", emp.id)
      .gte("business_date", from)
      .neq("status", "cancelled")
      .order("clock_in_at", { ascending: false }),
    supabase.from("employee_pay_rates").select("hourly_rate, effective_from").eq("employee_id", emp.id).lte("effective_from", ctx.today).order("effective_from", { ascending: false }).limit(1),
  ]);
  const rate = rates?.[0] ? Number(rates[0].hourly_rate) : null;
  const rows = (shifts ?? []).map((s) => {
    const loc = s.locations as { name: string; timezone: string } | null;
    return { ...s, store: loc?.name ?? "Store", tz: loc?.timezone ?? ctx.org.timezone };
  });
  const completedIn = (r: { from: string; to: string }) => rows.filter((s) => s.status === "completed" && s.business_date >= r.from && s.business_date <= r.to);
  const sum = (list: typeof rows) => list.reduce((a, s) => a + (s.worked_minutes ?? 0), 0);
  const weekMinutes = sum(completedIn(thisWeek));
  const lastWeekMinutes = sum(completedIn(lastWeek));
  const monthMinutes = sum(completedIn(thisMonth));
  const active = rows.find((s) => s.status === "active") ?? null;

  const weekPay = rate != null ? estimatePayroll(
    completedIn(thisWeek).map((s) => ({ employee_id: emp.id, business_date: s.business_date, worked_minutes: s.worked_minutes ?? 0, hourly_rate: rate })),
    {
      enabled: ctx.settings.overtime_enabled, weeklyThresholdHours: Number(ctx.settings.overtime_weekly_hours),
      dailyThresholdHours: ctx.settings.overtime_daily_hours == null ? null : Number(ctx.settings.overtime_daily_hours),
      multiplier: Number(ctx.settings.overtime_multiplier), weekStartsOn: wso,
    },
  )[0] ?? null : null;
  const currency = ctx.settings.currency;

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="My hours" description="Completed shifts only. A running shift is added when you clock out." />
      <div className="grid grid-cols-3 gap-2">
        <Stat label="This week" value={formatMinutes(weekMinutes)} sub={shortRangeLabel(thisWeek)} size="sm" />
        <Stat label="Last week" value={formatMinutes(lastWeekMinutes)} sub={shortRangeLabel(lastWeek)} size="sm" />
        <Stat label="This month" value={formatMinutes(monthMinutes)} sub={shortRangeLabel(thisMonth)} size="sm" />
      </div>

      <Card className="mt-3">
        <CardHeader title="Estimated pay this week" description="Estimate before taxes and deductions. Your final paycheck is set by your employer." />
        <CardBody>
          {rate == null ? (
            <div className="text-[13px] text-text-3">No hourly rate on file yet.</div>
          ) : (
            <div className="divide-y divide-border text-[13.5px]">
              <div className="flex justify-between py-1"><span className="text-text-2">Hourly rate</span><span className="tnum font-medium">{formatMoney(rate, { currency })}/h</span></div>
              {weekPay && weekPay.overtimeMinutes > 0 && (
                <>
                  <div className="flex justify-between py-1"><span className="text-text-2">Regular · {formatMinutes(weekPay.regularMinutes)}</span><span className="tnum">{formatMoney(weekPay.regularPay, { currency })}</span></div>
                  <div className="flex justify-between py-1"><span className="text-text-2">Overtime · {formatMinutes(weekPay.overtimeMinutes)}</span><span className="tnum">{formatMoney(weekPay.overtimePay, { currency })}</span></div>
                </>
              )}
              <div className="flex justify-between py-1"><span className="font-semibold">Estimated gross</span><span className="tnum text-[15px] font-semibold">{formatMoney(weekPay?.grossPay ?? 0, { currency })}</span></div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="mt-3">
        <CardHeader title="Shifts" description={`Since ${formatShortDate(from)}`} />
        <CardBody>
          {rows.length === 0 ? (
            <div className="text-[13px] text-text-3">No shifts yet. <Link href="/clock" className="text-accent">Clock in</Link> to start one.</div>
          ) : (
            <ul className="divide-y divide-border">
              {active && (
                <li>
                  <Link href={`/shifts/${active.id}`} className="flex items-center gap-3 py-2 -mx-1 px-1 rounded hover:bg-surface-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium">{formatShortDate(active.business_date)} · {active.store}</div>
                      <div className="text-[12.5px] text-text-3 tnum">{formatTime(active.clock_in_at, active.tz)} – now</div>
                    </div>
                    <StatusBadge kind="shift" value="active" />
                    <ChevronRight className="h-4 w-4 text-text-3" />
                  </Link>
                </li>
              )}
              {rows.filter((s) => s.status !== "active").map((s) => (
                <li key={s.id}>
                  <Link href={`/shifts/${s.id}`} className="flex items-center gap-3 py-2 -mx-1 px-1 rounded hover:bg-surface-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium">{formatShortDate(s.business_date)} · {s.store}</div>
                      <div className="text-[12.5px] text-text-3 tnum">{formatTime(s.clock_in_at, s.tz)} – {formatTime(s.clock_out_at, s.tz)}{s.break_minutes > 0 ? ` · ${s.break_minutes}m break` : ""}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="tnum text-[14px] font-semibold">{formatMinutes(s.worked_minutes)}</div>
                      <VerificationBadge status={s.verification_status} />
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
