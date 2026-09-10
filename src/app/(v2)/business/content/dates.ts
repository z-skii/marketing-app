/**
 * Calendar arithmetic shared by the Content screens. Day keys are
 * "YYYY-MM-DD" in the business's time zone, so a post scheduled at 11:00
 * local lands under the right day whatever the viewer's clock says.
 */

export function dayKeyOf(value: string | Date, timeZone: string): string {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function timeOf(value: string | Date, timeZone: string): string {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(d);
}

/** "Wed, Sep 2" for a day key. Day keys are dates, so they format in UTC. */
export function dayLabel(dayKey: string, options: { weekday?: boolean } = {}): string {
  const d = new Date(`${dayKey}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: "short", day: "numeric", ...(options.weekday === false ? {} : { weekday: "short" }),
  }).format(d);
}

/** "September 18" for a day key: the big date on a shoot. */
export function longDayLabel(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric" }).format(d);
}

/** Whole days from one day key to another; negative when `to` is earlier. */
export function daysBetween(fromKey: string, toKey: string): number {
  const a = Date.UTC(Number(fromKey.slice(0, 4)), Number(fromKey.slice(5, 7)) - 1, Number(fromKey.slice(8, 10)));
  const b = Date.UTC(Number(toKey.slice(0, 4)), Number(toKey.slice(5, 7)) - 1, Number(toKey.slice(8, 10)));
  return Math.round((b - a) / 86_400_000);
}

/** "Today", "Tomorrow", "Wednesday" inside the week, otherwise "Sep 24". */
export function groupLabel(dayKey: string, todayKey: string): string {
  const days = daysBetween(todayKey, dayKey);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1 && days < 7) {
    return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long" }).format(new Date(`${dayKey}T00:00:00Z`));
  }
  return dayLabel(dayKey, { weekday: false });
}

/** "2 PM" or "2:30 PM" from a Postgres time like "14:00:00". */
export function shootTimeLabel(startsAt: string | null): string | null {
  if (!startsAt) return null;
  const m = /^(\d{2}):(\d{2})/.exec(startsAt);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return minute === 0 ? `${h12} ${ampm}` : `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
}

/** "Sep 18 · 2 PM" or "Sep 18" for a shoot. */
export function shootWhenLabel(scheduledFor: string | null, startsAt: string | null): string {
  if (!scheduledFor) return "Date to be set";
  const time = shootTimeLabel(startsAt);
  const day = dayLabel(scheduledFor, { weekday: false });
  return time ? `${day} · ${time}` : day;
}

/** Local "YYYY-MM-DD" and "HH:MM" for the schedule picker defaults: tomorrow at 11:00 in the business zone. */
export function defaultScheduleSlot(todayKey: string): { date: string; time: string } {
  const d = new Date(`${todayKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return { date: d.toISOString().slice(0, 10), time: "11:00" };
}
