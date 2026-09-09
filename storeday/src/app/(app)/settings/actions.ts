"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { feetToMeters } from "@/lib/calc/geo";
import type { Json } from "@/types/database";
import { PERMISSION_LABELS, type PermissionKey } from "@/lib/permissions";

const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as PermissionKey[];

async function requireOwner() {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return { error: "Only the owner can change these settings" as const };
  const supabase = await createSupabaseServerClient();
  return { ctx, supabase };
}

type Supa = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function log(supabase: Supa, orgId: string, action: string, entityType: string, entityId: string | null, before: Json | null, after: Json | null, note?: string) {
  return supabase.rpc("log_activity_public", { p_org: orgId, p_loc: null, p_action: action, p_entity_type: entityType, p_entity_id: entityId, p_before: before, p_after: after, p_note: note ?? null }).then(() => {}, () => {});
}

function revalidateSettings() {
  revalidatePath("/settings", "layout");
  revalidatePath("/", "layout");
}

// ------------------------------------------------------------------ business

const businessSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(120),
  business_type: z.string().trim().max(80).optional().or(z.literal("")),
  timezone: z.string().trim().min(1, "Timezone is required"),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code like USD"),
});

export async function saveBusinessAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const parsed = businessSchema.safeParse({ name: formData.get("name"), business_type: formData.get("business_type") ?? "", timezone: formData.get("timezone"), currency: formData.get("currency") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  try { new Intl.DateTimeFormat("en-US", { timeZone: d.timezone }); } catch { return fail("Unknown timezone"); }
  const { error } = await supabase.from("organizations").update({ name: d.name, business_type: d.business_type || null, timezone: d.timezone, currency: d.currency }).eq("id", ctx.org.id);
  if (error) return fail(error.message);
  const { error: e2 } = await supabase.from("organization_settings").update({ currency: d.currency }).eq("organization_id", ctx.org.id);
  if (e2) return fail(e2.message);
  await log(supabase, ctx.org.id, "settings.business_updated", "organization", ctx.org.id,
    { name: ctx.org.name, business_type: ctx.org.business_type, timezone: ctx.org.timezone, currency: ctx.org.currency },
    { name: d.name, business_type: d.business_type || null, timezone: d.timezone, currency: d.currency });
  revalidateSettings();
  return ok(undefined);
}

// ------------------------------------------------------------------ accounting

const accountingSchema = z.object({
  week_starts_on: z.coerce.number().int().min(0).max(6),
  cash_check_enabled: z.boolean(),
  other_sales_enabled: z.boolean(),
  employee_can_view_accounting: z.boolean(),
  overtime_enabled: z.boolean(),
  overtime_weekly_hours: z.coerce.number().min(1, "Weekly overtime threshold must be at least 1 hour").max(168),
  overtime_daily_hours: z.coerce.number().min(1).max(24).nullable(),
  overtime_multiplier: z.coerce.number().min(1, "Multiplier must be at least 1").max(5, "Multiplier looks too high"),
});

export async function saveAccountingAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const daily = String(formData.get("overtime_daily_hours") ?? "").trim();
  const parsed = accountingSchema.safeParse({
    week_starts_on: formData.get("week_starts_on"),
    cash_check_enabled: formData.get("cash_check_enabled") === "on",
    other_sales_enabled: formData.get("other_sales_enabled") === "on",
    employee_can_view_accounting: formData.get("employee_can_view_accounting") === "on",
    overtime_enabled: formData.get("overtime_enabled") === "on",
    overtime_weekly_hours: formData.get("overtime_weekly_hours") || 40,
    overtime_daily_hours: daily === "" ? null : daily,
    overtime_multiplier: formData.get("overtime_multiplier") || 1.5,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  const before = {
    week_starts_on: ctx.settings.week_starts_on, cash_check_enabled: ctx.settings.cash_check_enabled, other_sales_enabled: ctx.settings.other_sales_enabled,
    employee_can_view_accounting: ctx.settings.employee_can_view_accounting, overtime_enabled: ctx.settings.overtime_enabled,
    overtime_weekly_hours: ctx.settings.overtime_weekly_hours, overtime_daily_hours: ctx.settings.overtime_daily_hours, overtime_multiplier: ctx.settings.overtime_multiplier,
  };
  const { error } = await supabase.from("organization_settings").update(d).eq("organization_id", ctx.org.id);
  if (error) return fail(error.message);
  await log(supabase, ctx.org.id, "settings.accounting_updated", "organization_settings", ctx.org.id, before, d);
  revalidateSettings();
  revalidatePath("/accounting", "layout");
  revalidatePath("/reports", "layout");
  return ok(undefined);
}

// ------------------------------------------------------------------ clock-in

export async function saveClockInAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const ft = Number(formData.get("radius_ft"));
  if (!Number.isFinite(ft) || ft < 50 || ft > 5280) return fail("Radius must be between 50 ft and 1 mile (5,280 ft)");
  const patch = {
    default_geofence_radius_m: Math.max(15, Math.round(feetToMeters(ft))),
    allow_clock_in_without_photo: formData.get("require_photo") !== "on",
    allow_clock_in_outside_radius: formData.get("block_outside") !== "on",
  };
  const { error } = await supabase.from("organization_settings").update(patch).eq("organization_id", ctx.org.id);
  if (error) return fail(error.message);
  await log(supabase, ctx.org.id, "settings.clock_in_updated", "organization_settings", ctx.org.id,
    { default_geofence_radius_m: ctx.settings.default_geofence_radius_m, allow_clock_in_without_photo: ctx.settings.allow_clock_in_without_photo, allow_clock_in_outside_radius: ctx.settings.allow_clock_in_outside_radius }, patch);
  revalidateSettings();
  return ok(undefined);
}

// ------------------------------------------------------------------ members

export async function saveMemberPermissionsAction(memberId: string, permissions: Partial<Record<PermissionKey, boolean>>): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const { data: m } = await supabase.from("organization_members").select("id, role, permissions, user_id").eq("organization_id", ctx.org.id).eq("id", memberId).maybeSingle();
  if (!m) return fail("Member not found");
  if (m.role !== "manager") return fail(m.role === "owner" ? "Owners always have every permission" : "Permissions only apply to managers");
  const current = (m.permissions && typeof m.permissions === "object" ? m.permissions : {}) as Record<string, boolean>;
  const clean: Record<string, boolean> = { ...current };
  for (const k of PERMISSION_KEYS) if (typeof permissions[k] === "boolean") clean[k] = permissions[k] as boolean;
  const { error } = await supabase.from("organization_members").update({ permissions: clean }).eq("id", m.id);
  if (error) return fail(error.message);
  await log(supabase, ctx.org.id, "member.permissions_changed", "organization_member", m.id, current, clean);
  revalidatePath("/settings/members");
  revalidatePath("/employees");
  revalidatePath("/", "layout");
  return ok(undefined);
}

export async function setMemberRoleAction(memberId: string, role: "manager" | "employee"): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const { data: m } = await supabase.from("organization_members").select("id, role, user_id").eq("organization_id", ctx.org.id).eq("id", memberId).maybeSingle();
  if (!m) return fail("Member not found");
  if (m.role === "owner") return fail("The owner's role cannot be changed here");
  if (m.role === role) return ok(undefined);
  const { error } = await supabase.from("organization_members").update({ role }).eq("id", m.id);
  if (error) return fail(error.message);
  await supabase.from("employees").update({ role }).eq("organization_id", ctx.org.id).eq("user_id", m.user_id);
  await log(supabase, ctx.org.id, "member.role_changed", "organization_member", m.id, { role: m.role }, { role });
  revalidatePath("/settings/members");
  revalidatePath("/employees");
  revalidatePath("/", "layout");
  return ok(undefined);
}

/** Removes a person's access to this business. Their employee record, shifts and history stay. */
export async function removeMemberAction(memberId: string): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const { data: m } = await supabase.from("organization_members").select("id, role, user_id").eq("organization_id", ctx.org.id).eq("id", memberId).maybeSingle();
  if (!m) return fail("Member not found");
  if (m.user_id === ctx.user.id) return fail("You cannot remove yourself");
  if (m.role === "owner") return fail("The owner cannot be removed");
  const { error } = await supabase.from("organization_members").delete().eq("id", m.id);
  if (error) return fail(error.message);
  await supabase.from("location_members").delete().eq("organization_id", ctx.org.id).eq("user_id", m.user_id);
  await supabase.from("employees").update({ employment_status: "inactive", end_date: ctx.today }).eq("organization_id", ctx.org.id).eq("user_id", m.user_id).eq("employment_status", "active");
  await log(supabase, ctx.org.id, "member.removed", "organization_member", m.id, { role: m.role, user_id: m.user_id }, null);
  revalidatePath("/settings/members");
  revalidatePath("/employees");
  revalidatePath("/", "layout");
  return ok(undefined);
}

// ------------------------------------------------------------------ data

/**
 * seed_demo_data() creates a separate "Storeday Demo" business for the caller (3 stores, 10 employees,
 * 30 days of accounting) and makes it the active organization. Returns the new org id.
 */
export async function loadDemoDataAction(): Promise<ActionResult<{ organization_id: string }>> {
  const ctx = await requireOrgContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("seed_demo_data");
  if (error) {
    if (error.code === "PGRST202" || /could not find the function/i.test(error.message)) {
      return fail("Demo data is not available on this database yet (the seed_demo_data function has not been installed).");
    }
    return fail(error.message);
  }
  if (!data) return fail("Demo data did not return a business id");
  await supabase.rpc("log_activity_public", { p_org: ctx.org.id, p_loc: null, p_action: "data.demo_created", p_entity_type: "organization", p_entity_id: data, p_after: { demo_organization_id: data } }).then(() => {}, () => {});
  revalidatePath("/", "layout");
  return ok({ organization_id: data });
}

/** Deletes the current business when it is a demo (owner only; cascades everything). */
export async function deleteDemoOrganizationAction(): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  if (!ctx.org.is_demo) return fail("Only demo businesses can be deleted from here");
  const { error } = await supabase.rpc("delete_demo_organization", { p_org: ctx.org.id });
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return ok(undefined);
}
