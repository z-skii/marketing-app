"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgContext, type OrgContext } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { addISODays } from "@/lib/utils/time";
import { plusDaysKeepingWallClock, shiftBounds, zonedInstant } from "@/components/schedule/schedule-time";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");
const hhmm = z.string().regex(/^\d{2}:\d{2}$/, "Invalid time");

const shiftSchema = z.object({
  employee_id: z.string().uuid("Pick an employee"),
  location_id: z.string().uuid("Pick a store"),
  date: isoDate,
  start_time: hhmm,
  end_time: hhmm,
  note: z.string().trim().max(300).optional().nullable(),
});
export type ShiftInput = z.infer<typeof shiftSchema>;

const createSchema = shiftSchema.extend({ repeat_weeks: z.coerce.number().int().min(1).max(52).default(1) });
export type CreateShiftInput = z.infer<typeof createSchema>;

async function requireScheduler(): Promise<{ ctx: OrgContext } | { error: string }> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) return { error: "Managers only" };
  if (!(ctx.isOwner || ctx.can("can_manage_schedule"))) return { error: "You do not have permission to manage schedules" };
  return { ctx };
}

function revalidate() {
  revalidatePath("/schedule");
  revalidatePath("/my/schedule");
  revalidatePath("/dashboard");
}

/** Creates one shift, or N weekly repeats sharing a series_id. */
export async function createScheduleAction(input: CreateShiftInput): Promise<ActionResult<{ count: number; series_id: string | null }>> {
  const auth = await requireScheduler();
  if ("error" in auth) return fail(auth.error);
  const { ctx } = auth;
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  const location = ctx.locations.find((l) => l.id === d.location_id);
  if (!location) return fail("Unknown store");
  const supabase = await createSupabaseServerClient();
  const { data: emp } = await supabase.from("employees").select("id, organization_id").eq("id", d.employee_id).maybeSingle();
  if (!emp || emp.organization_id !== ctx.org.id) return fail("Unknown employee");

  const base = shiftBounds(d.date, d.start_time, d.end_time, location.timezone);
  const series_id = d.repeat_weeks > 1 ? crypto.randomUUID() : null;
  const rows = Array.from({ length: d.repeat_weeks }, (_, i) => ({
    organization_id: ctx.org.id, location_id: d.location_id, employee_id: d.employee_id,
    starts_at: plusDaysKeepingWallClock(base.starts_at, 7 * i, location.timezone),
    ends_at: plusDaysKeepingWallClock(base.ends_at, 7 * i, location.timezone),
    note: d.note || null, series_id, created_by: ctx.user.id,
  }));
  const { error } = await supabase.from("schedules").insert(rows);
  if (error) return fail(error.message);
  revalidate();
  return ok({ count: rows.length, series_id });
}

export async function updateScheduleAction(id: string, input: ShiftInput): Promise<ActionResult> {
  const auth = await requireScheduler();
  if ("error" in auth) return fail(auth.error);
  const { ctx } = auth;
  if (!z.string().uuid().safeParse(id).success) return fail("Invalid request");
  const parsed = shiftSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  const location = ctx.locations.find((l) => l.id === d.location_id);
  if (!location) return fail("Unknown store");
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("schedules").select("id, organization_id").eq("id", id).maybeSingle();
  if (!existing || existing.organization_id !== ctx.org.id) return fail("Shift not found");
  const { data: emp } = await supabase.from("employees").select("id, organization_id").eq("id", d.employee_id).maybeSingle();
  if (!emp || emp.organization_id !== ctx.org.id) return fail("Unknown employee");
  const bounds = shiftBounds(d.date, d.start_time, d.end_time, location.timezone);
  const { error } = await supabase.from("schedules").update({ employee_id: d.employee_id, location_id: d.location_id, ...bounds, note: d.note || null }).eq("id", id);
  if (error) return fail(error.message);
  revalidate();
  return ok(undefined);
}

/** Deletes one shift, or every shift of its series (scope "series"). */
export async function deleteScheduleAction(id: string, scope: "single" | "series" = "single"): Promise<ActionResult<{ deleted: number }>> {
  const auth = await requireScheduler();
  if ("error" in auth) return fail(auth.error);
  const { ctx } = auth;
  if (!z.string().uuid().safeParse(id).success) return fail("Invalid request");
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("schedules").select("id, organization_id, series_id").eq("id", id).maybeSingle();
  if (!existing || existing.organization_id !== ctx.org.id) return fail("Shift not found");
  if (scope === "series" && existing.series_id) {
    const { data, error } = await supabase.from("schedules").delete().eq("organization_id", ctx.org.id).eq("series_id", existing.series_id).select("id");
    if (error) return fail(error.message);
    revalidate();
    return ok({ deleted: data?.length ?? 0 });
  }
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidate();
  return ok({ deleted: 1 });
}

/**
 * Copies every shift of a store from one week to another (same weekday + wall-clock time).
 * Shifts that already exist in the target week (same employee + start) are skipped.
 */
export async function copyWeekAction(locationId: string, fromWeekStart: string, toWeekStart: string): Promise<ActionResult<{ created: number; skipped: number }>> {
  const auth = await requireScheduler();
  if ("error" in auth) return fail(auth.error);
  const { ctx } = auth;
  if (!z.string().uuid().safeParse(locationId).success || !isoDate.safeParse(fromWeekStart).success || !isoDate.safeParse(toWeekStart).success) return fail("Invalid request");
  const location = ctx.locations.find((l) => l.id === locationId);
  if (!location) return fail("Unknown store");
  const dayDiff = Math.round((new Date(toWeekStart + "T00:00:00Z").getTime() - new Date(fromWeekStart + "T00:00:00Z").getTime()) / 86400000);
  if (dayDiff === 0) return fail("Source and target week are the same");
  const tz = location.timezone;
  const supabase = await createSupabaseServerClient();
  const range = (start: string) => ({ from: zonedInstant(start, "00:00", tz).toISOString(), to: zonedInstant(addISODays(start, 7), "00:00", tz).toISOString() });
  const src = range(fromWeekStart), dst = range(toWeekStart);
  const [{ data: source, error: e1 }, { data: target, error: e2 }] = await Promise.all([
    supabase.from("schedules").select("employee_id, starts_at, ends_at, note").eq("location_id", locationId).gte("starts_at", src.from).lt("starts_at", src.to),
    supabase.from("schedules").select("employee_id, starts_at").eq("location_id", locationId).gte("starts_at", dst.from).lt("starts_at", dst.to),
  ]);
  if (e1 || e2) return fail(e1?.message ?? e2?.message);
  if (!source || source.length === 0) return fail("There are no shifts to copy in that week");
  const existing = new Set((target ?? []).map((t) => `${t.employee_id}|${new Date(t.starts_at).toISOString()}`));
  const rows = [];
  let skipped = 0;
  for (const s of source) {
    const starts_at = plusDaysKeepingWallClock(s.starts_at, dayDiff, tz);
    const key = `${s.employee_id}|${starts_at}`;
    if (existing.has(key)) { skipped++; continue; }
    existing.add(key);
    rows.push({ organization_id: ctx.org.id, location_id: locationId, employee_id: s.employee_id, starts_at, ends_at: plusDaysKeepingWallClock(s.ends_at, dayDiff, tz), note: s.note, series_id: null, created_by: ctx.user.id });
  }
  if (rows.length) {
    const { error } = await supabase.from("schedules").insert(rows);
    if (error) return fail(error.message);
  }
  revalidate();
  return ok({ created: rows.length, skipped });
}
