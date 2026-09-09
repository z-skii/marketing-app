import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

/**
 * Helpers for `<input type="datetime-local">` values interpreted in a store's IANA timezone.
 * The input value is wall-clock time ("2026-09-08T09:03") with no offset; we pin it to the store tz.
 */

/** UTC instant → "yyyy-MM-ddTHH:mm" in the given timezone (for datetime-local defaults). */
export function toDateTimeLocal(ts: string | Date | null | undefined, timezone: string): string {
  if (!ts) return "";
  const d = typeof ts === "string" ? new Date(ts) : ts;
  if (Number.isNaN(d.getTime())) return "";
  return format(new TZDate(d, timezone), "yyyy-MM-dd'T'HH:mm");
}

/** "yyyy-MM-ddTHH:mm" wall-clock time in the given timezone → ISO instant (UTC). Null when invalid. */
export function fromDateTimeLocal(value: string | null | undefined, timezone: string): string | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const tz = new TZDate(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), timezone);
  const t = tz.getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}
