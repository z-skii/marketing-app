import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { callbackBase, consumeState } from "@/lib/oauth/state";
import { metaConfigured, metaRedirectUri } from "@/lib/social/meta";
import { connectInstagramViaApi, setInstagramUserError } from "@/lib/v2/instagram";
import { safeReturnPath } from "@/lib/v2/paths";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ME = "/me/instagram";

/** Meta sends the person back here; social_accounts gets the real account. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const state = await consumeState(params.get("state") ?? "");
  const returnTo = safeReturnPath(state?.returnTo);
  const base = returnTo ? `${ME}?return=${encodeURIComponent(returnTo)}` : ME;
  const fail = (code: string) => NextResponse.redirect(new URL(`${base}${base.includes("?") ? "&" : "?"}error=${encodeURIComponent(code)}`, request.url));

  if (!state || state.provider !== "instagram_user") return fail("state");
  const user = await getCurrentUser();
  if (!user || user.id !== state.profileId) return fail("session");

  const denied = params.get("error");
  if (denied) {
    await setInstagramUserError(user.id, `Meta returned: ${params.get("error_description") ?? denied}`);
    return fail(denied === "access_denied" ? "denied" : "meta");
  }
  const code = params.get("code");
  if (!code) return fail("code");
  if (!metaConfigured()) return fail("not_configured");

  try {
    const redirectUri = metaRedirectUri(callbackBase(request.url, "META_REDIRECT_BASE"), "instagram-user");
    await connectInstagramViaApi(user.id, code, redirectUri);
    return NextResponse.redirect(new URL(returnTo ?? `${ME}?connected=1`, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Instagram connection failed.";
    console.error("instagram user oauth callback:", error);
    await setInstagramUserError(user.id, message);
    return fail("meta");
  }
}
