import { NextResponse, type NextRequest } from "next/server";
import { sql, sqlOne } from "@/lib/db";
import { ensureVisitorId } from "@/lib/visitor";

/**
 * Creator share link.
 *
 * Opens a referral session for this visitor and forwards them to whatever the
 * creator shared. The creator is not paid for the visit itself — only for a
 * qualified outbound open that follows it, inside the attribution window.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ATTRIBUTION_DAYS = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const home = new URL("/", request.url);

  if (!/^[a-z0-9_-]{4,32}$/i.test(code)) {
    return NextResponse.redirect(home, 302);
  }

  const referral = await sqlOne<{
    id: string; creator_user_id: string; target_type: string; target_id: string | null;
  }>(
    `select r.id, r.creator_user_id, r.target_type, r.target_id
       from creator_referrals r
       join profiles p on p.id = r.creator_user_id
      where r.referral_code = $1 and p.creator_enabled and not p.suspended`,
    [code],
  );

  if (!referral) return NextResponse.redirect(home, 302);

  const visitorId = await ensureVisitorId();

  // Last touch wins, and the window restarts on each visit.
  await sql(
    `insert into creator_sessions (creator_user_id, referral_id, anonymous_visitor_id, expires_at)
     values ($1, $2, $3, now() + make_interval(days => $4))
     on conflict (anonymous_visitor_id) do update
       set creator_user_id = excluded.creator_user_id,
           referral_id     = excluded.referral_id,
           expires_at      = excluded.expires_at`,
    [referral.creator_user_id, referral.id, visitorId, ATTRIBUTION_DAYS],
  );

  const destination = await resolveTarget(referral.target_type, referral.target_id, request.url);
  const response = NextResponse.redirect(destination, 302);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

async function resolveTarget(type: string, id: string | null, base: string): Promise<URL> {
  if (type === "board") return new URL("/board", base);
  if (type === "spot") return new URL("/#spot-heading", base);
  if (type === "link" && id) {
    const link = await sqlOne<{ slug: string }>(`select slug from links where id = $1`, [id]);
    if (link) return new URL(`/l/${link.slug}`, base);
  }
  return new URL("/", base);
}
