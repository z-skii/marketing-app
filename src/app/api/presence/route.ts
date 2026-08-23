import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureVisitorId } from "@/lib/visitor";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Presence heartbeat. The browser pings this once a minute while the tab is
 * visible; each ping upserts one row keyed by the same anonymous first-party
 * visitor id the click pipeline uses. All-time visitors is the row count,
 * live-now is rows seen within the last five minutes. No IPs, no fingerprints,
 * and a visitor who closes the page simply ages out of the live window.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const visitorId = await ensureVisitorId();
  // A well-behaved client pings about once a minute; anything faster is noise.
  if (!rateLimit(`presence:${visitorId}`, 6, 60_000)) {
    return new NextResponse(null, { status: 204 });
  }
  try {
    await sql(`select visitor_seen($1)`, [visitorId]);
  } catch {
    // Presence must never break the page, even mid-migration.
  }
  return new NextResponse(null, { status: 204 });
}
