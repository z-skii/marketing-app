import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { todayIn } from "@/lib/utils/time";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Hourly cron (vercel.json). For every organization:
 *   - run_org_checks(p_org)                   → late employees, stores not opened/closed, missing closeouts, forgotten clock-outs
 *   - materialize_recurring_expenses(p_org, today-in-org-timezone)
 * Auth: `Authorization: Bearer ${CRON_SECRET}` — exactly. Vercel cron sends this header automatically
 * when CRON_SECRET is set in the project's environment. Needs the service role key (bypasses RLS).
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured; scheduled checks cannot run" }, { status: 503 });

  const startedAt = new Date();
  const { data: orgs, error } = await admin.from("organizations").select("id, name, timezone");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results: Array<{ organization_id: string; name: string; notifications: number; expenses: number; errors: string[] }> = [];
  for (const org of orgs ?? []) {
    const r = { organization_id: org.id, name: org.name, notifications: 0, expenses: 0, errors: [] as string[] };
    const checks = await admin.rpc("run_org_checks", { p_org: org.id });
    if (checks.error) r.errors.push(`run_org_checks: ${checks.error.message}`); else r.notifications = Number(checks.data ?? 0);
    const recurring = await admin.rpc("materialize_recurring_expenses", { p_org: org.id, p_until: todayIn(org.timezone, startedAt) });
    if (recurring.error) r.errors.push(`materialize_recurring_expenses: ${recurring.error.message}`); else r.expenses = Number(recurring.data ?? 0);
    results.push(r);
  }
  const failed = results.filter((r) => r.errors.length).length;
  return NextResponse.json({
    ok: failed === 0,
    ran_at: startedAt.toISOString(),
    duration_ms: Date.now() - startedAt.getTime(),
    organizations: results.length,
    notifications_created: results.reduce((s, r) => s + r.notifications, 0),
    expenses_materialized: results.reduce((s, r) => s + r.expenses, 0),
    failed,
    results,
  }, { status: failed ? 207 : 200 });
}
