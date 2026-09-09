import type { Metadata } from "next";
import Link from "next/link";
import { requireOrgContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { addISODays, businessDateOf, formatMinutes, formatShortDate, formatTime, formatWeekdayDate, minutesBetween, todayIn } from "@/lib/utils/time";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "My schedule" };

const UPCOMING_DAYS = 14;
const PAST_DAYS = 7;

export default async function MySchedulePage() {
  const ctx = await requireOrgContext();
  if (!ctx.employee) {
    return <EmptyState title="No schedule" description="You are not set up as an employee, so there is nothing scheduled for you." />;
  }
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const from = new Date(now.getTime() - PAST_DAYS * 86400000).toISOString();
  const to = new Date(now.getTime() + UPCOMING_DAYS * 86400000).toISOString();
  const { data } = await supabase
    .from("schedules")
    .select("id, starts_at, ends_at, note, location_id, locations(name, timezone)")
    .eq("employee_id", ctx.employee.id)
    .gte("ends_at", from)
    .lte("starts_at", to)
    .order("starts_at");

  const rows = (data ?? []).map((s) => {
    const loc = s.locations as { name: string; timezone: string } | null;
    const tz = loc?.timezone ?? ctx.org.timezone;
    return { id: s.id, starts_at: s.starts_at, ends_at: s.ends_at, note: s.note, store: loc?.name ?? "Store", tz, day: businessDateOf(s.starts_at, tz), minutes: minutesBetween(s.starts_at, s.ends_at) };
  });
  const nowIso = now.toISOString();
  const upcoming = rows.filter((r) => r.ends_at >= nowIso);
  const past = rows.filter((r) => r.ends_at < nowIso).reverse();
  const today = todayIn(ctx.org.timezone);
  const tomorrow = addISODays(today, 1);

  const byDay = new Map<string, typeof upcoming>();
  for (const r of upcoming) { if (!byDay.has(r.day)) byDay.set(r.day, []); byDay.get(r.day)!.push(r); }
  const upcomingMinutes = upcoming.reduce((a, r) => a + r.minutes, 0);

  return (
    <div className="max-w-md mx-auto">
      <PageHeader title="My schedule" description={`Next ${UPCOMING_DAYS} days · ${formatMinutes(upcomingMinutes)} scheduled`} />
      {byDay.size === 0 ? (
        <Card><CardBody className="pt-4 text-[13.5px] text-text-3">Nothing scheduled in the next {UPCOMING_DAYS} days. Check back later or ask your manager.</CardBody></Card>
      ) : (
        <div className="space-y-2">
          {Array.from(byDay.entries()).map(([day, items]) => (
            <Card key={day}>
              <CardHeader title={day === today ? "Today" : day === tomorrow ? "Tomorrow" : formatWeekdayDate(day)} description={day === today || day === tomorrow ? formatWeekdayDate(day) : undefined} />
              <CardBody>
                <ul className="divide-y divide-border">
                  {items.map((r) => (
                    <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold tnum">{formatTime(r.starts_at, r.tz)} – {formatTime(r.ends_at, r.tz)}</div>
                        <div className="text-[12.5px] text-text-2 truncate">{r.store}{r.note ? ` · ${r.note}` : ""}</div>
                      </div>
                      <div className="tnum text-[13px] text-text-3 shrink-0">{formatMinutes(r.minutes)}</div>
                    </li>
                  ))}
                </ul>
                {day === today && <Link href="/clock" className="mt-2 inline-block text-[13px] text-accent">Go to clock →</Link>}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-4">
        <CardHeader title="Past week" />
        <CardBody>
          {past.length === 0 ? (
            <div className="text-[13px] text-text-3">No scheduled shifts in the past {PAST_DAYS} days.</div>
          ) : (
            <ul className="divide-y divide-border">
              {past.map((r) => (
                <li key={r.id} className="py-1.5 flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-text-2 w-24 shrink-0">{formatShortDate(r.day)}</span>
                  <span className="flex-1 min-w-0 truncate">{r.store}</span>
                  <span className="tnum text-text-2 whitespace-nowrap">{formatTime(r.starts_at, r.tz)} – {formatTime(r.ends_at, r.tz)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[12px] text-text-3">Worked hours are on the <Link href="/my/hours" className="text-accent">Hours</Link> tab.</p>
        </CardBody>
      </Card>
    </div>
  );
}
