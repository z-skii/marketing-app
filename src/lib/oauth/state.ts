import "server-only";
import { randomBytes } from "node:crypto";
import { sql, sqlOne } from "@/lib/db";

/**
 * Short-lived OAuth state. A row ties the callback back to the person (and
 * business) that started the flow, so a provider redirect can never attach
 * tokens to somebody else's account. States are single use and expire 15
 * minutes after they were created.
 */

export const OAUTH_STATE_TTL_MS = 15 * 60 * 1000;

export type OAuthProvider = "google_business" | "instagram" | "instagram_user";

export type OAuthState = {
  state: string;
  provider: OAuthProvider;
  profileId: string;
  businessId: string | null;
  returnTo: string | null;
  createdAt: string;
};

export async function createState(input: {
  provider: OAuthProvider;
  profileId: string;
  businessId?: string | null;
  returnTo?: string | null;
}): Promise<string> {
  const state = randomBytes(32).toString("base64url");
  await sql(
    `insert into oauth_states (state, provider, profile_id, business_id, return_to)
     values ($1, $2, $3, $4, $5)`,
    [state, input.provider, input.profileId, input.businessId ?? null, input.returnTo ?? null],
  );
  return state;
}

/**
 * Read and delete a state in one go. Returns null when it does not exist,
 * was already used, or is older than 15 minutes (expired rows are deleted
 * as they are met, so the table never needs a sweeper).
 */
export async function consumeState(state: string, now = new Date()): Promise<OAuthState | null> {
  if (!state || state.length > 200) return null;
  const row = await sqlOne<{
    state: string; provider: OAuthProvider; profile_id: string; business_id: string | null;
    return_to: string | null; created_at: string;
  }>(
    `delete from oauth_states where state = $1
     returning state, provider, profile_id, business_id, return_to, created_at`,
    [state],
  );
  if (!row) return null;
  const created = new Date(row.created_at).getTime();
  if (!Number.isFinite(created) || now.getTime() - created > OAUTH_STATE_TTL_MS) return null;
  return {
    state: row.state,
    provider: row.provider,
    profileId: row.profile_id,
    businessId: row.business_id,
    returnTo: row.return_to,
    createdAt: row.created_at,
  };
}

/**
 * The origin used to build provider callback URLs. GOOGLE_REDIRECT_BASE (or
 * META_REDIRECT_BASE) wins, then NEXT_PUBLIC_SITE_URL, then the origin of the
 * request that started the flow. The same rule runs at start and at callback
 * so both sides agree on the redirect URI.
 */
export function callbackBase(requestUrl: string | URL, envKey: "GOOGLE_REDIRECT_BASE" | "META_REDIRECT_BASE" = "GOOGLE_REDIRECT_BASE"): string {
  const fromEnv = process.env[envKey]?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const url = typeof requestUrl === "string" ? new URL(requestUrl) : requestUrl;
  return url.origin;
}

/** fetch with a hard timeout, so a slow provider never hangs a request. */
export async function fetchWithTimeout(input: string | URL, init: RequestInit = {}, timeoutMs = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Parse a JSON body without throwing; non-JSON bodies become {}. */
export async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const json = (await response.json()) as unknown;
    return json && typeof json === "object" ? (json as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
