import { NextResponse } from "next/server";
import { runDueJobs } from "@/lib/jobs";
import { devAuthEnabled } from "@/lib/supabase";
import "@/lib/jobs/handlers";

/**
 * DEVELOPMENT ONLY.
 *
 * Runs whatever jobs are due right now so the scan flow can be exercised
 * without a cron. Unreachable unless AUTH_DEV_MODE=true and the build is not
 * production.
 */

export const dynamic = "force-dynamic";

async function run() {
  if (!devAuthEnabled()) {
    return NextResponse.json({ error: "not available" }, { status: 404 });
  }
  const result = await runDueJobs(20);
  return NextResponse.json({ ok: true, ...result });
}

export async function GET() {
  return run();
}

export async function POST() {
  return run();
}
