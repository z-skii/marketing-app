import "server-only";
import { sql } from "./db";

/**
 * Puts freshly funded placements on screen without waiting for the daily
 * cron: rebuilds the rest of today's Spot rotation and resyncs the Bar.
 * Both SQL functions are idempotent, so running them after an allocation is
 * safe. Failures are swallowed — the money is already applied, and the daily
 * cron remains the backstop.
 */
export async function refreshSurfaces(types: Iterable<string>): Promise<void> {
  const funded = new Set(types);
  try {
    if (funded.has("spot")) await sql(`select schedule_spot_day()`);
    if (funded.has("bar")) await sql(`select bar_sync()`);
  } catch {
    // Next cron pass catches up.
  }
}
