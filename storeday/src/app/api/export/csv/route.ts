import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, getOrgContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildReport, canSeeReports, resolveReportParams } from "@/lib/reports/queries";
import { csvFilename, tableToCsv } from "@/lib/reports/csv";
import { isExportName } from "@/lib/reports/table";

export const dynamic = "force-dynamic";

/**
 * GET /api/export/csv?report=daily|weekly|monthly|expenses|hours|labor|comparison|month|payroll
 *   &range=&from=&to=&location=&employee=&category=&by=store&group=week&month=YYYY-MM
 * Same params as the report pages. Runs under the user's session (RLS) — never the service role.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const ctx = await getOrgContext();
  if (!ctx) return NextResponse.json({ error: "No business selected" }, { status: 403 });
  if (!ctx.isManager) return NextResponse.json({ error: "Managers and owners only" }, { status: 403 });

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const report = sp.report;
  if (!isExportName(report)) return NextResponse.json({ error: `Unknown report. Use one of: daily, weekly, monthly, expenses, hours, labor, comparison, month, payroll` }, { status: 400 });
  if (report === "payroll" ? !ctx.isOwner : !canSeeReports(ctx)) {
    return NextResponse.json({ error: report === "payroll" ? "Only the owner can export payroll" : "You do not have permission to view reports" }, { status: 403 });
  }
  if (report === "month" && sp.month && !/^\d{4}-\d{2}$/.test(sp.month)) return NextResponse.json({ error: "month must be YYYY-MM" }, { status: 400 });

  const params = resolveReportParams(ctx, sp);
  const supabase = await createSupabaseServerClient();
  try {
    const table = await buildReport(supabase, params, report);
    const csv = tableToCsv(table);
    const filename = csvFilename(report, params.range.from, params.range.to);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Export failed" }, { status: 500 });
  }
}
