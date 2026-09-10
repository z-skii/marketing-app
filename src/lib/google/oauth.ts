import "server-only";
import { sql, sqlOne } from "@/lib/db";
import { fetchWithTimeout, readJson } from "@/lib/oauth/state";

/**
 * Google Business Profile: OAuth, tokens and the raw API calls.
 *
 * Nothing here invents data. Every function talks to Google or to the
 * connected_accounts row for provider 'google_business'; when credentials
 * are missing (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) `googleConfigured`
 * is false and the UI says so. The pipeline is complete, so it works the
 * moment the env vars exist.
 *
 * Endpoints (all official):
 *   token          https://oauth2.googleapis.com/token
 *   accounts       https://mybusinessaccountmanagement.googleapis.com/v1/accounts
 *   locations      https://mybusinessbusinessinformation.googleapis.com/v1/{account}/locations
 *   location       https://mybusinessbusinessinformation.googleapis.com/v1/{location}
 *   reviews        https://mybusiness.googleapis.com/v4/{account}/{location}/reviews
 *   media          https://mybusiness.googleapis.com/v4/{account}/{location}/media
 */

export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/business.manage";
export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_ACCOUNTS_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
export const GOOGLE_INFO_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
export const GOOGLE_V4_API = "https://mybusiness.googleapis.com/v4";

export const LOCATION_LIST_READ_MASK = "name,title,storefrontAddress,phoneNumbers,websiteUri,regularHours,categories,profile,metadata";
export const LOCATION_READ_MASK =
  "name,title,categories,storefrontAddress,phoneNumbers,websiteUri,regularHours,specialHours,profile,metadata,openInfo";

const TOKEN_TIMEOUT_MS = 10_000;
const API_TIMEOUT_MS = 12_000;

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

export const GOOGLE_NOT_CONFIGURED = "TapMart's Google connection is not configured yet. Ask support to enable it.";

function clientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!id) throw new Error(GOOGLE_NOT_CONFIGURED);
  return id;
}

function clientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!secret) throw new Error(GOOGLE_NOT_CONFIGURED);
  return secret;
}

export function googleRedirectUri(base: string): string {
  return `${base.replace(/\/+$/, "")}/api/oauth/google/callback`;
}

// ------------------------------------------------------------------- OAuth

export function googleAuthUrl(state: string, redirectUri: string): string {
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", clientId());
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

export type GoogleTokens = {
  access_token: string;
  refresh_token: string | null;
  /** Absolute ISO time the access token stops working. */
  expires_at: string;
  scope: string | null;
};

function tokensFrom(json: Record<string, unknown>, fallbackRefresh: string | null, now: Date): GoogleTokens {
  const access = typeof json.access_token === "string" ? json.access_token : "";
  if (!access) throw new Error("Google did not return an access token.");
  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : Number(json.expires_in ?? 3600);
  const seconds = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600;
  return {
    access_token: access,
    refresh_token: typeof json.refresh_token === "string" && json.refresh_token ? json.refresh_token : fallbackRefresh,
    expires_at: new Date(now.getTime() + seconds * 1000).toISOString(),
    scope: typeof json.scope === "string" ? json.scope : null,
  };
}

async function tokenRequest(body: Record<string, string>): Promise<Record<string, unknown>> {
  const response = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  }, TOKEN_TIMEOUT_MS);
  const json = await readJson(response);
  if (!response.ok) {
    const detail = typeof json.error_description === "string" ? json.error_description
      : typeof json.error === "string" ? json.error : `HTTP ${response.status}`;
    throw new Error(`Google token request failed: ${detail}`);
  }
  return json;
}

/** Trade the callback code for tokens. 10 second timeout. */
export async function exchangeCode(code: string, redirectUri: string, now = new Date()): Promise<GoogleTokens> {
  const json = await tokenRequest({
    code,
    client_id: clientId(),
    client_secret: clientSecret(),
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  return tokensFrom(json, null, now);
}

export async function refreshAccessToken(refreshToken: string, now = new Date()): Promise<GoogleTokens> {
  const json = await tokenRequest({
    refresh_token: refreshToken,
    client_id: clientId(),
    client_secret: clientSecret(),
    grant_type: "refresh_token",
  });
  return tokensFrom(json, refreshToken, now);
}

// ------------------------------------------------------------- API calls

export class GoogleApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "GoogleApiError";
    this.status = status;
  }
}

async function apiRequest(accessToken: string, url: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const response = await fetchWithTimeout(url, {
    ...init,
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json", ...(init.headers ?? {}) },
  }, API_TIMEOUT_MS);
  const json = await readJson(response);
  if (!response.ok) {
    const err = json.error as { message?: string; status?: string } | undefined;
    throw new GoogleApiError(response.status, err?.message ?? `Google API HTTP ${response.status}`);
  }
  return json;
}

export type GoogleAccount = { name: string; accountName: string | null; type: string | null };

export type GoogleLocationSummary = {
  /** "locations/123" */
  name: string;
  /** "accounts/456" */
  account: string;
  title: string;
  address: string | null;
};

export type GoogleTime = { hours?: number; minutes?: number };
export type GoogleHoursPeriod = { openDay?: string; openTime?: GoogleTime; closeDay?: string; closeTime?: GoogleTime };

/** The location resource, only the fields the read mask asks for. */
export type GoogleLocation = {
  name: string;
  title?: string;
  categories?: { primaryCategory?: { displayName?: string; name?: string }; additionalCategories?: { displayName?: string }[] };
  storefrontAddress?: { addressLines?: string[]; locality?: string; administrativeArea?: string; postalCode?: string; regionCode?: string };
  phoneNumbers?: { primaryPhone?: string; additionalPhones?: string[] };
  websiteUri?: string;
  regularHours?: { periods?: GoogleHoursPeriod[] };
  specialHours?: { specialHourPeriods?: unknown[] };
  profile?: { description?: string };
  metadata?: { mapsUri?: string; newReviewUri?: string; placeId?: string; canModifyServiceList?: boolean };
  openInfo?: { status?: string };
};

export function formatAddress(a: GoogleLocation["storefrontAddress"] | undefined): string | null {
  if (!a) return null;
  const parts = [...(a.addressLines ?? []), a.locality, a.administrativeArea, a.postalCode].filter((p) => typeof p === "string" && p.trim());
  return parts.length ? parts.join(", ") : null;
}

export async function listAccounts(accessToken: string): Promise<GoogleAccount[]> {
  const json = await apiRequest(accessToken, `${GOOGLE_ACCOUNTS_API}/accounts`);
  const accounts = Array.isArray(json.accounts) ? (json.accounts as Record<string, unknown>[]) : [];
  return accounts
    .filter((a) => typeof a.name === "string")
    .map((a) => ({
      name: a.name as string,
      accountName: typeof a.accountName === "string" ? a.accountName : null,
      type: typeof a.type === "string" ? a.type : null,
    }));
}

export async function listLocations(accessToken: string, account: string): Promise<GoogleLocationSummary[]> {
  const url = new URL(`${GOOGLE_INFO_API}/${account}/locations`);
  url.searchParams.set("readMask", LOCATION_LIST_READ_MASK);
  url.searchParams.set("pageSize", "100");
  const json = await apiRequest(accessToken, url.toString());
  const locations = Array.isArray(json.locations) ? (json.locations as GoogleLocation[]) : [];
  return locations
    .filter((l) => typeof l.name === "string")
    .map((l) => ({ name: l.name, account, title: l.title?.trim() || "Untitled location", address: formatAddress(l.storefrontAddress) }));
}

/** Every location across every account the person can manage. */
export async function listAccountsAndLocations(accessToken: string): Promise<{ accounts: GoogleAccount[]; locations: GoogleLocationSummary[] }> {
  const accounts = await listAccounts(accessToken);
  const locations: GoogleLocationSummary[] = [];
  for (const account of accounts) {
    try {
      locations.push(...(await listLocations(accessToken, account.name)));
    } catch (error) {
      // One account without locations (or without the right permission) must not hide the others.
      console.error(`google: could not list locations for ${account.name}:`, error);
    }
  }
  return { accounts, locations };
}

export async function fetchLocation(accessToken: string, locationName: string): Promise<GoogleLocation> {
  const url = new URL(`${GOOGLE_INFO_API}/${locationName}`);
  url.searchParams.set("readMask", LOCATION_READ_MASK);
  const json = await apiRequest(accessToken, url.toString());
  if (typeof json.name !== "string") throw new Error("Google returned a location without a name.");
  return json as unknown as GoogleLocation;
}

export type GoogleReview = {
  id: string;
  name: string;
  reviewer: string | null;
  rating: number | null;
  text: string | null;
  createTime: string | null;
  replied: boolean;
};

export type GoogleReviews = {
  total: number | null;
  average: number | null;
  reviews: GoogleReview[];
};

const STAR: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

/**
 * Reviews for a location. The v4 reviews endpoint is not open to every
 * project; a 403 or 404 returns null with the reason instead of throwing.
 */
export async function listReviews(accessToken: string, account: string, locationName: string): Promise<{ data: GoogleReviews | null; reason: string | null }> {
  try {
    const url = new URL(`${GOOGLE_V4_API}/${account}/${locationName}/reviews`);
    url.searchParams.set("pageSize", "50");
    url.searchParams.set("orderBy", "updateTime desc");
    const json = await apiRequest(accessToken, url.toString());
    const raw = Array.isArray(json.reviews) ? (json.reviews as Record<string, unknown>[]) : [];
    const reviews: GoogleReview[] = raw.map((r) => {
      const reviewer = r.reviewer as { displayName?: string } | undefined;
      return {
        id: typeof r.reviewId === "string" ? r.reviewId : String(r.name ?? ""),
        name: typeof r.name === "string" ? r.name : "",
        reviewer: reviewer?.displayName ?? null,
        rating: typeof r.starRating === "string" ? STAR[r.starRating] ?? null : null,
        text: typeof r.comment === "string" ? r.comment : null,
        createTime: typeof r.createTime === "string" ? r.createTime : null,
        replied: Boolean(r.reviewReply && typeof r.reviewReply === "object"),
      };
    });
    const total = typeof json.totalReviewCount === "number" ? json.totalReviewCount : reviews.length;
    const average = typeof json.averageRating === "number" ? json.averageRating : null;
    return { data: { total, average, reviews }, reason: null };
  } catch (error) {
    if (error instanceof GoogleApiError && (error.status === 403 || error.status === 404)) {
      return { data: null, reason: `Google did not allow reading reviews for this location (HTTP ${error.status}).` };
    }
    throw error;
  }
}

export type GoogleMediaSummary = { count: number; latestCreateTime: string | null };

/** Photo count and the newest photo's createTime. Tolerant of 403/404. */
export async function fetchMediaSummary(accessToken: string, account: string, locationName: string): Promise<{ data: GoogleMediaSummary | null; reason: string | null }> {
  try {
    const url = new URL(`${GOOGLE_V4_API}/${account}/${locationName}/media`);
    url.searchParams.set("pageSize", "100");
    const json = await apiRequest(accessToken, url.toString());
    const items = Array.isArray(json.mediaItems) ? (json.mediaItems as Record<string, unknown>[]) : [];
    const count = typeof json.totalMediaItemCount === "number" ? json.totalMediaItemCount : items.length;
    let latest: string | null = null;
    for (const item of items) {
      const t = typeof item.createTime === "string" ? item.createTime : null;
      if (t && (!latest || t > latest)) latest = t;
    }
    return { data: { count, latestCreateTime: latest }, reason: null };
  } catch (error) {
    if (error instanceof GoogleApiError && (error.status === 403 || error.status === 404)) {
      return { data: null, reason: `Google did not allow reading photos for this location (HTTP ${error.status}).` };
    }
    throw error;
  }
}

/** PATCH a location. `updateMask` is a comma separated list of field paths. */
export async function patchLocation(accessToken: string, locationName: string, updateMask: string, body: Partial<GoogleLocation>): Promise<GoogleLocation> {
  const url = new URL(`${GOOGLE_INFO_API}/${locationName}`);
  url.searchParams.set("updateMask", updateMask);
  const json = await apiRequest(accessToken, url.toString(), { method: "PATCH", body: JSON.stringify(body) });
  return json as unknown as GoogleLocation;
}

// ------------------------------------------------------ connection storage

export type GoogleConnectionRow = {
  status: "disconnected" | "pending" | "connected" | "error";
  source: "oauth" | "manual";
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  scope: string | null;
  external_name: string | null;
  meta: Record<string, unknown>;
  last_error: string | null;
  last_synced_at: string | null;
  connected_at: string | null;
};

export type GoogleMeta = {
  locations?: GoogleLocationSummary[];
  location?: { name: string; title: string; account: string; address?: string | null };
  profile?: unknown;
};

export async function getGoogleConnection(businessId: string): Promise<GoogleConnectionRow | null> {
  return sqlOne<GoogleConnectionRow>(
    `select status::text as status, source, access_token, refresh_token, token_expires_at, scope,
            external_name, meta, last_error, last_synced_at, connected_at
       from connected_accounts where business_id = $1 and provider = 'google_business'`,
    [businessId],
  );
}

/** After the callback: tokens plus the list of locations, status pending until one is picked. */
export async function storeGoogleTokens(businessId: string, tokens: GoogleTokens, locations: GoogleLocationSummary[]): Promise<void> {
  await sql(
    `insert into connected_accounts
       (business_id, provider, status, source, access_token, refresh_token, token_expires_at, scope, meta, last_error, updated_at)
     values ($1, 'google_business', 'pending', 'oauth', $2, $3, $4, $5, $6::jsonb, null, now())
     on conflict (business_id, provider) do update
       set status = 'pending', source = 'oauth', access_token = excluded.access_token,
           refresh_token = coalesce(excluded.refresh_token, connected_accounts.refresh_token),
           token_expires_at = excluded.token_expires_at, scope = excluded.scope,
           meta = excluded.meta, last_error = null, updated_at = now()`,
    [businessId, tokens.access_token, tokens.refresh_token, tokens.expires_at, tokens.scope, JSON.stringify({ locations })],
  );
}

export async function setGoogleError(businessId: string, message: string): Promise<void> {
  await sql(
    `insert into connected_accounts (business_id, provider, status, source, last_error, updated_at)
     values ($1, 'google_business', 'error', 'oauth', $2, now())
     on conflict (business_id, provider) do update
       set status = 'error', last_error = excluded.last_error, updated_at = now()`,
    [businessId, message.slice(0, 500)],
  );
}

/** The person picked a location: the connection is real from here on. */
export async function selectGoogleLocation(businessId: string, locationName: string): Promise<GoogleLocationSummary> {
  const row = await getGoogleConnection(businessId);
  if (!row || !row.access_token) throw new Error("Google is not connected. Start the connection again.");
  const locations = ((row.meta as GoogleMeta).locations ?? []) as GoogleLocationSummary[];
  const location = locations.find((l) => l.name === locationName);
  if (!location) throw new Error("That location is not in the list Google returned.");
  await sql(
    `update connected_accounts
        set status = 'connected', connected_at = coalesce(connected_at, now()), external_id = $3, external_name = $4,
            meta = (meta - 'profile') || jsonb_build_object('location', $5::jsonb), last_error = null, updated_at = now()
      where business_id = $1 and provider = $2`,
    [businessId, "google_business", location.name, location.title, JSON.stringify(location)],
  );
  return location;
}

/** Tokens gone, meta cleared, every stored check for this business deleted. */
export async function disconnectGoogle(businessId: string): Promise<void> {
  await sql(
    `update connected_accounts
        set status = 'disconnected', access_token = null, refresh_token = null, token_expires_at = null, scope = null,
            external_id = null, external_name = null, avatar_url = null, meta = '{}'::jsonb,
            last_error = null, last_synced_at = null, connected_at = null, updated_at = now()
      where business_id = $1 and provider = 'google_business'`,
    [businessId],
  );
  await sql(`delete from google_health_checks where business_id = $1`, [businessId]);
}

export const NEEDS_RECONNECT = "Needs reconnect";

/**
 * Run `fn` with a working access token. Refreshes when the stored token is
 * within a minute of expiry; a failed refresh marks the row 'error' with
 * last_error "Needs reconnect" so the UI can ask for a new sign in.
 */
export async function withGoogleToken<T>(businessId: string, fn: (accessToken: string, row: GoogleConnectionRow) => Promise<T>, now = new Date()): Promise<T> {
  const row = await getGoogleConnection(businessId);
  if (!row || !row.access_token || row.status === "disconnected") {
    throw new Error("Google is not connected.");
  }
  let token = row.access_token;
  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  if (!expiresAt || expiresAt - now.getTime() < 60_000) {
    if (!row.refresh_token) {
      await setGoogleError(businessId, NEEDS_RECONNECT);
      throw new Error(NEEDS_RECONNECT);
    }
    try {
      const fresh = await refreshAccessToken(row.refresh_token, now);
      token = fresh.access_token;
      await sql(
        `update connected_accounts
            set access_token = $2, token_expires_at = $3, refresh_token = coalesce($4, refresh_token), last_error = null, updated_at = now()
          where business_id = $1 and provider = 'google_business'`,
        [businessId, fresh.access_token, fresh.expires_at, fresh.refresh_token],
      );
    } catch (error) {
      console.error("google: token refresh failed:", error);
      await setGoogleError(businessId, NEEDS_RECONNECT);
      throw new Error(NEEDS_RECONNECT);
    }
  }
  try {
    return await fn(token, row);
  } catch (error) {
    if (error instanceof GoogleApiError && error.status === 401) {
      await setGoogleError(businessId, NEEDS_RECONNECT);
      throw new Error(NEEDS_RECONNECT);
    }
    throw error;
  }
}
