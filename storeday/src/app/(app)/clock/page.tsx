import type { Metadata } from "next";
import Link from "next/link";
import { requireOrgContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayIn } from "@/lib/utils/time";
import { EmptyState } from "@/components/ui/misc";
import { ClockScreen, type ClockLocation, type ClockShift, type NextShift } from "@/components/shifts/clock-screen";

export const metadata: Metadata = { title: "Clock" };

export default async function ClockPage() {
  const ctx = await requireOrgContext();
  if (!ctx.employee) {
    return (
      <div className="max-w-md mx-auto pt-6">
        <EmptyState
          title="You are not set up as an employee"
          description={ctx.isOwner
            ? "Clocking in needs an employee record so shifts and labor can be tracked. Add yourself on the Employees page (use your own email) and assign your stores."
            : "Ask the business owner to add you as an employee and assign you to a store. Once that's done, this screen becomes your clock."}
          action={ctx.isOwner ? <Link href="/employees" className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-[14px] font-medium text-white">Go to Employees</Link> : undefined}
        />
      </div>
    );
  }
  const emp = ctx.employee;
  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();

  const [{ data: assigned }, { data: active }, { data: nextSched }] = await Promise.all([
    supabase.from("employee_locations").select("location_id").eq("employee_id", emp.id),
    supabase.from("shifts").select("*, locations(name)").eq("employee_id", emp.id).eq("status", "active").maybeSingle(),
    supabase.from("schedules").select("id, starts_at, ends_at, location_id, locations(name, timezone)").eq("employee_id", emp.id).gte("ends_at", nowIso).order("starts_at").limit(1).maybeSingle(),
  ]);

  const assignedIds = new Set((assigned ?? []).map((a) => a.location_id));
  const usable = ctx.locations.filter((l) => assignedIds.has(l.id));
  const base = usable.length ? usable : ctx.locations;
  const locations: ClockLocation[] = base.map((l) => ({
    id: l.id,
    name: l.name,
    address: [l.address_line1, l.city, l.state].filter(Boolean).join(", ") || null,
    latitude: l.latitude,
    longitude: l.longitude,
    timezone: l.timezone,
    radius_m: l.geofence_radius_m ?? ctx.settings.default_geofence_radius_m,
  }));

  // "Today" per store timezone (an employee may work in stores with different zones).
  const todays = Array.from(new Set([ctx.today, ...locations.map((l) => todayIn(l.timezone))]));
  const { data: todayRows } = await supabase
    .from("shifts")
    .select("*, locations(name, timezone)")
    .eq("employee_id", emp.id)
    .in("business_date", todays)
    .neq("status", "active")
    .order("clock_in_at");

  const toShift = (s: NonNullable<typeof todayRows>[number] | NonNullable<typeof active>): ClockShift => {
    const loc = (s.locations as { name: string; timezone?: string } | null);
    const known = locations.find((l) => l.id === s.location_id);
    return {
      id: s.id, location_id: s.location_id, location_name: loc?.name ?? known?.name ?? "Store",
      timezone: known?.timezone ?? loc?.timezone ?? ctx.org.timezone,
      clock_in_at: s.clock_in_at, clock_out_at: s.clock_out_at, status: s.status, verification_status: s.verification_status,
      worked_minutes: s.worked_minutes, break_minutes: s.break_minutes,
    };
  };

  const nextShift: NextShift | null = nextSched ? {
    id: nextSched.id, starts_at: nextSched.starts_at, ends_at: nextSched.ends_at,
    location_name: (nextSched.locations as { name: string } | null)?.name ?? "Store",
    timezone: (nextSched.locations as { timezone: string } | null)?.timezone ?? ctx.org.timezone,
  } : null;

  return (
    <ClockScreen
      employeeName={emp.first_name}
      locations={locations}
      activeShift={active ? toShift(active) : null}
      todayShifts={(todayRows ?? []).map(toShift)}
      nextShift={nextShift}
      allowWithoutPhoto={ctx.settings.allow_clock_in_without_photo}
      allowOutsideRadius={ctx.settings.allow_clock_in_outside_radius}
    />
  );
}
