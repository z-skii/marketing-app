import { NextResponse, type NextRequest } from "next/server";
import { sqlOne } from "@/lib/db";
import { ensureVisitorId, hashIp, requestIp } from "@/lib/visitor";
import { preQualify } from "@/lib/click-qualification";
import { getCurrentUser } from "@/lib/auth";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

/**
 * Tracked outbound open.
 *
 * Every paid placement leaves the site through here so the click can be
 * qualified and billed. The visitor is redirected immediately either way — an
 * unqualified click simply is not charged, it is never punished with a delay or
 * a dead end.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ClickResult = {
  qualified: boolean;
  rejection_reason: string | null;
  destination_url: string | null;
  debited_cents: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ placementId: string }> },
) {
  const { placementId } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(placementId)) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const headers = request.headers;
  const pre = preQualify({
    method: request.method,
    userAgent: headers.get("user-agent"),
    secPurpose: headers.get("sec-purpose"),
    purpose: headers.get("purpose"),
    mozPrefetch: headers.get("x-moz"),
    secFetchMode: headers.get("sec-fetch-mode"),
  });

  const visitorId = await ensureVisitorId();

  // Above human clicking speed the request still redirects, but is never billed.
  const withinLimit = rateLimit(`go:${visitorId}`, LIMITS.go.limit, LIMITS.go.windowMs);
  const rejection = pre.rejection ?? (withinLimit ? null : "rate_limited");

  const viewer = await getCurrentUser();

  // An in-window creator referral earns commission on this open.
  const referral = await sqlOne<{ creator_user_id: string; referral_id: string | null }>(
    `select creator_user_id, referral_id from creator_sessions
      where anonymous_visitor_id = $1 and expires_at > now()
      order by first_seen_at desc limit 1`,
    [visitorId],
  );

  const result = await sqlOne<ClickResult>(
    `select * from record_click($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      placementId,
      visitorId,
      hashIp(await requestIp()),
      headers.get("user-agent")?.slice(0, 400) ?? null,
      referral?.creator_user_id ?? null,
      referral?.referral_id ?? null,
      viewer?.id ?? null,
      rejection,
    ],
  );

  const destination = result?.destination_url;
  if (!destination) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  const response = NextResponse.redirect(destination, 302);
  // Outbound hops are never cached, at any layer.
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

/** Prefetchers and link previewers probe with HEAD. Answer without billing. */
export async function HEAD() {
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
