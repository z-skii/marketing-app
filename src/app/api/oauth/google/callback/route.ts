import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { callbackBase, consumeState } from "@/lib/oauth/state";
import {
  exchangeCode, googleConfigured, googleRedirectUri, listAccountsAndLocations, selectGoogleLocation, setGoogleError, storeGoogleTokens,
} from "@/lib/google/oauth";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CONNECTIONS = "/business/settings/connections";
const PICKER = "/business/settings/connections/google";

/**
 * Google sends the person back here. The state row proves who started the
 * flow and for which business; the code becomes tokens; the row is stored
 * as 'pending' with the locations Google lists, and the person picks one
 * (or the only one is picked for them). Any failure marks the row 'error'
 * with the reason and sends the person back with ?error=.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fail = (code: string) => NextResponse.redirect(new URL(`${CONNECTIONS}?error=${encodeURIComponent(code)}&provider=google`, request.url));

  const state = await consumeState(params.get("state") ?? "");
  if (!state || state.provider !== "google_business" || !state.businessId) return fail("state");
  const user = await getCurrentUser();
  if (!user || user.id !== state.profileId) return fail("session");
  const businessId = state.businessId;

  const denied = params.get("error");
  if (denied) {
    await setGoogleError(businessId, `Google returned: ${denied}`);
    return fail(denied === "access_denied" ? "denied" : "google");
  }
  const code = params.get("code");
  if (!code) return fail("code");
  if (!googleConfigured()) return fail("not_configured");

  try {
    const redirectUri = googleRedirectUri(callbackBase(request.url, "GOOGLE_REDIRECT_BASE"));
    const tokens = await exchangeCode(code, redirectUri);
    await storeGoogleTokens(businessId, tokens, []);
    const { locations } = await listAccountsAndLocations(tokens.access_token);
    await sql(
      `update connected_accounts set meta = jsonb_build_object('locations', $2::jsonb), updated_at = now()
        where business_id = $1 and provider = 'google_business'`,
      [businessId, JSON.stringify(locations)],
    );
    if (locations.length === 0) {
      await setGoogleError(businessId, "This Google account manages no Business Profile locations.");
      return fail("no_locations");
    }
    if (locations.length === 1) {
      await selectGoogleLocation(businessId, locations[0].name);
      return NextResponse.redirect(new URL("/business/google?connected=1", request.url));
    }
    return NextResponse.redirect(new URL(PICKER, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google connection failed.";
    console.error("google oauth callback:", error);
    await setGoogleError(businessId, message);
    return fail("google");
  }
}
