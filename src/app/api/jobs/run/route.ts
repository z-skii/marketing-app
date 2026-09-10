import { NextResponse, type NextRequest } from "next/server";
import { runDueJobs } from "@/lib/jobs";
import "@/lib/jobs/handlers";

/**
 * Background job worker. Vercel Cron hits this every five minutes (see
 * vercel.json); a reconstruction provider may also POST here as a callback
 * to make a pending poll run sooner. Same secret rules as /api/cron.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.nextUrl.searchParams.get("secret");
  return Boolean(secret) && provided === secret;
}

async function run(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runDueJobs(20);
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
