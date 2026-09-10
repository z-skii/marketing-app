import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { callbackBase, consumeState } from "@/lib/oauth/state";
import { metaConfigured, metaRedirectUri } from "@/lib/social/meta";
import { connectInstagramBusiness, setInstagramError } from "@/lib/social/instagram-business";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CONNECTIONS = "/business/settings/connections";

/** Meta sends the business back here; the account, avatar, followers and media are stored. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fail = (code: string) => NextResponse.redirect(new URL(`${CONNECTIONS}?error=${encodeURIComponent(code)}&provider=instagram`, request.url));

  const state = await consumeState(params.get("state") ?? "");
  if (!state || state.provider !== "instagram" || !state.businessId) return fail("state");
  const user = await getCurrentUser();
  if (!user || user.id !== state.profileId) return fail("session");
  const businessId = state.businessId;

  const denied = params.get("error");
  if (denied) {
    await setInstagramError(businessId, `Meta returned: ${params.get("error_description") ?? denied}`);
    return fail(denied === "access_denied" ? "denied" : "meta");
  }
  const code = params.get("code");
  if (!code) return fail("code");
  if (!metaConfigured()) return fail("not_configured");

  try {
    const redirectUri = metaRedirectUri(callbackBase(request.url, "META_REDIRECT_BASE"), "instagram");
    await connectInstagramBusiness(businessId, code, redirectUri);
    return NextResponse.redirect(new URL(`${CONNECTIONS}?connected=instagram`, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram connection failed.";
    console.error("instagram oauth callback:", error);
    await setInstagramError(businessId, message);
    return fail("meta");
  }
}
