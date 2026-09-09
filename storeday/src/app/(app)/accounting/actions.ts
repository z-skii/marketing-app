"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireManagerContext } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import type { Database, Json } from "@/types/database";
import { MONEY_FIELDS, type CloseoutRow, type DailyReportRow, type DraftPatch } from "@/components/accounting/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function revalidate() {
  revalidatePath("/accounting", "layout");
  revalidatePath("/dashboard");
}

/** Keep only allowed keys, coerce money to finite numbers (or null) and notes to a string. */
function cleanPatch(patch: DraftPatch): Record<string, Json> {
  const out: Record<string, Json> = {};
  for (const k of MONEY_FIELDS) {
    if (!(k in patch)) continue;
    const v = patch[k];
    if (v == null) { out[k] = null; continue; }
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error(`Invalid amount for ${k}`);
    out[k] = Math.round(n * 100) / 100;
  }
  if ("notes" in patch) out.notes = patch.notes == null ? null : String(patch.notes).slice(0, 4000);
  return out;
}

function plainReport(r: Database["public"]["Functions"]["save_daily_report_draft"]["Returns"]): DailyReportRow {
  return r as DailyReportRow;
}

/** Autosave for open days: upserts the daily_reports row and applies only the changed fields. */
export async function saveDraftAction(locationId: string, date: string, patch: DraftPatch): Promise<ActionResult<DailyReportRow>> {
  try {
    const ctx = await requireManagerContext();
    if (!ctx.locations.some((l) => l.id === locationId)) return fail("You cannot edit that store");
    if (!DATE_RE.test(date)) return fail("Invalid date");
    const clean = cleanPatch(patch);
    if (Object.keys(clean).length === 0) return fail("Nothing to save");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("save_daily_report_draft", { p_location_id: locationId, p_date: date, p_patch: clean });
    if (error) return fail(error.message);
    revalidate();
    return ok(plainReport(data));
  } catch (e) { return fail(e); }
}

/** Closes a day and returns the closeout snapshot (attention + comparisons included). */
export async function closeDayAction(locationId: string, date: string): Promise<ActionResult<CloseoutRow>> {
  try {
    const ctx = await requireManagerContext();
    if (!ctx.locations.some((l) => l.id === locationId)) return fail("You cannot close that store");
    if (!DATE_RE.test(date)) return fail("Invalid date");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("close_day", { p_location_id: locationId, p_date: date });
    if (error) return fail(error.message);
    revalidate();
    return ok(data as CloseoutRow);
  } catch (e) { return fail(e); }
}

export async function reopenDayAction(reportId: string, reason: string): Promise<ActionResult<DailyReportRow>> {
  try {
    const ctx = await requireManagerContext();
    if (!(ctx.isOwner || ctx.can("can_edit_closed_days"))) return fail("You do not have permission to reopen closed days");
    if (!reason.trim()) return fail("A reason is required");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("reopen_day", { p_report_id: reportId, p_reason: reason.trim() });
    if (error) return fail(error.message);
    revalidate();
    return ok(plainReport(data));
  } catch (e) { return fail(e); }
}

/** Edits a report through the audited RPC. For closed days a reason is mandatory. */
export async function editClosedReportAction(reportId: string, patch: DraftPatch, reason: string): Promise<ActionResult<DailyReportRow>> {
  try {
    const ctx = await requireManagerContext();
    if (!reason.trim()) return fail("A reason is required");
    if (!(ctx.isOwner || ctx.can("can_edit_closed_days"))) return fail("You do not have permission to edit closed days");
    const clean = cleanPatch(patch);
    if (Object.keys(clean).length === 0) return fail("Nothing changed");
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("edit_daily_report", { p_report_id: reportId, p_patch: clean, p_reason: reason.trim() });
    if (error) return fail(error.message);
    revalidate();
    return ok(plainReport(data));
  } catch (e) { return fail(e); }
}

export interface CloseManyItem { locationId: string; date: string }
export interface CloseManyResult { locationId: string; date: string; ok: boolean; error?: string; snapshot?: CloseoutRow }

/** Rapid Entry: closes several stores, continuing past failures and reporting each result. */
export async function closeManyAction(items: CloseManyItem[]): Promise<ActionResult<CloseManyResult[]>> {
  try {
    const ctx = await requireManagerContext();
    const supabase = await createSupabaseServerClient();
    const results: CloseManyResult[] = [];
    for (const it of items) {
      if (!ctx.locations.some((l) => l.id === it.locationId)) { results.push({ ...it, ok: false, error: "Not allowed" }); continue; }
      if (!DATE_RE.test(it.date)) { results.push({ ...it, ok: false, error: "Invalid date" }); continue; }
      const { data, error } = await supabase.rpc("close_day", { p_location_id: it.locationId, p_date: it.date });
      if (error) results.push({ ...it, ok: false, error: error.message.replace(/^.*?:\s*(?=[A-Z])/, "") });
      else results.push({ ...it, ok: true, snapshot: data as CloseoutRow });
    }
    revalidate();
    return ok(results);
  } catch (e) { return fail(e); }
}
