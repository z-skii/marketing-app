import { TZDate } from "@date-fns/tz";
import { addDays, differenceInMinutes, endOfMonth, format, getDay, startOfMonth, startOfWeek, endOfWeek, subDays, parseISO } from "date-fns";

export type ISODate = string; // YYYY-MM-DD

/** Today's date (YYYY-MM-DD) in the given IANA timezone. */
export function todayIn(timezone: string, now: Date = new Date()): ISODate {
  return format(new TZDate(now, timezone), "yyyy-MM-dd");
}

export function nowIn(timezone: string): TZDate {
  return new TZDate(new Date(), timezone);
}

export function toISODate(d: Date): ISODate {
  return format(d, "yyyy-MM-dd");
}

export function fromISODate(s: ISODate): Date {
  return parseISO(s + "T00:00:00");
}

export function addISODays(s: ISODate, days: number): ISODate {
  return toISODate(addDays(fromISODate(s), days));
}

export function isoDayOfWeek(s: ISODate): number {
  return getDay(fromISODate(s));
}

/** "Tue, Sep 8" */
export function formatShortDate(s: ISODate): string {
  return format(fromISODate(s), "EEE, MMM d");
}

/** "September 8, 2026" */
export function formatLongDate(s: ISODate): string {
  return format(fromISODate(s), "MMMM d, yyyy");
}

/** "Tuesday, September 8" */
export function formatWeekdayDate(s: ISODate): string {
  return format(fromISODate(s), "EEEE, MMMM d");
}

export function formatMonth(s: ISODate): string {
  return format(fromISODate(s), "MMMM yyyy");
}

/** "9:03 AM" in the location's timezone. */
export function formatTime(ts: string | Date | null | undefined, timezone: string): string {
  if (!ts) return "—";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return format(new TZDate(d, timezone), "h:mm a");
}

export function formatDateTime(ts: string | Date | null | undefined, timezone: string): string {
  if (!ts) return "—";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return format(new TZDate(d, timezone), "MMM d, h:mm a");
}

/** Business date for an instant in a timezone. */
export function businessDateOf(ts: string | Date, timezone: string): ISODate {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return format(new TZDate(d, timezone), "yyyy-MM-dd");
}

/** 494 → "8h 14m"; 0 → "0m". */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes == null) return "—";
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  return `${h}h ${r.toString().padStart(2, "0")}m`;
}

/** 494 → "8.2h" */
export function formatHours(minutes: number | null | undefined, digits = 1): string {
  if (minutes == null) return "—";
  return `${(minutes / 60).toFixed(digits)}h`;
}

/** Elapsed timer "03:42:17". */
export function formatElapsed(fromTs: string | Date, now: Date = new Date()): string {
  const from = typeof fromTs === "string" ? new Date(fromTs) : fromTs;
  const s = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return [h, m, r].map((x) => x.toString().padStart(2, "0")).join(":");
}

export function minutesBetween(a: string | Date, b: string | Date): number {
  return differenceInMinutes(typeof b === "string" ? new Date(b) : b, typeof a === "string" ? new Date(a) : a);
}

// ------------------------------------------------------------------ date ranges
export type RangePreset = "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "this_year" | "custom";

export const RANGE_PRESETS: Array<{ value: RangePreset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom" },
];

export interface DateRange { from: ISODate; to: ISODate; preset: RangePreset; label: string }

export function resolveRange(preset: RangePreset, today: ISODate, weekStartsOn = 1, custom?: { from?: string; to?: string }): DateRange {
  const t = fromISODate(today);
  const wso = weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  switch (preset) {
    case "today": return { from: today, to: today, preset, label: "Today" };
    case "yesterday": { const y = toISODate(subDays(t, 1)); return { from: y, to: y, preset, label: "Yesterday" }; }
    case "this_week": return { from: toISODate(startOfWeek(t, { weekStartsOn: wso })), to: today, preset, label: "This Week" };
    case "last_week": { const s = subDays(startOfWeek(t, { weekStartsOn: wso }), 7); return { from: toISODate(s), to: toISODate(endOfWeek(s, { weekStartsOn: wso })), preset, label: "Last Week" }; }
    case "this_month": return { from: toISODate(startOfMonth(t)), to: today, preset, label: "This Month" };
    case "last_month": { const s = startOfMonth(subDays(startOfMonth(t), 1)); return { from: toISODate(s), to: toISODate(endOfMonth(s)), preset, label: "Last Month" }; }
    case "this_year": return { from: `${today.slice(0, 4)}-01-01`, to: today, preset, label: "This Year" };
    case "custom": {
      const from = custom?.from && /^\d{4}-\d{2}-\d{2}$/.test(custom.from) ? custom.from : toISODate(startOfMonth(t));
      const to = custom?.to && /^\d{4}-\d{2}-\d{2}$/.test(custom.to) ? custom.to : today;
      return { from: from <= to ? from : to, to: from <= to ? to : from, preset, label: "Custom" };
    }
  }
}

/** The equivalent previous period (same length, immediately before). */
export function previousRange(r: { from: ISODate; to: ISODate }): { from: ISODate; to: ISODate } {
  const days = Math.round((fromISODate(r.to).getTime() - fromISODate(r.from).getTime()) / 86400000) + 1;
  return { from: addISODays(r.from, -days), to: addISODays(r.from, -1) };
}

export function daysInRange(r: { from: ISODate; to: ISODate }): ISODate[] {
  const out: ISODate[] = [];
  let d = r.from;
  while (d <= r.to) { out.push(d); d = addISODays(d, 1); }
  return out;
}

export function monthRange(yyyymm: string): { from: ISODate; to: ISODate } {
  const s = startOfMonth(fromISODate(`${yyyymm}-01`));
  return { from: toISODate(s), to: toISODate(endOfMonth(s)) };
}

/** Weeks intersecting a range, clipped to it (so the month total equals the sum of its weeks). */
export function weeksInRange(r: { from: ISODate; to: ISODate }, weekStartsOn = 1): Array<{ index: number; from: ISODate; to: ISODate; label: string }> {
  const wso = weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const weeks: Array<{ index: number; from: ISODate; to: ISODate; label: string }> = [];
  let start = r.from;
  let i = 1;
  while (start <= r.to) {
    const end = toISODate(endOfWeek(fromISODate(start), { weekStartsOn: wso }));
    const to = end < r.to ? end : r.to;
    weeks.push({ index: i, from: start, to, label: `Week ${i}` });
    start = addISODays(to, 1);
    i++;
  }
  return weeks;
}

export function shortRangeLabel(r: { from: ISODate; to: ISODate }): string {
  if (r.from === r.to) return format(fromISODate(r.from), "MMM d");
  return `${format(fromISODate(r.from), "MMM d")} – ${format(fromISODate(r.to), "MMM d")}`;
}

export const COMMON_TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Phoenix", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu", "America/Toronto", "America/Vancouver", "America/Mexico_City",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney",
];
