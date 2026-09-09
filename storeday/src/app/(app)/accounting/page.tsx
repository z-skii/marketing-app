import Link from "next/link";
import { CalendarDays, Grid3x3, Zap } from "lucide-react";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dailyRows } from "@/lib/data/accounting";
import { addISODays, formatShortDate, todayIn } from "@/lib/utils/time";
import { formatMoney } from "@/lib/utils/currency";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { SectionLabel } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  const ctx = await requireManagerContext();
  if (ctx.locations.length === 0) {
    return (<><PageHeader title="Accounting" /><EmptyState title="Add your first store" description="Daily accounting is recorded per store." action={<Link href="/stores/new" className="inline-flex h-8.5 items-center rounded-md bg-accent px-3 text-[13.5px] font-medium text-white">Add store</Link>} /></>);
  }
  const supabase = await createSupabaseServerClient();
  const todays = ctx.locations.map((l) => todayIn(l.timezone));
  const maxToday = todays.reduce((a, b) => (a > b ? a : b));
  const minToday = todays.reduce((a, b) => (a < b ? a : b));
  const rows = await dailyRows(supabase, ctx.org.id, null, addISODays(minToday, -7), maxToday);
  const currency = ctx.settings.currency;
  const find = (locationId: string, date: string) => rows.find((r) => r.location_id === locationId && r.business_date === date);

  const stores = ctx.locations.map((l, i) => ({ l, today: todays[i], row: find(l.id, todays[i]) }));
  const closedToday = stores.filter((s) => s.row?.status === "closed").length;

  const notClosed: Array<{ id: string; name: string; date: string; status: "open" | null; sales: number | null }> = [];
  for (const { l, today } of stores) {
    const created = l.created_at.slice(0, 10);
    for (let i = 1; i <= 7; i++) {
      const date = addISODays(today, -i);
      if (date < created) continue;
      const r = find(l.id, date);
      if (r?.status === "closed") continue;
      notClosed.push({ id: l.id, name: l.name, date, status: r?.daily_report_id ? "open" : null, sales: r?.total_sales ?? null });
    }
  }
  notClosed.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.name.localeCompare(b.name)));

  return (
    <>
      <PageHeader title="Accounting" description={`${closedToday}/${stores.length} stores closed today`} />

      <div className="grid gap-3 md:grid-cols-3 mb-6">
        <Entry href="/accounting/quick-close" icon={<Zap className="h-5 w-5" />} title="Quick Close" desc="One store, one day. Numbers in hand → closed in about a minute." />
        <Entry href={`/accounting/rapid-entry?date=${ctx.today}`} icon={<Grid3x3 className="h-5 w-5" />} title="Rapid Entry" desc="Every store on one keyboard-driven grid. Enter moves down, Tab moves right." primary />
        <Entry href="/accounting/month" icon={<CalendarDays className="h-5 w-5" />} title="Month View" desc="Spreadsheet of the month with weekly totals and CSV export." />
      </div>

      <SectionLabel>Today by store</SectionLabel>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {stores.map(({ l, today, row }) => (
          <Link key={l.id} href={`/accounting/quick-close?location=${l.id}&date=${today}`} className="card p-3 hover:border-border-strong">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">{l.name}</span>
              <StatusBadge kind="report" value={row?.daily_report_id ? row.status : null} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
              <div><div className="text-[10px] uppercase tracking-wider text-text-3">Sales</div><div className="tnum text-[15px] font-semibold">{row?.daily_report_id ? formatMoney(row.total_sales, { currency }) : "—"}</div></div>
              <div><div className="text-[10px] uppercase tracking-wider text-text-3">Profit</div><div className={cn("tnum text-[15px] font-semibold", row?.daily_report_id && (row.profit ?? 0) < 0 ? "text-danger" : row?.daily_report_id ? "text-success" : "")}>{row?.daily_report_id ? formatMoney(row.profit, { currency }) : "—"}</div></div>
            </div>
            <div className="mt-1 text-[11.5px] text-text-3">{formatShortDate(today)}{row?.labor_total ? ` · labor ${formatMoney(row.labor_total, { currency })}` : ""}</div>
          </Link>
        ))}
      </div>

      <SectionLabel right={<span className="text-[11px] text-text-3">{notClosed.length} day{notClosed.length === 1 ? "" : "s"}</span>}>Not closed in the last 7 days</SectionLabel>
      {notClosed.length === 0 ? (
        <div className="card p-4 text-[13px] text-success">✓ Every day in the last week is closed.</div>
      ) : (
        <div className="card divide-y divide-border">
          {notClosed.map((d) => (
            <Link key={`${d.id}:${d.date}`} href={`/accounting/quick-close?location=${d.id}&date=${d.date}`} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px] hover:bg-surface-2/60">
              <span className="min-w-0 truncate"><span className="tnum text-text-2">{formatShortDate(d.date)}</span> · <span className="font-medium">{d.name}</span></span>
              <span className="flex items-center gap-3 shrink-0">
                {d.sales != null && d.status === "open" && <span className="tnum text-text-2">{formatMoney(d.sales, { currency })}</span>}
                <StatusBadge kind="report" value={d.status} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function Entry({ href, icon, title, desc, primary }: { href: string; icon: React.ReactNode; title: string; desc: string; primary?: boolean }) {
  return (
    <Link href={href} className={cn("card p-4 flex items-start gap-3 hover:border-border-strong", primary && "border-accent bg-accent-soft/40")}>
      <span className={cn("rounded-md p-2", primary ? "bg-accent text-white" : "bg-surface-2 text-text-2")}>{icon}</span>
      <span className="min-w-0"><span className="block text-[15px] font-semibold">{title}</span><span className="block text-[12.5px] text-text-3 mt-0.5">{desc}</span></span>
    </Link>
  );
}
