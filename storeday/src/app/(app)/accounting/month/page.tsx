import Link from "next/link";
import { Download } from "lucide-react";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dailyRows } from "@/lib/data/accounting";
import { daysInRange, formatMonth, monthRange } from "@/lib/utils/time";
import { formatMoney, formatPct } from "@/lib/utils/currency";
import { round2 } from "@/lib/calc/accounting";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { SectionLabel } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { StoreSelect } from "@/components/ui/filters";
import { MonthCards, MonthTable } from "@/components/accounting/month-table";
import { WeeklyTable } from "@/components/accounting/weekly-table";
import { buildDayRows, sumDays } from "@/components/accounting/month-model";

export const dynamic = "force-dynamic";

function shiftMonth(yyyymm: string, delta: number): string {
  const [y, m] = yyyymm.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function MonthPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireManagerContext();
  const sp = await searchParams;
  const month = sp.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month) ? sp.month : ctx.today.slice(0, 7);
  const location = sp.location && ctx.locations.some((l) => l.id === sp.location) ? sp.location : null;
  if (ctx.locations.length === 0) {
    return (<><PageHeader title="Month View" back={{ href: "/accounting", label: "Accounting" }} /><EmptyState title="Add a store first" action={<Link href="/stores/new" className="text-accent hover:underline">Add store</Link>} /></>);
  }
  const range = monthRange(month);
  const supabase = await createSupabaseServerClient();
  const rows = await dailyRows(supabase, ctx.org.id, location ? [location] : null, range.from, range.to);
  const stores = ctx.locations.map((l) => ({ id: l.id, name: l.name, timezone: l.timezone }));
  const days = buildDayRows(daysInRange(range), rows, stores);
  const total = sumDays(days);
  const currency = ctx.settings.currency;
  const q = (m: string) => `/accounting/month?month=${m}${location ? `&location=${location}` : ""}`;
  const nextDisabled = month >= ctx.today.slice(0, 7);
  const canEditClosed = ctx.isOwner || ctx.can("can_edit_closed_days");

  return (
    <>
      <PageHeader title="Month View" back={{ href: "/accounting", label: "Accounting" }}
        description={location ? `${stores.find((s) => s.id === location)?.name} · ${formatMonth(range.from)}` : `All stores combined · ${formatMonth(range.from)}`}
        actions={<>
          <StoreSelect locations={stores} />
          <div className="inline-flex items-center rounded-md border border-border bg-surface">
            <Link href={q(shiftMonth(month, -1))} className="px-2.5 py-1 text-text-2 hover:bg-surface-2 rounded-l-md" aria-label="Previous month">‹</Link>
            <span className="px-2 text-[13px] font-medium tnum">{formatMonth(range.from)}</span>
            {nextDisabled ? <span className="px-2.5 py-1 text-text-3 opacity-40">›</span> : <Link href={q(shiftMonth(month, 1))} className="px-2.5 py-1 text-text-2 hover:bg-surface-2 rounded-r-md" aria-label="Next month">›</Link>}
          </div>
          <a href={`/api/export/csv?report=month&month=${month}${location ? `&location=${location}` : ""}`} className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[13px] hover:bg-surface-2"><Download className="h-3.5 w-3.5" />Export CSV</a>
        </>} />

      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
        <Stat label="Total sales" value={formatMoney(total.sales, { currency })} size="sm" />
        <Stat label="Remaining cash" value={formatMoney(round2(total.cash - total.cashGoods), { currency })} size="sm" sub="Cash sales − cash goods" />
        <Stat label="Remaining credit" value={formatMoney(total.card, { currency })} size="sm" sub="Card sales" />
        <Stat label="Total expenses" value={formatMoney(total.expenses, { currency })} size="sm" />
        <Stat label="Total profit" value={formatMoney(total.profit, { currency })} size="sm" tone={total.profit < 0 ? "danger" : "success"} />
        <Stat label="Margin" value={formatPct(total.sales > 0 ? round2((total.profit / total.sales) * 100) : null)} size="sm" sub={`${total.closed}/${total.reports} days closed`} />
      </div>

      <div className="hidden md:block">
        <MonthTable key={`${month}:${location ?? "all"}`} days={days} singleLocationId={location} currency={currency} canEditClosed={canEditClosed} today={ctx.today} />
        <p className="mt-1.5 text-[11.5px] text-text-3">{location ? "Click a date to open Quick Close. Double-click a number to edit it in place; closed days ask for a reason." : "Click a day to see each store. Pick a store above to edit numbers in place."}</p>
      </div>
      <div className="md:hidden"><MonthCards days={days} singleLocationId={location} currency={currency} /></div>

      <div className="mt-6">
        <SectionLabel>Weekly summary</SectionLabel>
        <WeeklyTable days={days} range={range} weekStartsOn={ctx.settings.week_starts_on} currency={currency} />
      </div>
    </>
  );
}
