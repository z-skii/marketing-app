/**
 * Calendar arithmetic shared by the Content screens. Day keys are
 * "YYYY-MM-DD" in the business's time zone, so a post scheduled at 11:00
 * local lands on the right square whatever the viewer's clock says.
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

/** "September 2026" for a "YYYY-MM" month key. */
export function monthLabel(month: string): string {
  const d = new Date(`${month}-01T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" }).format(d);
}

/** Whole days from one day key to another; negative when `to` is earlier. */
export function daysBetween(fromKey: string, toKey: string): number {
  const a = Date.UTC(Number(fromKey.slice(0, 4)), Number(fromKey.slice(5, 7)) - 1, Number(fromKey.slice(8, 10)));
  const b = Date.UTC(Number(toKey.slice(0, 4)), Number(toKey.slice(5, 7)) - 1, Number(toKey.slice(8, 10)));
  return Math.round((b - a) / 86_400_000);
}

export type GridCell = { key: string; day: number } | null;

/** The month as rows of seven, Monday first, padded with nulls. */
export function monthGrid(month: string): GridCell[] {
  const year = Number(month.slice(0, 4));
  const mon = Number(month.slice(5, 7));
  const first = new Date(Date.UTC(year, mon - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const last = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const cells: GridCell[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= last; day++) {
    cells.push({ key: `${month}-${String(day).padStart(2, "0")}`, day });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** The instant a post is planned for, if any. */
export function postWhen(post: { scheduled_for: string | null; recommended_time: string | null }): string | null {
  return post.scheduled_for ?? post.recommended_time;
}

export const FORMAT_LABEL: Record<string, string> = { reel: "Reel", photo: "Photo", story: "Story", post: "Post" };
