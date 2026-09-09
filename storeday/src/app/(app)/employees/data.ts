import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { siteUrl } from "@/config/site";

type Tables = Database["public"]["Tables"];
export type ShiftRow = Tables["shifts"]["Row"];
export type InvitationRow = Tables["invitations"]["Row"];

export interface HoursSummary { employee_id: string; shifts: number; minutes: number; labor_cost: number; flagged: number }

/** employee_hours_summary for a range, keyed by employee id. */
export async function hoursByEmployee(supabase: ServerSupabase, orgId: string, from: string, to: string): Promise<Map<string, HoursSummary>> {
  const { data } = await supabase.rpc("employee_hours_summary", { p_org: orgId, p_from: from, p_to: to });
  const map = new Map<string, HoursSummary>();
  for (const r of data ?? []) {
    map.set(r.employee_id, { employee_id: r.employee_id, shifts: Number(r.shifts), minutes: Number(r.minutes), labor_cost: Number(r.labor_cost ?? 0), flagged: Number(r.flagged) });
  }
  return map;
}

/** Active (clocked-in) shifts keyed by employee id. */
export async function activeShiftByEmployee(supabase: ServerSupabase, orgId: string): Promise<Map<string, { id: string; location_id: string; clock_in_at: string }>> {
  const { data } = await supabase.from("shifts").select("id, employee_id, location_id, clock_in_at").eq("organization_id", orgId).eq("status", "active");
  const map = new Map<string, { id: string; location_id: string; clock_in_at: string }>();
  for (const s of data ?? []) map.set(s.employee_id, { id: s.id, location_id: s.location_id, clock_in_at: s.clock_in_at });
  return map;
}

export interface PendingInvitation {
  id: string; email: string; role: string; employee_id: string | null; employee_name: string | null;
  status: string; expires_at: string; created_at: string; expired: boolean; url: string;
}

/** Pending (and recently expired) invitations with a shareable link. */
export async function listPendingInvitations(supabase: ServerSupabase, orgId: string): Promise<PendingInvitation[]> {
  const { data } = await supabase
    .from("invitations")
    .select("id, email, role, employee_id, status, expires_at, created_at, token, employees(first_name, last_name, user_id)")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const now = Date.now();
  return (data ?? [])
    .filter((i) => !(i.employees as { user_id: string | null } | null)?.user_id)
    .map((i) => {
      const e = i.employees as { first_name: string; last_name: string } | null;
      return {
        id: i.id, email: i.email, role: i.role, employee_id: i.employee_id,
        employee_name: e ? `${e.first_name} ${e.last_name ?? ""}`.trim() : null,
        status: i.status, expires_at: i.expires_at, created_at: i.created_at,
        expired: new Date(i.expires_at).getTime() < now,
        url: `${siteUrl()}/invite/${i.token}`,
      };
    });
}

/** Employee ids that currently have a pending, unexpired invitation. */
export async function pendingInviteEmployeeIds(supabase: ServerSupabase, orgId: string): Promise<Set<string>> {
  const { data } = await supabase.from("invitations").select("employee_id").eq("organization_id", orgId).eq("status", "pending").gt("expires_at", new Date().toISOString());
  return new Set((data ?? []).map((i) => i.employee_id).filter((x): x is string => Boolean(x)));
}

export type AccountState = "joined" | "invited" | "not_invited" | "no_email";

export function accountState(e: { user_id: string | null; email: string | null }, pending: Set<string>, id: string): AccountState {
  if (e.user_id) return "joined";
  if (!e.email) return "no_email";
  return pending.has(id) ? "invited" : "not_invited";
}
