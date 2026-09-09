"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { siteUrl } from "@/config/site";

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
