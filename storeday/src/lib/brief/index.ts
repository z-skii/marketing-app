import "server-only";
import { format } from "date-fns";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { OrgContext } from "@/lib/auth";
import { dailyRows } from "@/lib/data/accounting";
import { addISODays, nowIn, todayIn } from "@/lib/utils/time";
import { RuleBasedBriefGenerator } from "./rules";
import type { BriefGenerator, BriefInput, BriefShift, BriefStoreInput, DailyBrief } from "./types";

export * from "./types";
export { RuleBasedBriefGenerator, BRIEF_RULES } from "./rules";

const FLAGGED = new Set(["location_issue", "missing_photo", "needs_review"]);

type ShiftJoin = {
  id: string; employee_id: string; clock_in_at: string; business_date: string; location_id: string;
  status: BriefShift["status"]; verification_status: BriefShift["verification_status"];
  employees: { first_name: string; last_name: string | null } | null;
};

function toBriefShift(s: ShiftJoin): BriefShift {
  return {
    id: s.id, employee_id: s.employee_id, clock_in_at: s.clock_in_at, business_date: s.business_date,
    status: s.status, verification_status: s.verification_status,
    employee_name: `${s.employees?.first_name ?? ""} ${s.employees?.last_name ?? ""}`.trim() || "Employee",
  };
}

/** Collects everything a generator needs for the org/date. Respects ctx.locations (managers see only their stores). */
export async function gatherBriefInput(supabase: ServerSupabase, ctx: OrgContext, date: string): Promise<BriefInput> {
  const locIds = ctx.locations.map((l) => l.id);
  const empty: BriefInput = { orgId: ctx.org.id, date, today: ctx.today, timezone: ctx.org.timezone, currency: ctx.org.currency ?? "USD", stores: [], employeesWorked: 0 };
  if (locIds.length === 0) return empty;

  const shiftSelect = "id, employee_id, clock_in_at, business_date, location_id, status, verification_status, employees(first_name, last_name)";
  const [settings, rows, status, activeShifts, dayShifts, closeouts] = await Promise.all([
    supabase.from("location_settings").select("location_id, require_accounting_closeout, require_closing_checklist, require_opening_checklist, opens_at, closes_at").in("location_id", locIds),
    dailyRows(supabase, ctx.org.id, locIds, addISODays(date, -7), date),
    supabase.rpc("store_status", { p_org: ctx.org.id, p_date: date }),
    supabase.from("shifts").select(shiftSelect).in("location_id", locIds).eq("status", "active").order("clock_in_at"),
    supabase.from("shifts").select(shiftSelect).in("location_id", locIds).eq("business_date", date).neq("status", "cancelled"),
    supabase.from("closeout_reports").select("location_id, attention").eq("organization_id", ctx.org.id).eq("business_date", date),
  ]);

  const settingsBy = new Map((settings.data ?? []).map((s) => [s.location_id, s]));
  const statusBy = new Map((status.data ?? []).map((s) => [s.location_id, s]));
  const closeoutBy = new Map((closeouts.data ?? []).map((c) => [c.location_id, Array.isArray(c.attention) ? (c.attention as unknown[]) : []]));
  const rowFor = (loc: string, d: string) => (rows ?? []).find((r) => r.location_id === loc && r.business_date === d) ?? null;
  const active = ((activeShifts.data ?? []) as unknown as ShiftJoin[]);
  const onDate = ((dayShifts.data ?? []) as unknown as ShiftJoin[]);

  const stores: BriefStoreInput[] = ctx.locations.map((l) => {
    const s = settingsBy.get(l.id);
    const lastWeek = rowFor(l.id, addISODays(date, -7));
    return {
      location: { id: l.id, name: l.name, timezone: l.timezone },
      settings: s ? { require_accounting_closeout: s.require_accounting_closeout, require_closing_checklist: s.require_closing_checklist, require_opening_checklist: s.require_opening_checklist, opens_at: s.opens_at, closes_at: s.closes_at } : null,
      accounting: rowFor(l.id, date),
      previousDay: rowFor(l.id, addISODays(date, -1)),
      lastWeekSales: lastWeek?.daily_report_id ? lastWeek.total_sales ?? null : null,
      status: statusBy.get(l.id) ?? null,
      activeShifts: active.filter((x) => x.location_id === l.id).map(toBriefShift),
      flaggedShifts: onDate.filter((x) => x.location_id === l.id && FLAGGED.has(x.verification_status)).map(toBriefShift),
      closeoutAttention: closeoutBy.get(l.id) ?? [],
      localToday: todayIn(l.timezone),
      localTime: format(nowIn(l.timezone), "HH:mm"),
    };
  });

  return { ...empty, stores, employeesWorked: new Set(onDate.map((s) => s.employee_id)).size };
}

/**
 * The generator used by the app. Swap this for an AI-backed implementation of `BriefGenerator`
 * (fed the same BriefInput) when one exists — nothing else needs to change.
 */
const defaultGenerator: BriefGenerator = new RuleBasedBriefGenerator();

/** Server helper reused by the dashboard: gathers the input and generates the brief for one date. */
export async function buildDailyBrief(supabase: ServerSupabase, ctx: OrgContext, date: string, generator: BriefGenerator = defaultGenerator): Promise<DailyBrief> {
  const input = await gatherBriefInput(supabase, ctx, date);
  return generator.generate(input);
}
