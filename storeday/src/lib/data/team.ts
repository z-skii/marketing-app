import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type EmployeeRow = Database["public"]["Tables"]["employees"]["Row"];
export type PayRate = Database["public"]["Tables"]["employee_pay_rates"]["Row"];

export interface EmployeeWithRate extends EmployeeRow {
  hourly_rate: number | null;
  location_ids: string[];
  full_name: string;
}

/** Employees with their current pay rate and assigned locations. */
export async function listEmployees(supabase: ServerSupabase, orgId: string, opts: { includeInactive?: boolean } = {}): Promise<EmployeeWithRate[]> {
  let q = supabase.from("employees").select("*, employee_pay_rates(hourly_rate, effective_from), employee_locations(location_id)").eq("organization_id", orgId).order("first_name");
  if (!opts.includeInactive) q = q.eq("employment_status", "active");
  const { data } = await q;
  const today = new Date().toISOString().slice(0, 10);
  return (data ?? []).map((e) => {
    const rates = ((e.employee_pay_rates as Array<{ hourly_rate: number; effective_from: string }>) ?? [])
      .filter((r) => r.effective_from <= today)
      .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
    const { employee_pay_rates: _r, employee_locations: locs, ...rest } = e;
    void _r;
    return {
      ...rest,
      hourly_rate: rates[0] ? Number(rates[0].hourly_rate) : null,
      location_ids: ((locs as Array<{ location_id: string }>) ?? []).map((l) => l.location_id),
      full_name: `${e.first_name} ${e.last_name ?? ""}`.trim(),
    };
  });
}

/** Active shifts across the org (Who's Working). */
export async function activeShifts(supabase: ServerSupabase, orgId: string) {
  const { data } = await supabase
    .from("shifts")
    .select("*, employees(first_name, last_name), locations(name, timezone)")
    .eq("organization_id", orgId)
    .eq("status", "active")
    .order("clock_in_at");
  return (data ?? []).map((s) => ({
    ...s,
    employee_name: `${(s.employees as { first_name: string } | null)?.first_name ?? ""} ${(s.employees as { last_name: string } | null)?.last_name ?? ""}`.trim(),
    location_name: (s.locations as { name: string } | null)?.name ?? "",
    timezone: (s.locations as { timezone: string } | null)?.timezone ?? "UTC",
  }));
}
