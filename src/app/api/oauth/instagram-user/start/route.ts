import { NextResponse, type NextRequest } from "next/server";
import { getV2Context } from "@/lib/v2/core";
import { callbackBase, createState } from "@/lib/oauth/state";
import { metaAuthUrl, metaConfigured, metaRedirectUri } from "@/lib/social/meta";
import { safeReturnPath } from "@/lib/v2/paths";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ME = "/me/instagram";

/** Starts a person's own Instagram connection. ?return= is carried through the state row. */
export async function GET(request: NextRequest) {
  const ctx = await getV2Context();
  if (!ctx) return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(ME)}`, request.url));
  const returnTo = safeReturnPath(request.nextUrl.searchParams.get("return"));
  const back = returnTo ? `${ME}?return=${encodeURIComponent(returnTo)}` : ME;
  if (!metaConfigured()) return NextResponse.redirect(new URL(`${back}${back.includes("?") ? "&" : "?"}error=not_configured`, request.url));

  const state = await createState({ provider: "instagram_user", profileId: ctx.user.id, businessId: null, returnTo });
  const redirectUri = metaRedirectUri(callbackBase(request.url, "META_REDIRECT_BASE"), "instagram-user");
  return NextResponse.redirect(metaAuthUrl(state, redirectUri));
}
