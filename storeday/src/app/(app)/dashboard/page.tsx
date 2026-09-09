import Link from "next/link";
import { after } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/config/site";
import { Plus } from "lucide-react";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { accountingByDay, accountingByLocation, accountingTotals } from "@/lib/data/accounting";
import { gatherBriefInput, RuleBasedBriefGenerator } from "@/lib/brief";
import { pctChange } from "@/lib/calc/accounting";
import { formatMoney } from "@/lib/utils/currency";
import { daysInRange, formatHours, minutesBetween, previousRange, resolveRange, shortRangeLabel, type RangePreset } from "@/lib/utils/time";
import { DateRangeBar } from "@/components/ui/filters";
import { ChangePill, Stat } from "@/components/ui/stat";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader, Segmented } from "@/components/ui/misc";
import { SalesProfitChart } from "@/components/ui/chart";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { LocationCard } from "@/components/dashboard/location-card";
import { LocationRankings } from "@/components/dashboard/rankings-table";
import { AttentionList } from "@/components/dashboard/attention";
import { buildSeries, chartRange, CHART_WINDOWS, type ChartWindow } from "@/components/dashboard/series";

export const metadata = { title: "Dashboard" };

type SP = Record<string, string | string[] | undefined>;

/** Change where a decrease is good (expenses, labor): keeps the real sign, flips the color. */
function InvertedChange({ value, label }: { value: number | null; label: string }) {
  return <span className="inline-flex items-center gap-2"><ChangePill value={value} invert /><span>{label}</span></span>;
}
const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SP> }) {
  const ctx = await requireManagerContext();
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const currency = ctx.org.currency;

  // Opportunistic notification checks so alerts exist even without cron. Fire-and-forget after the response.
  // Request APIs are off-limits inside after() in Server Components, so the auth cookies are snapshotted here.
  if (ctx.isOwner) {
    const orgId = ctx.org.id;
    const cookieSnapshot = (await cookies()).getAll();
    after(async () => {
      try {
        const bg = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, { cookies: { getAll: () => cookieSnapshot, setAll() {} } });
        await bg.rpc("run_org_checks", { p_org: orgId });
      } catch { /* ignore */ }
    });
  }

  if (ctx.locations.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <EmptyState
          title="No stores yet"
          description={ctx.isOwner ? "Add your first store to start closing days, tracking labor and seeing profit here." : "You have not been assigned to a store yet. Ask the owner to add you to one."}
          action={ctx.isOwner ? <Link href="/stores/new" className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-md bg-accent text-white text-[13.5px] font-medium"><Plus className="h-4 w-4" />Add store</Link> : undefined}
        />
      </>
    );
  }

  const preset = (str(sp.range) as RangePreset) || "today";
  const range = resolveRange(["today", "yesterday", "this_week", "this_month", "custom"].includes(preset) ? preset : "today", ctx.today, ctx.settings.week_starts_on, { from: str(sp.from), to: str(sp.to) });
  const prev = previousRange(range);
  const locIds = ctx.locations.map((l) => l.id);
  const chartWindow = (CHART_WINDOWS.some((c) => c.value === str(sp.chart)) ? str(sp.chart) : "30d") as ChartWindow;
  const cRange = chartRange(chartWindow, ctx.today);

  const [totals, prevTotals, byLoc, prevByLoc, byDay, briefInput, completedToday] = await Promise.all([
    accountingTotals(supabase, ctx.org.id, locIds, range.from, range.to),
    accountingTotals(supabase, ctx.org.id, locIds, prev.from, prev.to),
    accountingByLocation(supabase, ctx.org.id, range.from, range.to),
    accountingByLocation(supabase, ctx.org.id, prev.from, prev.to),
    accountingByDay(supabase, ctx.org.id, locIds, cRange.from, cRange.to),
    gatherBriefInput(supabase, ctx, ctx.today),
    supabase.from("shifts").select("worked_minutes").in("location_id", locIds).eq("business_date", ctx.today).eq("status", "completed"),
  ]);
  const brief = await new RuleBasedBriefGenerator().generate(briefInput);

  const byLocMap = new Map(byLoc.map((r) => [r.location_id, r]));
  const prevByLocMap = new Map(prevByLoc.map((r) => [r.location_id, r]));
  const days = daysInRange(range).length;
  const closedDays = totals?.days_closed ?? 0;
  const reportDenom = ctx.locations.length * days;
  const activeShifts = briefInput.stores.flatMap((s) => s.activeShifts);
  const now = new Date();
  const runningMinutes = activeShifts.reduce((a, s) => a + Math.max(0, minutesBetween(s.clock_in_at, now)), 0);
  const completedMinutes = (completedToday.data ?? []).reduce((a, s) => a + (s.worked_minutes ?? 0), 0);
  const series = buildSeries(byDay, cRange, { byWeek: chartWindow === "1y", weekStartsOn: ctx.settings.week_starts_on });

  const chartHref = (w: ChartWindow) => {
    const q = new URLSearchParams();
    for (const k of ["range", "from", "to"]) { const v = str(sp[k]); if (v) q.set(k, v); }
    q.set("chart", w);
    return `/dashboard?${q}`;
  };
  const sub = `vs ${shortRangeLabel(prev)}`;

  return (
    <>
      <WelcomeBanner />
      <PageHeader title="Dashboard" description={`${ctx.org.name} · ${range.from === range.to ? range.label : shortRangeLabel(range)}`}
        actions={<DateRangeBar presets={["today", "yesterday", "this_week", "this_month", "custom"]} />} />

      {/* Money */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Stat size="lg" label="Total sales" value={formatMoney(totals?.total_sales ?? 0, { currency })} change={pctChange(totals?.total_sales ?? 0, prevTotals?.total_sales)} sub={sub} />
        <Stat size="lg" label="Profit" value={formatMoney(totals?.profit ?? 0, { currency })} tone={(totals?.profit ?? 0) < 0 ? "danger" : "default"} change={pctChange(totals?.profit ?? 0, prevTotals?.profit)} sub={sub} />
        <Stat size="lg" label="Expenses" value={formatMoney(totals?.total_expenses ?? 0, { currency })} sub={<InvertedChange value={pctChange(totals?.total_expenses ?? 0, prevTotals?.total_expenses)} label={sub} />} />
        <Stat size="lg" label="Labor" value={formatMoney(totals?.labor_total ?? 0, { currency })} sub={<InvertedChange value={pctChange(totals?.labor_total ?? 0, prevTotals?.labor_total)} label={sub} />} />
      </div>

      {/* Operations */}
      <div className="grid grid-cols-3 gap-2.5 mt-2.5">
        <Stat label="Stores reported" value={<>{closedDays} <span className="text-text-3 font-normal">/ {reportDenom}</span></>} tone={closedDays < reportDenom && range.to < ctx.today ? "warn" : "default"} sub={days > 1 ? "closed days" : "closed today"} />
        <Stat label="Employees working" value={activeShifts.length} tone={activeShifts.length > 0 ? "success" : "default"} sub={<Link href="/working" className="hover:underline">Who&apos;s working →</Link>} />
        <Stat label="Total hours today" value={formatHours(completedMinutes + runningMinutes)} sub={runningMinutes > 0 ? `${formatHours(runningMinutes)} in progress` : undefined} />
      </div>

      {/* Chart */}
      <Card className="mt-4">
        <CardHeader title="Sales & profit" description={`${shortRangeLabel(cRange)}${chartWindow === "1y" ? " · by week" : ""}`}
          action={<Segmented items={CHART_WINDOWS.map((c) => ({ href: chartHref(c.value), label: c.label, active: c.value === chartWindow }))} />} />
        <CardBody><SalesProfitChart data={series} currency={currency} /></CardBody>
      </Card>

      {/* Stores */}
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mt-5 mb-2">Stores</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {briefInput.stores.map((s) => {
          const acc = byLocMap.get(s.location.id);
          return (
            <LocationCard key={s.location.id} currency={currency} rangeLabel={range.label}
              store={{ id: s.location.id, name: s.location.name, sales: acc?.total_sales ?? 0, profit: acc?.profit ?? 0, status: s.status, items: brief.attention.filter((i) => i.locationId === s.location.id) }} />
          );
        })}
      </div>

      {ctx.locations.length > 1 && (
        <>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mt-5 mb-2">Location rankings <span className="font-normal normal-case tracking-normal">· {range.label}, change {sub}</span></h2>
          <LocationRankings currency={currency} rows={ctx.locations.map((l) => ({ id: l.id, name: l.name, current: byLocMap.get(l.id) ?? null, previous: prevByLocMap.get(l.id) ?? null }))} />
        </>
      )}

      <Card className="mt-5">
        <CardHeader title="Attention" description="Today, across your stores" action={<Link href="/brief" className="text-[12.5px] text-accent hover:underline">Daily brief →</Link>} />
        <CardBody><AttentionList items={brief.attention} /></CardBody>
      </Card>
    </>
  );
}
