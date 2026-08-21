import { NextResponse, type NextRequest } from "next/server";
import { sql, sqlOne } from "@/lib/db";

/**
 * Scheduled maintenance. Wire this to a Vercel Cron entry (see vercel.json).
 *
 *   - closes an expired board round and opens the next one
 *   - rebuilds the day's Spot schedule
 *   - resyncs the Bar so exhausted links are replaced by queued ones
 *   - releases creator earnings that have cleared the fraud hold
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const round = await sqlOne<{ id: string; ends_at: string }>(
    `select id, ends_at from daily_rounds where status = 'active'`,
  );

  let rolled = false;
  if (!round || new Date(round.ends_at) <= new Date()) {
    await sql(`select close_round_and_open_next()`);
    rolled = true;
  }

  const scheduled = await sqlOne<{ schedule_spot_day: number }>(`select schedule_spot_day()`);
  await sql(`select bar_sync()`);

  const released = await sql<{ id: string }>(
    `update creator_earnings set status = 'available'
      where status = 'pending' and available_at <= now()
      returning id`,
  );

  return NextResponse.json({
    ok: true,
    roundRolled: rolled,
    spotSlotsScheduled: scheduled?.schedule_spot_day ?? 0,
    earningsReleased: released.length,
  });
}
