import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { OrgContext } from "@/lib/auth";
import type { ActivityEntry } from "@/components/settings/activity-log";

/** Last N activity_logs rows for the org with actor names (profiles) and store names. */
export async function loadActivityLog(supabase: ServerSupabase, ctx: OrgContext, limit = 100): Promise<ActivityEntry[]> {
  const { data } = await supabase.from("activity_logs").select("*").eq("organization_id", ctx.org.id).order("created_at", { ascending: false }).limit(limit);
  const rows = data ?? [];
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter((x): x is string => !!x)));
  const [{ data: profiles }, { data: employees }] = await Promise.all([
    actorIds.length ? supabase.from("profiles").select("id, full_name, email").in("id", actorIds) : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; email: string | null }> }),
    actorIds.length ? supabase.from("employees").select("user_id, first_name, last_name").eq("organization_id", ctx.org.id).in("user_id", actorIds) : Promise.resolve({ data: [] as Array<{ user_id: string | null; first_name: string; last_name: string }> }),
  ]);
  const nameBy = new Map<string, string>();
  for (const p of profiles ?? []) nameBy.set(p.id, p.full_name || p.email || "Someone");
  for (const e of employees ?? []) if (e.user_id) nameBy.set(e.user_id, `${e.first_name} ${e.last_name}`.trim() || nameBy.get(e.user_id) || "Someone");
  const locBy = new Map(ctx.locations.map((l) => [l.id, l.name]));
  return rows.map((r) => ({
    id: r.id, created_at: r.created_at, action: r.action, entity_type: r.entity_type, entity_id: r.entity_id, note: r.note,
    before_data: r.before_data, after_data: r.after_data,
    actor_name: r.actor_id ? nameBy.get(r.actor_id) ?? "Someone" : "System",
    location_name: r.location_id ? locBy.get(r.location_id) ?? null : null,
  }));
}
