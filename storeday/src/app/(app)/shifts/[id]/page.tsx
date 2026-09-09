import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ShiftDetail, type ShiftDetailProps } from "@/components/shifts/shift-detail";

export const metadata: Metadata = { title: "Shift" };

export default async function ShiftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const supabase = await createSupabaseServerClient();

  const { data: shift } = await supabase
    .from("shifts")
    .select("*, employees(id, first_name, last_name, user_id), locations(id, name, timezone, latitude, longitude, address_line1, city, state, geofence_radius_m)")
    .eq("id", id)
    .maybeSingle();
  if (!shift) notFound();

  const [{ data: verifications }, { data: photos }, { data: adjustments }] = await Promise.all([
    supabase.from("shift_verifications").select("*").eq("shift_id", id).order("recorded_at"),
    supabase.from("shift_photos").select("*").eq("shift_id", id).order("taken_at"),
    supabase.from("time_adjustments").select("*").eq("shift_id", id).order("created_at", { ascending: false }),
  ]);

  const photoUrls = await Promise.all((photos ?? []).map(async (p) => {
    const { data } = await supabase.storage.from(p.storage_bucket).createSignedUrl(p.storage_path, 600);
    return { id: p.id, kind: p.kind, url: data?.signedUrl ?? null, taken_at: p.taken_at, bytes: p.bytes };
  }));

  const adjusterIds = Array.from(new Set((adjustments ?? []).map((a) => a.adjusted_by)));
  const { data: adjusters } = adjusterIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", adjusterIds)
    : { data: [] as Array<{ id: string; full_name: string | null; email: string | null }> };
  const nameOf = (uid: string) => { const p = adjusters?.find((x) => x.id === uid); return p?.full_name || p?.email || "Manager"; };

  const emp = shift.employees as { id: string; first_name: string; last_name: string; user_id: string | null } | null;
  const loc = shift.locations as { id: string; name: string; timezone: string; latitude: number | null; longitude: number | null; address_line1: string | null; city: string | null; state: string | null; geofence_radius_m: number | null } | null;

  const props: ShiftDetailProps = {
    shift: {
      id: shift.id, status: shift.status, verification_status: shift.verification_status, business_date: shift.business_date,
      clock_in_at: shift.clock_in_at, clock_out_at: shift.clock_out_at, break_minutes: shift.break_minutes, worked_minutes: shift.worked_minutes,
      hourly_rate_snapshot: shift.hourly_rate_snapshot == null ? null : Number(shift.hourly_rate_snapshot),
      labor_cost: shift.labor_cost == null ? null : Number(shift.labor_cost),
      source: shift.source, note: shift.note,
      employee_id: shift.employee_id, employee_name: emp ? `${emp.first_name} ${emp.last_name ?? ""}`.trim() : "Employee",
      location_id: shift.location_id, location_name: loc?.name ?? "Store", timezone: loc?.timezone ?? ctx.org.timezone,
      store_lat: loc?.latitude ?? null, store_lng: loc?.longitude ?? null,
      store_address: loc ? [loc.address_line1, loc.city, loc.state].filter(Boolean).join(", ") || null : null,
      radius_m: loc?.geofence_radius_m ?? ctx.settings.default_geofence_radius_m,
    },
    verifications: (verifications ?? []).map((v) => ({
      id: v.id, kind: v.kind, recorded_at: v.recorded_at, latitude: v.latitude, longitude: v.longitude, accuracy_m: v.accuracy_m,
      distance_m: v.distance_m, radius_m: v.radius_m, within_radius: v.within_radius, status: v.status, flags: v.flags ?? [],
      device_info: (v.device_info ?? {}) as Record<string, unknown>, photo_id: v.photo_id,
    })),
    photos: photoUrls,
    adjustments: (adjustments ?? []).map((a) => ({
      id: a.id, created_at: a.created_at, by: nameOf(a.adjusted_by), reason: a.reason,
      original_clock_in: a.original_clock_in, original_clock_out: a.original_clock_out, new_clock_in: a.new_clock_in, new_clock_out: a.new_clock_out,
      original_minutes: a.original_minutes, new_minutes: a.new_minutes,
    })),
    isManager: ctx.isManager,
    canEdit: ctx.isManager && ctx.can("can_edit_hours"),
    isSelf: !!emp?.user_id && emp.user_id === ctx.user.id,
    currency: ctx.settings.currency,
  };
  return <ShiftDetail {...props} />;
}
