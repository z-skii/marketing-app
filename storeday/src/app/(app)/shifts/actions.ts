"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { fromDateTimeLocal } from "@/lib/utils/datetime-local";

export type ShiftResult = { id: string };

const uuid = z.string().uuid("Invalid id");

function revalidateShift(id: string, employeeId?: string | null) {
  revalidatePath(`/shifts/${id}`);
  revalidatePath("/working");
  revalidatePath("/my/hours");
  revalidatePath("/clock");
  revalidatePath("/employees");
  if (employeeId) revalidatePath(`/employees/${employeeId}`);
}

/** Manager correction of clock-in/out and break, in the store's timezone. Reason required; audited by adjust_shift. */
export async function adjustShiftAction(_prev: ActionResult<ShiftResult> | null, formData: FormData): Promise<ActionResult<ShiftResult>> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) return fail("Only managers can correct hours");
  if (!ctx.can("can_edit_hours")) return fail("You do not have permission to correct hours");
  const parsed = z.object({
    shift_id: uuid,
    clock_in: z.string().min(1, "Clock-in time is required"),
    clock_out: z.string().optional().or(z.literal("")),
    break_minutes: z.coerce.number().int().min(0).max(24 * 60).optional().nullable(),
    reason: z.string().trim().min(3, "Please give a reason (at least a few words)"),
  }).safeParse({
    shift_id: formData.get("shift_id"), clock_in: formData.get("clock_in") ?? "", clock_out: formData.get("clock_out") ?? "",
    break_minutes: formData.get("break_minutes") === "" || formData.get("break_minutes") == null ? null : formData.get("break_minutes"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data: shift } = await supabase.from("shifts").select("id, employee_id, locations(timezone)").eq("id", d.shift_id).maybeSingle();
  if (!shift) return fail("Shift not found");
  const tz = (shift.locations as { timezone: string } | null)?.timezone ?? ctx.org.timezone;
  const clockIn = fromDateTimeLocal(d.clock_in, tz);
  if (!clockIn) return fail("Clock-in time is invalid");
  const clockOut = d.clock_out ? fromDateTimeLocal(d.clock_out, tz) : null;
  if (d.clock_out && !clockOut) return fail("Clock-out time is invalid");
  if (clockOut && clockOut < clockIn) return fail("Clock-out must be after clock-in");
  if (clockOut && new Date(clockOut).getTime() - new Date(clockIn).getTime() > 24 * 3600 * 1000) return fail("A shift cannot be longer than 24 hours");
  const { data, error } = await supabase.rpc("adjust_shift", {
    p_shift_id: d.shift_id, p_clock_in: clockIn, p_clock_out: clockOut as string, p_reason: d.reason,
    p_break_minutes: d.break_minutes ?? undefined,
  });
  if (error) return fail(error.message);
  revalidateShift(d.shift_id, shift.employee_id);
  return ok({ id: data.id });
}

/** Manager closes a running shift right now (no photo → flagged missing_photo, never estimated). */
export async function managerClockOutAction(shiftId: string): Promise<ActionResult<ShiftResult>> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) return fail("Only managers can clock someone out");
  const id = uuid.safeParse(shiftId);
  if (!id.success) return fail("Invalid shift");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("clock_out", { p_shift_id: id.data, p_device: { by: "manager", source: "shift_detail" } });
  if (error) return fail(error.message);
  revalidateShift(id.data, data.employee_id);
  return ok({ id: data.id });
}

/** Manual shift entry (e.g. forgot to clock in). Times in the store's timezone; reason required; verification = manual. */
export async function createManualShiftAction(_prev: ActionResult<ShiftResult> | null, formData: FormData): Promise<ActionResult<ShiftResult>> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) return fail("Only managers can add shifts");
  const parsed = z.object({
    employee_id: uuid,
    location_id: uuid,
    clock_in: z.string().min(1, "Clock-in time is required"),
    clock_out: z.string().min(1, "Clock-out time is required"),
    break_minutes: z.coerce.number().int().min(0).max(24 * 60).default(0),
    reason: z.string().trim().min(3, "Please give a reason (at least a few words)"),
  }).safeParse({
    employee_id: formData.get("employee_id"), location_id: formData.get("location_id"),
    clock_in: formData.get("clock_in") ?? "", clock_out: formData.get("clock_out") ?? "",
    break_minutes: formData.get("break_minutes") || 0, reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  const location = ctx.locations.find((l) => l.id === d.location_id);
  if (!location) return fail("Store not found");
  const clockIn = fromDateTimeLocal(d.clock_in, location.timezone);
  const clockOut = fromDateTimeLocal(d.clock_out, location.timezone);
  if (!clockIn || !clockOut) return fail("Times are invalid");
  if (clockOut <= clockIn) return fail("Clock-out must be after clock-in");
  if (new Date(clockOut).getTime() - new Date(clockIn).getTime() > 24 * 3600 * 1000) return fail("A shift cannot be longer than 24 hours");
  if (new Date(clockIn).getTime() > Date.now() + 5 * 60 * 1000) return fail("Clock-in cannot be in the future");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_manual_shift", {
    p_location_id: d.location_id, p_employee_id: d.employee_id, p_clock_in: clockIn, p_clock_out: clockOut,
    p_reason: d.reason, p_break_minutes: d.break_minutes,
  });
  if (error) return fail(error.message);
  revalidateShift(data.id, d.employee_id);
  return ok({ id: data.id });
}

/** Signed URL for a shift photo. Access is whatever RLS lets this user select (managers, or the uploader). */
export async function signedPhotoUrlAction(photoId: string): Promise<ActionResult<{ url: string }>> {
  await requireOrgContext();
  const id = uuid.safeParse(photoId);
  if (!id.success) return fail("Invalid photo");
  const supabase = await createSupabaseServerClient();
  const { data: photo } = await supabase.from("shift_photos").select("storage_bucket, storage_path").eq("id", id.data).maybeSingle();
  if (!photo) return fail("Photo not found");
  const { data, error } = await supabase.storage.from(photo.storage_bucket).createSignedUrl(photo.storage_path, 600);
  if (error || !data) return fail(error?.message ?? "Could not sign photo");
  return ok({ url: data.signedUrl });
}
