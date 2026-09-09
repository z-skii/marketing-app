"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { geocodeAddress } from "@/lib/geocode";
import { feetToMeters } from "@/lib/calc/geo";

const locationSchema = z.object({
  name: z.string().trim().min(1, "Store name is required"),
  address_line1: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: z.string().trim().optional().nullable(),
  postal_code: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  timezone: z.string().trim().min(1),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  geofence_radius_ft: z.coerce.number().optional().nullable(),
});

function readLocationForm(formData: FormData) {
  const get = (k: string) => { const v = formData.get(k); return v == null || v === "" ? null : String(v); };
  return locationSchema.safeParse({
    name: get("name"), address_line1: get("address_line1"), city: get("city"), state: get("state"), postal_code: get("postal_code"),
    phone: get("phone"), timezone: get("timezone") ?? "America/New_York", latitude: get("latitude"), longitude: get("longitude"),
    geofence_radius_ft: get("geofence_radius_ft"),
  });
}

export async function createLocationAction(_prev: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can add stores");
  const parsed = readLocationForm(formData);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  let lat = d.latitude ?? null, lng = d.longitude ?? null;
  if ((lat == null || lng == null) && (d.address_line1 || d.city)) {
    const g = await geocodeAddress([d.address_line1, d.city, d.state, d.postal_code].filter(Boolean).join(", "));
    if (g) { lat = g.latitude; lng = g.longitude; }
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("locations").insert({
    organization_id: ctx.org.id, name: d.name, address_line1: d.address_line1, city: d.city, state: d.state, postal_code: d.postal_code,
    phone: d.phone, timezone: d.timezone, latitude: lat, longitude: lng,
    geofence_radius_m: d.geofence_radius_ft ? Math.round(feetToMeters(d.geofence_radius_ft)) : null,
    sort_order: ctx.locations.length, created_by: ctx.user.id,
  }).select("id").single();
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return ok({ id: data.id });
}

export async function updateLocationAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can edit stores");
  const id = String(formData.get("id") ?? "");
  const parsed = readLocationForm(formData);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  let lat = d.latitude ?? null, lng = d.longitude ?? null;
  if ((lat == null || lng == null) && formData.get("geocode") === "1") {
    const g = await geocodeAddress([d.address_line1, d.city, d.state, d.postal_code].filter(Boolean).join(", "));
    if (g) { lat = g.latitude; lng = g.longitude; }
  }
  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase.from("locations").select("*").eq("id", id).single();
  const { error } = await supabase.from("locations").update({
    name: d.name, address_line1: d.address_line1, city: d.city, state: d.state, postal_code: d.postal_code, phone: d.phone, timezone: d.timezone,
    latitude: lat, longitude: lng, geofence_radius_m: d.geofence_radius_ft ? Math.round(feetToMeters(d.geofence_radius_ft)) : null,
  }).eq("id", id);
  if (error) return fail(error.message);
  await supabase.rpc("log_activity_public", { p_org: ctx.org.id, p_loc: id, p_action: "location.updated", p_entity_type: "location", p_entity_id: id, p_before: before, p_after: { name: d.name, latitude: lat, longitude: lng } }).then(() => {}, () => {});
  revalidatePath("/", "layout");
  return ok(undefined);
}

export async function geocodeAction(query: string): Promise<ActionResult<{ latitude: number; longitude: number; display_name: string }>> {
  await requireOrgContext();
  const g = await geocodeAddress(query);
  if (!g) return fail("Address not found. Try a fuller address, or use your current location.");
  return ok(g);
}

export async function updateLocationSettingsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can change store settings");
  const id = String(formData.get("location_id") ?? "");
  const b = (k: string) => formData.get(k) === "on" || formData.get(k) === "true";
  const supabase = await createSupabaseServerClient();
  const starting = formData.get("starting_cash");
  const { error } = await supabase.from("location_settings").update({
    require_accounting_closeout: b("require_accounting_closeout"),
    require_closing_checklist: b("require_closing_checklist"),
    require_opening_checklist: b("require_opening_checklist"),
    require_employee_verification: b("require_employee_verification"),
    require_cash_count: b("require_cash_count"),
    require_manager_approval: b("require_manager_approval"),
    starting_cash: starting ? Number(starting) : 0,
    opens_at: (formData.get("opens_at") as string) || null,
    closes_at: (formData.get("closes_at") as string) || null,
  }).eq("location_id", id);
  if (error) return fail(error.message);
  await supabase.rpc("log_activity_public", { p_org: ctx.org.id, p_loc: id, p_action: "location.settings_changed", p_entity_type: "location", p_entity_id: id }).then(() => {}, () => {});
  revalidatePath(`/stores/${id}`);
  return ok(undefined);
}

export async function archiveLocationAction(id: string): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can archive stores");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("locations").update({ is_active: false }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/", "layout");
  return ok(undefined);
}
