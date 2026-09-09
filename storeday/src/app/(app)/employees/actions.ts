"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { siteUrl } from "@/config/site";
import type { Database, Json } from "@/types/database";
import type { PermissionKey } from "@/lib/permissions";

const employeeSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().optional().default(""),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  role: z.enum(["manager", "employee"]).default("employee"),
  hourly_rate: z.coerce.number().min(0).optional().nullable(),
  start_date: z.string().optional().or(z.literal("")),
  location_ids: z.array(z.string().uuid()).default([]),
  send_invite: z.boolean().default(true),
});

export type CreateEmployeeResult = { id: string; invite_url: string | null; invite_emailed: boolean };

function parseEmployeeForm(formData: FormData) {
  const rate = formData.get("hourly_rate");
  return employeeSchema.safeParse({
    first_name: formData.get("first_name"), last_name: formData.get("last_name") ?? "", email: formData.get("email") ?? "", phone: formData.get("phone") ?? "",
    role: formData.get("role") ?? "employee", hourly_rate: rate === "" || rate == null ? null : rate, start_date: formData.get("start_date") ?? "",
    location_ids: formData.getAll("location_ids").map(String).filter(Boolean), send_invite: formData.get("send_invite") !== "off",
  });
}

export async function createEmployeeAction(_prev: ActionResult<CreateEmployeeResult> | null, formData: FormData): Promise<ActionResult<CreateEmployeeResult>> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can add employees");
  const parsed = parseEmployeeForm(formData);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data: emp, error } = await supabase.from("employees").insert({
    organization_id: ctx.org.id, first_name: d.first_name, last_name: d.last_name, email: d.email || null, phone: d.phone || null,
    role: d.role, start_date: d.start_date || null, default_location_id: d.location_ids[0] ?? null, created_by: ctx.user.id,
  }).select("id").single();
  if (error) return fail(error.message);
  if (d.hourly_rate != null) {
    await supabase.from("employee_pay_rates").insert({ organization_id: ctx.org.id, employee_id: emp.id, hourly_rate: d.hourly_rate, effective_from: d.start_date || "2000-01-01", created_by: ctx.user.id });
  }
  if (d.location_ids.length) {
    await supabase.from("employee_locations").insert(d.location_ids.map((location_id) => ({ organization_id: ctx.org.id, employee_id: emp.id, location_id })));
  }
  let invite_url: string | null = null, invite_emailed = false;
  if (d.email) {
    const inv = await createInvitation(ctx.org.id, emp.id, d.email, d.role, ctx.user.id, d.send_invite);
    invite_url = inv.url; invite_emailed = inv.emailed;
  }
  await supabase.rpc("log_activity_public", { p_org: ctx.org.id, p_loc: d.location_ids[0] ?? null, p_action: "employee.added", p_entity_type: "employee", p_entity_id: emp.id, p_after: { name: `${d.first_name} ${d.last_name}`.trim(), role: d.role } }).then(() => {}, () => {});
  revalidatePath("/employees");
  revalidatePath("/onboarding");
  return ok({ id: emp.id, invite_url, invite_emailed });
}

/** Creates (or refreshes) a pending invitation and optionally emails it (needs the service role key). */
export async function createInvitation(orgId: string, employeeId: string | null, email: string, role: "manager" | "employee", createdBy: string, sendEmail: boolean): Promise<{ url: string; emailed: boolean }> {
  const supabase = await createSupabaseServerClient();
  await supabase.from("invitations").update({ status: "revoked" }).eq("organization_id", orgId).eq("email", email).eq("status", "pending");
  const { data: inv, error } = await supabase.from("invitations").insert({ organization_id: orgId, employee_id: employeeId, email, role, created_by: createdBy }).select("token").single();
  if (error || !inv) throw new Error(error?.message ?? "Could not create invitation");
  const url = `${siteUrl()}/invite/${inv.token}`;
  let emailed = false;
  if (sendEmail) {
    const admin = createSupabaseAdminClient();
    if (admin) {
      const { error: e } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(`/invite/${inv.token}`)}` });
      emailed = !e;
    }
  }
  return { url, emailed };
}

export async function resendInvitationAction(employeeId: string): Promise<ActionResult<{ url: string; emailed: boolean }>> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can invite");
  const supabase = await createSupabaseServerClient();
  const { data: emp } = await supabase.from("employees").select("id, email, role, user_id").eq("id", employeeId).single();
  if (!emp?.email) return fail("This employee has no email address");
  if (emp.user_id) return fail("This employee already has an account");
  try {
    const r = await createInvitation(ctx.org.id, emp.id, emp.email, emp.role === "manager" ? "manager" : "employee", ctx.user.id, true);
    revalidatePath(`/employees/${employeeId}`);
    return ok(r);
  } catch (e) { return fail(e); }
}

// ================================================================ profile management (owner only)

type EmploymentStatus = Database["public"]["Enums"]["employment_status"];
const EMPLOYMENT_STATUSES: EmploymentStatus[] = ["active", "inactive", "terminated"];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");

const updateEmployeeSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().optional().default(""),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  role: z.enum(["manager", "employee"]),
  employment_status: z.enum(["active", "inactive", "terminated"]),
  start_date: isoDate.optional().or(z.literal("")),
  end_date: isoDate.optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  location_ids: z.array(z.string().uuid()).default([]),
});

async function requireOwner(): Promise<{ ctx: Awaited<ReturnType<typeof requireOrgContext>>; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> } | { error: string }> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return { error: "Only the owner can change employees" };
  const supabase = await createSupabaseServerClient();
  return { ctx, supabase };
}

async function loadEmployee(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, orgId: string, id: string) {
  const { data } = await supabase.from("employees").select("*").eq("organization_id", orgId).eq("id", id).maybeSingle();
  return data;
}

/** Insert missing / delete removed employee_locations rows so they match `locationIds`. */
async function syncEmployeeLocations(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, orgId: string, employeeId: string, locationIds: string[]): Promise<string | null> {
  const { data: current, error } = await supabase.from("employee_locations").select("location_id").eq("employee_id", employeeId);
  if (error) return error.message;
  const have = new Set((current ?? []).map((r) => r.location_id));
  const want = new Set(locationIds);
  const toAdd = [...want].filter((id) => !have.has(id));
  const toRemove = [...have].filter((id) => !want.has(id));
  if (toAdd.length) {
    const { error: e } = await supabase.from("employee_locations").insert(toAdd.map((location_id) => ({ organization_id: orgId, employee_id: employeeId, location_id })));
    if (e) return e.message;
  }
  if (toRemove.length) {
    const { error: e } = await supabase.from("employee_locations").delete().eq("employee_id", employeeId).in("location_id", toRemove);
    if (e) return e.message;
  }
  return null;
}

/** Keep organization_members in step with the employee record (role + active/inactive). Never touches an owner membership. */
async function syncMembership(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, orgId: string, userId: string | null, patch: { role?: "manager" | "employee"; status?: "active" | "inactive" }) {
  if (!userId) return;
  const { data: m } = await supabase.from("organization_members").select("id, role").eq("organization_id", orgId).eq("user_id", userId).maybeSingle();
  if (!m || m.role === "owner") return;
  await supabase.from("organization_members").update(patch).eq("id", m.id);
}

function logActivity(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, orgId: string, action: string, entityId: string, before: Json | null, after: Json | null, note?: string) {
  return supabase.rpc("log_activity_public", { p_org: orgId, p_loc: null, p_action: action, p_entity_type: "employee", p_entity_id: entityId, p_before: before, p_after: after, p_note: note ?? null }).then(() => {}, () => {});
}

function revalidateEmployee(id: string) {
  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  revalidatePath("/employees/payroll");
}

export async function updateEmployeeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const parsed = updateEmployeeSchema.safeParse({
    id: formData.get("id"), first_name: formData.get("first_name"), last_name: formData.get("last_name") ?? "", email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "", role: formData.get("role"), employment_status: formData.get("employment_status"),
    start_date: formData.get("start_date") ?? "", end_date: formData.get("end_date") ?? "", notes: formData.get("notes") ?? "",
    location_ids: formData.getAll("location_ids").map(String).filter(Boolean),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  if (d.start_date && d.end_date && d.end_date < d.start_date) return fail("End date must be after the start date");
  const before = await loadEmployee(supabase, ctx.org.id, d.id);
  if (!before) return fail("Employee not found");
  const allowed = new Set(ctx.locations.map((l) => l.id));
  if (d.location_ids.some((id) => !allowed.has(id))) return fail("Unknown store");
  const defaultLocation = d.location_ids.includes(before.default_location_id ?? "") ? before.default_location_id : d.location_ids[0] ?? null;

  // An owner's own employee record keeps role = owner; the form only offers employee/manager.
  const role = before.role === "owner" ? "owner" : d.role;
  const { error } = await supabase.from("employees").update({
    first_name: d.first_name, last_name: d.last_name, email: d.email || null, phone: d.phone || null, role,
    employment_status: d.employment_status, start_date: d.start_date || null, end_date: d.end_date || null, notes: d.notes || null,
    default_location_id: defaultLocation,
  }).eq("id", d.id);
  if (error) return fail(error.message);

  const locErr = await syncEmployeeLocations(supabase, ctx.org.id, d.id, d.location_ids);
  if (locErr) return fail(locErr);

  await syncMembership(supabase, ctx.org.id, before.user_id, { ...(role === "owner" ? {} : { role }), status: d.employment_status === "active" ? "active" : "inactive" });

  const after = { first_name: d.first_name, last_name: d.last_name, email: d.email || null, phone: d.phone || null, role: d.role, employment_status: d.employment_status, start_date: d.start_date || null, end_date: d.end_date || null, location_ids: d.location_ids };
  await logActivity(supabase, ctx.org.id, "employee.updated", d.id, { first_name: before.first_name, last_name: before.last_name, email: before.email, phone: before.phone, role: before.role, employment_status: before.employment_status, start_date: before.start_date, end_date: before.end_date }, after);
  if (before.employment_status === "active" && d.employment_status !== "active") await logActivity(supabase, ctx.org.id, "employee.deactivated", d.id, null, { status: d.employment_status });
  revalidateEmployee(d.id);
  return ok(undefined);
}

export async function setEmployeeLocationsAction(employeeId: string, locationIds: string[]): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const emp = await loadEmployee(supabase, ctx.org.id, employeeId);
  if (!emp) return fail("Employee not found");
  const allowed = new Set(ctx.locations.map((l) => l.id));
  const ids = [...new Set(locationIds)].filter((id) => allowed.has(id));
  const err = await syncEmployeeLocations(supabase, ctx.org.id, employeeId, ids);
  if (err) return fail(err);
  if (!ids.includes(emp.default_location_id ?? "")) await supabase.from("employees").update({ default_location_id: ids[0] ?? null }).eq("id", employeeId);
  await logActivity(supabase, ctx.org.id, "employee.updated", employeeId, null, { location_ids: ids });
  revalidateEmployee(employeeId);
  return ok(undefined);
}

const payRateSchema = z.object({
  employee_id: z.string().uuid(),
  hourly_rate: z.coerce.number().min(0, "Rate cannot be negative").max(10000, "Rate looks too high"),
  effective_from: isoDate,
});

export async function addPayRateAction(_prev: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const parsed = payRateSchema.safeParse({ employee_id: formData.get("employee_id"), hourly_rate: formData.get("hourly_rate"), effective_from: formData.get("effective_from") || ctx.today });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  const emp = await loadEmployee(supabase, ctx.org.id, d.employee_id);
  if (!emp) return fail("Employee not found");
  const { data: prev } = await supabase.from("employee_pay_rates").select("hourly_rate, effective_from").eq("employee_id", d.employee_id).lte("effective_from", d.effective_from).order("effective_from", { ascending: false }).limit(1).maybeSingle();
  const { data: row, error } = await supabase.from("employee_pay_rates").insert({ organization_id: ctx.org.id, employee_id: d.employee_id, hourly_rate: d.hourly_rate, effective_from: d.effective_from, created_by: ctx.user.id }).select("id").single();
  if (error) return fail(error.message);
  await logActivity(supabase, ctx.org.id, "employee.rate_changed", d.employee_id, prev ? { hourly_rate: Number(prev.hourly_rate), effective_from: prev.effective_from } : null, { hourly_rate: d.hourly_rate, effective_from: d.effective_from });
  revalidateEmployee(d.employee_id);
  return ok({ id: row.id });
}

/** Deactivate / reactivate. Employees with shifts are never deleted; this only flips employment_status (and the linked account's membership). */
export async function setEmploymentStatusAction(employeeId: string, status: EmploymentStatus): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  if (!EMPLOYMENT_STATUSES.includes(status)) return fail("Unknown status");
  const emp = await loadEmployee(supabase, ctx.org.id, employeeId);
  if (!emp) return fail("Employee not found");
  if (emp.user_id === ctx.user.id) return fail("You cannot deactivate yourself");
  if (emp.employment_status === status) return ok(undefined);
  const leaving = status !== "active";
  const patch: Database["public"]["Tables"]["employees"]["Update"] = { employment_status: status };
  if (leaving && !emp.end_date) patch.end_date = ctx.today;
  if (!leaving) patch.end_date = null;
  const { error } = await supabase.from("employees").update(patch).eq("id", employeeId);
  if (error) return fail(error.message);
  if (leaving) {
    // A deactivated person should not keep an active clock-in.
    const { data: active } = await supabase.from("shifts").select("id, clock_in_at").eq("employee_id", employeeId).eq("status", "active").maybeSingle();
    if (active) await supabase.rpc("adjust_shift", { p_shift_id: active.id, p_clock_in: active.clock_in_at, p_clock_out: new Date().toISOString(), p_reason: "Employee deactivated" }).then(() => {}, () => {});
  }
  await syncMembership(supabase, ctx.org.id, emp.user_id, { status: leaving ? "inactive" : "active" });
  await logActivity(supabase, ctx.org.id, leaving ? "employee.deactivated" : "employee.reactivated", employeeId, { employment_status: emp.employment_status }, { employment_status: status });
  revalidateEmployee(employeeId);
  revalidatePath("/working");
  return ok(undefined);
}

const PERMISSION_KEYS: PermissionKey[] = ["can_edit_hours", "can_manage_schedule", "can_edit_closed_days", "can_add_expenses", "can_view_reports"];

/** Saves manager permission toggles into organization_members.permissions for the employee's linked account. */
export async function updateMemberPermissionsAction(employeeId: string, permissions: Partial<Record<PermissionKey, boolean>>): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const emp = await loadEmployee(supabase, ctx.org.id, employeeId);
  if (!emp) return fail("Employee not found");
  if (!emp.user_id) return fail("This employee has not joined yet — permissions apply once they accept the invitation");
  if (emp.role !== "manager") return fail("Permissions only apply to managers");
  const { data: m } = await supabase.from("organization_members").select("id, role, permissions").eq("organization_id", ctx.org.id).eq("user_id", emp.user_id).maybeSingle();
  if (!m) return fail("No membership found for this employee");
  if (m.role === "owner") return fail("Owners always have every permission");
  const clean: Record<string, boolean> = {};
  for (const k of PERMISSION_KEYS) if (typeof permissions[k] === "boolean") clean[k] = permissions[k] as boolean;
  const { error } = await supabase.from("organization_members").update({ permissions: clean, role: "manager" }).eq("id", m.id);
  if (error) return fail(error.message);
  await supabase.rpc("log_activity_public", { p_org: ctx.org.id, p_loc: null, p_action: "member.permissions_changed", p_entity_type: "organization_member", p_entity_id: m.id, p_before: m.permissions, p_after: clean }).then(() => {}, () => {});
  revalidateEmployee(employeeId);
  revalidatePath("/", "layout");
  return ok(undefined);
}

export async function revokeInvitationAction(invitationId: string): Promise<ActionResult> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const { data: inv } = await supabase.from("invitations").select("id, status, employee_id, email").eq("organization_id", ctx.org.id).eq("id", invitationId).maybeSingle();
  if (!inv) return fail("Invitation not found");
  if (inv.status !== "pending") return fail("Only pending invitations can be revoked");
  const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", inv.id);
  if (error) return fail(error.message);
  await supabase.rpc("log_activity_public", { p_org: ctx.org.id, p_loc: null, p_action: "invitation.revoked", p_entity_type: "invitation", p_entity_id: inv.id, p_after: { email: inv.email } }).then(() => {}, () => {});
  revalidatePath("/employees");
  if (inv.employee_id) revalidatePath(`/employees/${inv.employee_id}`);
  return ok(undefined);
}

/** Re-issues an invitation from the invitations list (works with or without a linked employee record). */
export async function reissueInvitationAction(invitationId: string): Promise<ActionResult<{ url: string; emailed: boolean }>> {
  const r = await requireOwner();
  if ("error" in r) return fail(r.error);
  const { ctx, supabase } = r;
  const { data: inv } = await supabase.from("invitations").select("id, email, role, employee_id").eq("organization_id", ctx.org.id).eq("id", invitationId).maybeSingle();
  if (!inv) return fail("Invitation not found");
  if (inv.employee_id) {
    const { data: emp } = await supabase.from("employees").select("user_id").eq("id", inv.employee_id).maybeSingle();
    if (emp?.user_id) return fail("This employee already has an account");
  }
  try {
    const res = await createInvitation(ctx.org.id, inv.employee_id, inv.email, inv.role === "manager" ? "manager" : "employee", ctx.user.id, true);
    revalidatePath("/employees");
    if (inv.employee_id) revalidatePath(`/employees/${inv.employee_id}`);
    return ok(res);
  } catch (e) { return fail(e); }
}
