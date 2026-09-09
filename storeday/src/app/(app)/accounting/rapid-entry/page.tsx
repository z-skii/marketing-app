import Link from "next/link";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reportToInputs } from "@/lib/data/accounting";
import { groupDetailedExpenses, summarizeLabor, type AccountingBucket, type DetailedExpenseTotals } from "@/lib/calc/accounting";
import { formatWeekdayDate, todayIn } from "@/lib/utils/time";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { StoreDateBar } from "@/components/accounting/store-date-bar";
import { RapidEntryGrid, type RapidRowData } from "@/components/accounting/rapid-entry-grid";

export const dynamic = "force-dynamic";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function RapidEntryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireManagerContext();
  const sp = await searchParams;
  // Stores can sit in different timezones: the page's "today" is the latest local today; each row knows its own.
  const todays = ctx.locations.map((l) => todayIn(l.timezone));
  const today = todays.length ? todays.reduce((a, b) => (a > b ? a : b)) : ctx.today;
  const date = sp.date && DATE_RE.test(sp.date) && sp.date <= today ? sp.date : today;
  if (ctx.locations.length === 0) {
    return (
      <>
        <PageHeader title="Rapid Entry" back={{ href: "/accounting", label: "Accounting" }} />
        <EmptyState title="Add a store first" action={<Link href="/stores/new" className="inline-flex h-8.5 items-center rounded-md bg-accent px-3 text-[13.5px] font-medium text-white">Add store</Link>} />
      </>
    );
  }
  const supabase = await createSupabaseServerClient();
  const ids = ctx.locations.map((l) => l.id);
  const [{ data: reports }, { data: expenses }, labor] = await Promise.all([
    supabase.from("daily_reports").select("*").in("location_id", ids).eq("business_date", date),
    supabase.from("expenses").select("location_id, amount, status, expense_categories(bucket)").in("location_id", ids).eq("business_date", date),
    Promise.all(ids.map((id) => supabase.rpc("labor_detail", { p_loc: id, p_date: date }).then((r) => [id, r.data ?? []] as const))),
  ]);
  const laborById = new Map(labor);
  const expByLoc = new Map<string, DetailedExpenseTotals>();
  for (const id of ids) {
    expByLoc.set(id, groupDetailedExpenses((expenses ?? []).filter((e) => e.location_id === id).map((e) => ({
      amount: Number(e.amount), bucket: ((e.expense_categories as { bucket: string } | null)?.bucket ?? "other") as AccountingBucket, status: e.status,
    }))));
  }
  const rows: RapidRowData[] = ctx.locations.map((l, i) => {
    const r = (reports ?? []).find((x) => x.location_id === l.id) ?? null;
    return {
      location: { id: l.id, name: l.name, timezone: l.timezone },
      today: todays[i],
      reportId: r?.id ?? null,
      status: r?.status ?? null,
      inputs: reportToInputs(r),
      labor: summarizeLabor((laborById.get(l.id) ?? []).map((s) => ({ employee_id: s.employee_id, worked_minutes: s.worked_minutes, labor_cost: s.labor_cost, status: s.status }))),
      detailed: expByLoc.get(l.id)!,
    };
  });

  return (
    <>
      <PageHeader title="Rapid Entry" description={`${formatWeekdayDate(date)} · every store on one screen, keyboard only.`} back={{ href: "/accounting", label: "Accounting" }}
        actions={<StoreDateBar locations={[]} showStore={false} date={date} max={today} />} />
      <RapidEntryGrid key={date} rows={rows} date={date} currency={ctx.settings.currency} otherSalesEnabled={ctx.settings.other_sales_enabled} />
    </>
  );
}
