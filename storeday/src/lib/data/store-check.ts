import "server-only";
import type { ServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Tables = Database["public"]["Tables"];
export type ChecklistTemplate = Tables["checklist_templates"]["Row"];
export type ChecklistItem = Tables["checklist_items"]["Row"];
export type ChecklistSubmission = Tables["checklist_submissions"]["Row"];
export type ChecklistSubmissionItem = Tables["checklist_submission_items"]["Row"];
export type ChecklistKind = Database["public"]["Enums"]["checklist_kind"];
export type SubmissionStatus = Database["public"]["Enums"]["submission_status"];

export interface StoreStatusRow {
  location_id: string;
  opened_at: string | null;
  opened_by_name: string | null;
  closed_at: string | null;
  closed_by_name: string | null;
  working_count: number;
  closeout_status: Database["public"]["Enums"]["report_status"] | null;
  opening_checklist_status: SubmissionStatus | null;
  closing_checklist_status: SubmissionStatus | null;
}

/**
 * OPENED / CLOSED status for every active store of the org on a business date.
 * Wraps the `store_status` RPC (RLS applies: names resolve only for people the caller may see).
 */
export async function storeStatusForDate(supabase: ServerSupabase, orgId: string, date: string): Promise<StoreStatusRow[]> {
  const { data } = await supabase.rpc("store_status", { p_org: orgId, p_date: date });
  return (data ?? []).map((r) => ({
    location_id: r.location_id,
    opened_at: r.opened_at ?? null,
    opened_by_name: r.opened_by_name || null,
    closed_at: r.closed_at ?? null,
    closed_by_name: r.closed_by_name || null,
    working_count: Number(r.working_count ?? 0),
    closeout_status: r.closeout_status ?? null,
    opening_checklist_status: r.opening_checklist_status ?? null,
    closing_checklist_status: r.closing_checklist_status ?? null,
  }));
}

export interface TemplateWithItems extends ChecklistTemplate {
  items: ChecklistItem[];
}

/** Templates of the org (active only by default) with their items in order. RLS hides store-scoped templates the caller cannot access. */
export async function listTemplates(supabase: ServerSupabase, orgId: string, opts: { includeInactive?: boolean } = {}): Promise<TemplateWithItems[]> {
  let q = supabase.from("checklist_templates").select("*").eq("organization_id", orgId).order("kind").order("name");
  if (!opts.includeInactive) q = q.eq("is_active", true);
  const { data: templates } = await q;
  if (!templates || templates.length === 0) return [];
  const { data: items } = await supabase
    .from("checklist_items")
    .select("*")
    .in("template_id", templates.map((t) => t.id))
    .order("sort_order")
    .order("created_at");
  const byTemplate = new Map<string, ChecklistItem[]>();
  for (const it of items ?? []) {
    const arr = byTemplate.get(it.template_id) ?? [];
    arr.push(it);
    byTemplate.set(it.template_id, arr);
  }
  return templates.map((t) => ({ ...t, items: byTemplate.get(t.id) ?? [] }));
}

/** Picks the template that applies to a store for a kind: store-specific wins over "All stores". */
export function templateForStore<T extends { location_id: string | null; kind: ChecklistKind; is_active: boolean }>(templates: T[], locationId: string, kind: ChecklistKind): T | null {
  const candidates = templates.filter((t) => t.is_active && t.kind === kind && (t.location_id === locationId || t.location_id === null));
  return candidates.find((t) => t.location_id === locationId) ?? candidates[0] ?? null;
}

/** Templates that can be run at a store (store-specific or org-wide), opening/closing first, then customs. */
export function templatesForStore<T extends { location_id: string | null; kind: ChecklistKind; is_active: boolean; id: string }>(templates: T[], locationId: string): T[] {
  const out: T[] = [];
  const opening = templateForStore(templates, locationId, "opening");
  const closing = templateForStore(templates, locationId, "closing");
  if (opening) out.push(opening);
  if (closing) out.push(closing);
  for (const t of templates) {
    if (t.kind === "custom" && t.is_active && (t.location_id === locationId || t.location_id === null)) out.push(t);
  }
  return out;
}

export interface SubmissionWithName extends ChecklistSubmission {
  submitted_by_name: string | null;
}

/**
 * Today's submissions for a set of locations (each on its own business date). `dates` maps location_id → YYYY-MM-DD.
 * Resolves submitted_by to a display name via employees.user_id, falling back to profiles.
 */
export async function submissionsForDates(supabase: ServerSupabase, orgId: string, dates: Record<string, string>): Promise<SubmissionWithName[]> {
  const locationIds = Object.keys(dates);
  if (locationIds.length === 0) return [];
  const uniqueDates = Array.from(new Set(Object.values(dates)));
  const { data } = await supabase
    .from("checklist_submissions")
    .select("*")
    .eq("organization_id", orgId)
    .in("location_id", locationIds)
    .in("business_date", uniqueDates)
    .order("started_at");
  const rows = (data ?? []).filter((s) => dates[s.location_id] === s.business_date);
  const names = await namesForUsers(supabase, orgId, rows.map((r) => r.submitted_by).filter((x): x is string => Boolean(x)));
  return rows.map((r) => ({ ...r, submitted_by_name: r.submitted_by ? names.get(r.submitted_by) ?? null : null }));
}

/** user_id → display name (employee record first, then profile). Only names the caller may read. */
export async function namesForUsers(supabase: ServerSupabase, orgId: string, userIds: string[]): Promise<Map<string, string>> {
  const ids = Array.from(new Set(userIds));
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const [{ data: emps }, { data: profiles }] = await Promise.all([
    supabase.from("employees").select("user_id, first_name, last_name").eq("organization_id", orgId).in("user_id", ids),
    supabase.from("profiles").select("id, full_name").in("id", ids),
  ]);
  for (const p of profiles ?? []) if (p.full_name) map.set(p.id, p.full_name);
  for (const e of emps ?? []) if (e.user_id) map.set(e.user_id, `${e.first_name} ${e.last_name ?? ""}`.trim());
  return map;
}

/** Signed URLs (10 minutes) for photo paths in the checklist-photos bucket. Missing/forbidden files are omitted. */
export async function signChecklistPhotos(supabase: ServerSupabase, paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  const { data } = await supabase.storage.from("checklist-photos").createSignedUrls(unique, 600);
  const out: Record<string, string> = {};
  for (const d of data ?? []) if (d.path && d.signedUrl && !d.error) out[d.path] = d.signedUrl;
  return out;
}
