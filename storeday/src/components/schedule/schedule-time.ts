import { TZDate } from "@date-fns/tz";
import { addDays, format, startOfWeek } from "date-fns";
import { fromISODate, toISODate, type ISODate } from "@/lib/utils/time";

/** Instant for a wall-clock date + "HH:mm" in a timezone. */
export function zonedInstant(date: ISODate, time: string, timezone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(new TZDate(y, m - 1, d, h, min, 0, timezone).getTime());
}

/** Start/end instants for a shift. An end time at or before the start rolls into the next day (closing shifts). */
export function shiftBounds(date: ISODate, startTime: string, endTime: string, timezone: string): { starts_at: string; ends_at: string } {
  const start = zonedInstant(date, startTime, timezone);
  let end = zonedInstant(date, endTime, timezone);
  if (end.getTime() <= start.getTime()) end = new Date(addDays(new TZDate(end, timezone), 1).getTime());
  return { starts_at: start.toISOString(), ends_at: end.toISOString() };
}

/** Shifts an instant by whole days keeping the wall-clock time in the timezone (DST-safe). */
export function plusDaysKeepingWallClock(ts: string, days: number, timezone: string): string {
  return new Date(addDays(new TZDate(new Date(ts), timezone), days).getTime()).toISOString();
}

/** First day of the week containing `date`. */
export function weekStartOf(date: ISODate, weekStartsOn: number): ISODate {
  return toISODate(startOfWeek(fromISODate(date), { weekStartsOn: (weekStartsOn % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6 }));
}

/** "9a", "9:30a", "5p", "12:15p" */
export function compactTime(ts: string, timezone: string): string {
  const d = new TZDate(new Date(ts), timezone);
  const h = d.getHours(), m = d.getMinutes();
  const suffix = h < 12 ? "a" : "p";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${m.toString().padStart(2, "0")}${suffix}`;
}

/** "HH:mm" in the timezone, for time inputs. */
export function wallClockTime(ts: string, timezone: string): string {
  return format(new TZDate(new Date(ts), timezone), "HH:mm");
}

export function durationHours(startsAt: string, endsAt: string): number {
  return Math.max(0, (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 3600000);
}

/** 7.5 → "7.5h", 8 → "8h" */
export function formatH(hours: number): string {
  const r = Math.round(hours * 4) / 4;
  return `${Number.isInteger(r) ? r : r.toFixed(r * 10 % 1 === 0 ? 1 : 2)}h`;
}
