import { pickLocation, requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listEmployees } from "@/lib/data/team";
import { addISODays } from "@/lib/utils/time";
import { weekStartOf, zonedInstant } from "@/components/schedule/schedule-time";
import { ScheduleWeek, type ScheduleEmployee } from "@/components/schedule/schedule-week";
import { PageHeader, EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Schedule" };

export default async function SchedulePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireManagerContext();
  const sp = await searchParams;
  const location = pickLocation(ctx, typeof sp.location === "string" ? sp.location : null) ?? ctx.locations[0] ?? null;
  const canEdit = ctx.isOwner || ctx.can("can_manage_schedule");

  if (!location) {
    return (
      <div className="max-w-6xl">
        <PageHeader title="Schedule" />
        <EmptyState title="No stores yet" description="Add a store before building a schedule." />
      </div>
    );
  }

  const weekParam = typeof sp.week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.week) ? sp.week : ctx.today;
  const weekStart = weekStartOf(weekParam, ctx.settings.week_starts_on);
  const days = Array.from({ length: 7 }, (_, i) => addISODays(weekStart, i));
  const from = zonedInstant(weekStart, "00:00", location.timezone).toISOString();
  const to = zonedInstant(addISODays(weekStart, 7), "00:00", location.timezone).toISOString();

  const supabase = await createSupabaseServerClient();
  const [employees, { data: shifts }] = await Promise.all([
    listEmployees(supabase, ctx.org.id, { includeInactive: true }),
    supabase.from("schedules").select("id, employee_id, location_id, starts_at, ends_at, note, series_id")
      .eq("location_id", location.id).gte("starts_at", from).lt("starts_at", to).order("starts_at"),
  ]);
  const scheduled = new Set((shifts ?? []).map((s) => s.employee_id));
  const rows: ScheduleEmployee[] = employees
    .filter((e) => (e.employment_status === "active" && e.location_ids.includes(location.id)) || scheduled.has(e.id))
    .map((e) => ({ id: e.id, name: e.full_name, assigned: e.location_ids.includes(location.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const employeeOptions = employees.filter((e) => e.employment_status === "active").map((e) => ({ id: e.id, name: e.full_name }));

  return (
    <div className="max-w-6xl">
      <PageHeader title="Schedule" description={`Times shown in ${location.timezone.replace(/_/g, " ")}.`} />
      <ScheduleWeek
        location={{ id: location.id, name: location.name, timezone: location.timezone }}
        locations={ctx.locations.map((l) => ({ id: l.id, name: l.name, timezone: l.timezone }))}
        weekStart={weekStart}
        days={days}
        today={ctx.today}
        rows={rows}
        employeeOptions={employeeOptions}
        shifts={shifts ?? []}
        canEdit={canEdit}
      />
    </div>
  );
}
