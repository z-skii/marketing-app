import { NextResponse, type NextRequest } from "next/server";
import { getV2Context, requireBusinessMember } from "@/lib/v2/core";
import { callbackBase, createState } from "@/lib/oauth/state";
import { metaAuthUrl, metaConfigured, metaRedirectUri } from "@/lib/social/meta";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CONNECTIONS = "/business/settings/connections";

/** Starts the business Instagram connection through Facebook Login for Business. */
export async function GET(request: NextRequest) {
  const ctx = await getV2Context();
  if (!ctx) return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(CONNECTIONS)}`, request.url));
  if (!ctx.activeBusiness) return NextResponse.redirect(new URL("/business", request.url));
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
  } catch {
    return NextResponse.redirect(new URL(`${CONNECTIONS}?error=not_allowed`, request.url));
  }
  if (!metaConfigured()) return NextResponse.redirect(new URL(`${CONNECTIONS}?error=not_configured&provider=instagram`, request.url));

  const state = await createState({ provider: "instagram", profileId: ctx.user.id, businessId: ctx.activeBusiness.id, returnTo: CONNECTIONS });
  const redirectUri = metaRedirectUri(callbackBase(request.url, "META_REDIRECT_BASE"), "instagram");
  return NextResponse.redirect(metaAuthUrl(state, redirectUri));
}
