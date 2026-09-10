import { NextResponse, type NextRequest } from "next/server";
import { getV2Context, requireBusinessMember } from "@/lib/v2/core";
import { callbackBase, createState } from "@/lib/oauth/state";
import { googleAuthUrl, googleConfigured, googleRedirectUri } from "@/lib/google/oauth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CONNECTIONS = "/business/settings/connections";

/**
 * Starts the Google Business Profile connection for the active business:
 * a signed-in owner or manager gets a fresh state row and is sent to
 * Google's consent screen. Without credentials the person is sent back
 * with ?error=not_configured and nothing is stored.
 */
export async function GET(request: NextRequest) {
  const ctx = await getV2Context();
  if (!ctx) return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(CONNECTIONS)}`, request.url));
  if (!ctx.activeBusiness) return NextResponse.redirect(new URL("/business", request.url));
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
  } catch {
    return NextResponse.redirect(new URL(`${CONNECTIONS}?error=not_allowed`, request.url));
  }
  if (!googleConfigured()) return NextResponse.redirect(new URL(`${CONNECTIONS}?error=not_configured&provider=google`, request.url));

  const state = await createState({ provider: "google_business", profileId: ctx.user.id, businessId: ctx.activeBusiness.id, returnTo: CONNECTIONS });
  const redirectUri = googleRedirectUri(callbackBase(request.url, "GOOGLE_REDIRECT_BASE"));
  return NextResponse.redirect(googleAuthUrl(state, redirectUri));
}
