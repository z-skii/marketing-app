import type { Metadata } from "next";
import Link from "next/link";
import { requireOwnerContext } from "@/lib/auth";
import { createSupabaseServerClient, hasServiceRole } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Alert } from "@/components/ui/form";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { InviteNote, MembersTable, RoleLegend, type MemberRow } from "@/components/settings/members-table";
import type { PermissionKey } from "@/lib/permissions";

export const metadata: Metadata = { title: "Members & permissions" };

export default async function MembersSettingsPage() {
  const ctx = await requireOwnerContext();
  const supabase = await createSupabaseServerClient();
  const [{ data: members }, { data: employees }, { data: invitations }] = await Promise.all([
    supabase.from("organization_members").select("id, user_id, role, status, permissions, created_at").eq("organization_id", ctx.org.id).order("created_at"),
    supabase.from("employees").select("id, user_id, first_name, last_name, email").eq("organization_id", ctx.org.id),
    supabase.from("invitations").select("id, email, role, expires_at, employee_id, employees(first_name, last_name)").eq("organization_id", ctx.org.id).eq("status", "pending").order("created_at", { ascending: false }),
  ]);
  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds) : { data: [] as Array<{ id: string; email: string | null; full_name: string | null }> };
  const profileBy = new Map((profiles ?? []).map((p) => [p.id, p]));
  const employeeBy = new Map((employees ?? []).filter((e) => e.user_id).map((e) => [e.user_id as string, e]));

  const order = { owner: 0, manager: 1, employee: 2 };
  const rows: MemberRow[] = (members ?? []).map((m) => {
    const p = profileBy.get(m.user_id);
    const e = employeeBy.get(m.user_id);
    return {
      id: m.id, user_id: m.user_id, role: m.role, status: m.status,
      permissions: (m.permissions && typeof m.permissions === "object" ? m.permissions : {}) as Partial<Record<PermissionKey, boolean>>,
      name: e ? `${e.first_name} ${e.last_name}`.trim() : p?.full_name ?? "",
      email: p?.email ?? e?.email ?? "",
      employee_id: e?.id ?? null,
      is_self: m.user_id === ctx.user.id,
      joined_at: m.created_at,
    };
  }).sort((a, b) => order[a.role] - order[b.role] || a.name.localeCompare(b.name));

  const pending = (invitations ?? []).map((i) => ({
    id: i.id, email: i.email, role: i.role, expires_at: i.expires_at,
    name: i.employees ? `${(i.employees as { first_name: string; last_name: string }).first_name} ${(i.employees as { last_name: string }).last_name}`.trim() : null,
  }));

  return (
    <div>
      <PageHeader title="Settings" description="Who can sign in to this business and what managers are allowed to do." />
      <SettingsTabs active="members" isOwner />
      <div className="space-y-5">
        <MembersTable members={rows} />
        <RoleLegend />
        <section>
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-[13px] font-semibold">Pending invitations <span className="text-text-3 font-normal">({pending.length})</span></h2>
            <Link href="/employees" className="text-[12.5px] text-accent hover:underline">Manage on Employees</Link>
          </div>
          <InviteNote pending={pending} />
          {!hasServiceRole() && <Alert tone="warn" className="mt-2">Invitation emails are not sent from this deployment (no service role key configured). Share the invitation link from the employee&apos;s page instead.</Alert>}
        </section>
      </div>
    </div>
  );
}
