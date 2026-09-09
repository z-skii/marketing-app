import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader, Tabs } from "@/components/ui/misc";
import { Alert } from "@/components/ui/form";
import { exportHref, isReportName, REPORTS, reportHref, type ReportName } from "@/lib/reports/table";
import { canSeeReports, comparisonReport, dailyReport, expenseReport, hoursReport, laborReport, monthlyReport, reportFilterOptions, resolveReportParams, weeklyReport, type ReportParams } from "@/lib/reports/queries";
import { ReportFilters, type ToggleOption } from "@/components/reports/report-filters";
import { ReportSummary } from "@/components/reports/report-summary";
import { ReportTableView } from "@/components/reports/report-table";
import type { ServerSupabase } from "@/lib/supabase/server";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ params }: { params: Promise<{ report: string }> }): Promise<Metadata> {
  const { report } = await params;
  const r = REPORTS.find((x) => x.name === report);
  return { title: r ? `${r.label} report` : "Reports" };
}

export default async function ReportPage({ params, searchParams }: { params: Promise<{ report: string }>; searchParams: Promise<SP> }) {
  const [{ report }, sp] = await Promise.all([params, searchParams]);
  if (!isReportName(report)) notFound();
  const ctx = await requireManagerContext();
  if (!canSeeReports(ctx)) redirect("/dashboard");
  const supabase = await createSupabaseServerClient();
  const p = resolveReportParams(ctx, sp);
  // Keep the period explicit in the URL so the filter bar and the export link always agree with the data.
  if (!sp.range) redirect(reportHref(report, p.filters));
  const meta = REPORTS.find((r) => r.name === report)!;
  const options = await reportFilterOptions(supabase, ctx.org.id);

  const tabs = REPORTS.map((r) => ({ href: reportHref(r.name, p.filters), label: r.label, active: r.name === report }));
  const toggles = togglesFor(report, p);
  const body = await renderReport(supabase, report, p);

  return (
    <div>
      <PageHeader title="Reports" description={meta.description} />
      <Tabs items={tabs} />
      <ReportFilters
        locations={p.locations}
        employees={report === "hours" || report === "labor" ? options.employees : undefined}
        categories={report === "expenses" ? options.categories : undefined}
        toggles={toggles}
        exportHref={exportHref(report, p.filters)}
        showStore={report !== "comparison"}
      />
      {p.locations.length === 0 && <Alert tone="info" className="mb-4">No stores yet. <Link href="/stores" className="underline">Add a store</Link> to start recording days.</Alert>}
      {body}
      {ctx.isOwner && (report === "hours" || report === "labor") && (
        <p className="mt-3 text-[12px] text-text-3">
          Need pay? <a href={exportHref("payroll", p.filters)} className="underline hover:text-text">Export payroll estimate (CSV)</a> · uses the overtime rules in <Link href="/settings/accounting" className="underline hover:text-text">Settings</Link>.
        </p>
      )}
    </div>
  );
}

function togglesFor(report: ReportName, p: ReportParams): ToggleOption[] | undefined {
  if (report === "weekly" || report === "monthly") {
    return [
      { href: reportHref(report, { ...p.filters, by: null }), label: "Combined", active: !p.byStore },
      { href: reportHref(report, { ...p.filters, by: "store" }), label: "Per store", active: p.byStore },
    ];
  }
  if (report === "labor") {
    return [
      { href: reportHref(report, { ...p.filters, group: null }), label: "By day", active: !p.groupWeek },
      { href: reportHref(report, { ...p.filters, group: "week" }), label: "By week", active: p.groupWeek },
    ];
  }
  return undefined;
}

async function renderReport(supabase: ServerSupabase, report: ReportName, p: ReportParams) {
  switch (report) {
    case "daily": { const t = await dailyReport(supabase, p); return <><ReportSummary table={t} /><ReportTableView table={t} /></>; }
    case "weekly": { const t = await weeklyReport(supabase, p); return <><ReportSummary table={t} /><ReportTableView table={t} /></>; }
    case "monthly": { const t = await monthlyReport(supabase, p); return <><ReportSummary table={t} /><ReportTableView table={t} /></>; }
    case "labor": { const t = await laborReport(supabase, p); return <><ReportSummary table={t} /><ReportTableView table={t} /></>; }
    case "comparison": {
      const t = await comparisonReport(supabase, p);
      return <><ReportSummary table={t} /><ReportTableView table={t} emptyText="No stores to compare." /></>;
    }
    case "expenses": {
      const { byCategory, list } = await expenseReport(supabase, p);
      return (
        <>
          <ReportSummary table={list} />
          <div className="grid gap-4 lg:grid-cols-[minmax(280px,1fr)_2fr]">
            <section>
              <h2 className="text-[13px] font-semibold mb-2">{byCategory.title}</h2>
              <ReportTableView table={byCategory} emptyText="No expenses in this period." />
              {p.categoryId && <Link href={reportHref("expenses", { ...p.filters, category: null })} className="inline-block mt-2 text-[12px] text-accent hover:underline">Clear category filter</Link>}
            </section>
            <section>
              <h2 className="text-[13px] font-semibold mb-2">All expenses <span className="text-text-3 font-normal">({list.rows.length})</span></h2>
              <ReportTableView table={list} emptyText="No expenses in this period." />
            </section>
          </div>
        </>
      );
    }
    case "hours": {
      const { summary, detail } = await hoursReport(supabase, p);
      return (
        <>
          <ReportSummary table={summary} />
          {detail ? (
            <div className="space-y-4">
              <ReportTableView table={summary} emptyText="No completed shifts for this employee in this period." />
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[13px] font-semibold">{detail.title}</h2>
                  <Link href={reportHref("hours", { ...p.filters, employee: null })} className="text-[12px] text-accent hover:underline">All employees</Link>
                </div>
                <ReportTableView table={detail} emptyText="No completed shifts in this period." />
              </section>
            </div>
          ) : (
            <ReportTableView table={summary} emptyText="No completed shifts in this period. Pick an employee to see their shifts day by day." />
          )}
        </>
      );
    }
  }
}
