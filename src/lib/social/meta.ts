import "server-only";
import { fetchWithTimeout, readJson } from "@/lib/oauth/state";

/**
 * Meta (Facebook Login for Business) helpers shared by the business
 * Instagram connection and a person's own Instagram. Every call is a real
 * Graph API request with a timeout. Credentials: META_APP_ID and
 * META_APP_SECRET; without them `metaConfigured` is false and the UI says so.
 */

export const META_VERSION = "v19.0";
export const META_DIALOG_URL = `https://www.facebook.com/${META_VERSION}/dialog/oauth`;
export const META_GRAPH_URL = `https://graph.facebook.com/${META_VERSION}`;
export const META_SCOPES = ["instagram_basic", "instagram_manage_insights", "pages_show_list", "pages_read_engagement"];

export const META_NOT_CONFIGURED = "TapMart's Instagram connection is not configured yet. Ask support to enable it.";

const TIMEOUT_MS = 10_000;

export function metaConfigured(): boolean {
  return Boolean(process.env.META_APP_ID?.trim() && process.env.META_APP_SECRET?.trim());
}

function appId(): string {
  const id = process.env.META_APP_ID?.trim();
  if (!id) throw new Error(META_NOT_CONFIGURED);
  return id;
}

function appSecret(): string {
  const secret = process.env.META_APP_SECRET?.trim();
  if (!secret) throw new Error(META_NOT_CONFIGURED);
  return secret;
}

export function metaRedirectUri(base: string, kind: "instagram" | "instagram-user"): string {
  return `${base.replace(/\/+$/, "")}/api/oauth/${kind}/callback`;
}

export function metaAuthUrl(state: string, redirectUri: string): string {
  const url = new URL(META_DIALOG_URL);
  url.searchParams.set("client_id", appId());
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_SCOPES.join(","));
  return url.toString();
}

export class MetaApiError extends Error {
  status: number;
  code: number | null;
  constructor(status: number, message: string, code: number | null = null) {
    super(message);
    this.name = "MetaApiError";
    this.status = status;
    this.code = code;
  }
}

export async function graphGet(path: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const url = new URL(`${META_GRAPH_URL}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const response = await fetchWithTimeout(url, {}, TIMEOUT_MS);
  const json = await readJson(response);
  if (!response.ok) {
    const err = json.error as { message?: string; code?: number } | undefined;
    throw new MetaApiError(response.status, err?.message ?? `Meta Graph API HTTP ${response.status}`, err?.code ?? null);
  }
  return json;
}

export type MetaTokens = { access_token: string; expires_at: string | null };

function tokensFrom(json: Record<string, unknown>, now: Date): MetaTokens {
  const token = typeof json.access_token === "string" ? json.access_token : "";
  if (!token) throw new Error("Meta did not return an access token.");
  const expiresIn = Number(json.expires_in);
  return {
    access_token: token,
    expires_at: Number.isFinite(expiresIn) && expiresIn > 0 ? new Date(now.getTime() + expiresIn * 1000).toISOString() : null,
  };
}

/** Code to short-lived user token. */
export async function exchangeMetaCode(code: string, redirectUri: string, now = new Date()): Promise<MetaTokens> {
  const json = await graphGet("oauth/access_token", {
    client_id: appId(), client_secret: appSecret(), redirect_uri: redirectUri, code,
  });
  return tokensFrom(json, now);
}

/** Short-lived token to a long-lived one (about 60 days). */
export async function exchangeLongLivedToken(shortToken: string, now = new Date()): Promise<MetaTokens> {
  const json = await graphGet("oauth/access_token", {
    grant_type: "fb_exchange_token", client_id: appId(), client_secret: appSecret(), fb_exchange_token: shortToken,
  });
  return tokensFrom(json, now);
}

export type MetaPage = { id: string; name: string; access_token: string | null; instagram_business_account: string | null };

/** The Pages the person manages, with the Instagram account tied to each. */
export async function listPages(userToken: string): Promise<MetaPage[]> {
  const json = await graphGet("me/accounts", { fields: "id,name,access_token,instagram_business_account", access_token: userToken, limit: "50" });
  const data = Array.isArray(json.data) ? (json.data as Record<string, unknown>[]) : [];
  return data
    .filter((p) => typeof p.id === "string")
    .map((p) => ({
      id: p.id as string,
      name: typeof p.name === "string" ? p.name : "",
      access_token: typeof p.access_token === "string" ? p.access_token : null,
      instagram_business_account: (p.instagram_business_account as { id?: string } | undefined)?.id ?? null,
    }));
}

export type InstagramProfile = {
  id: string;
  username: string;
  profile_picture_url: string | null;
  followers_count: number | null;
  media_count: number | null;
};

export type InstagramMedia = {
  id: string;
  media_type: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  permalink: string | null;
  caption: string | null;
  timestamp: string | null;
  like_count: number | null;
  comments_count: number | null;
};

export async function fetchInstagramProfile(igUserId: string, token: string): Promise<InstagramProfile> {
  const json = await graphGet(igUserId, { fields: "id,username,profile_picture_url,followers_count,media_count", access_token: token });
  if (typeof json.username !== "string") throw new Error("Instagram did not return a username.");
  return {
    id: String(json.id ?? igUserId),
    username: json.username,
    profile_picture_url: typeof json.profile_picture_url === "string" ? json.profile_picture_url : null,
    followers_count: typeof json.followers_count === "number" ? json.followers_count : null,
    media_count: typeof json.media_count === "number" ? json.media_count : null,
  };
}

export async function fetchInstagramMedia(igUserId: string, token: string, limit = 12): Promise<InstagramMedia[]> {
  const json = await graphGet(`${igUserId}/media`, {
    fields: "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count",
    limit: String(limit), access_token: token,
  });
  const data = Array.isArray(json.data) ? (json.data as Record<string, unknown>[]) : [];
  return data
    .filter((m) => typeof m.id === "string")
    .map((m) => ({
      id: m.id as string,
      media_type: typeof m.media_type === "string" ? m.media_type : null,
      media_url: typeof m.media_url === "string" ? m.media_url : null,
      thumbnail_url: typeof m.thumbnail_url === "string" ? m.thumbnail_url : null,
      permalink: typeof m.permalink === "string" ? m.permalink : null,
      caption: typeof m.caption === "string" ? m.caption : null,
      timestamp: typeof m.timestamp === "string" ? m.timestamp : null,
      like_count: typeof m.like_count === "number" ? m.like_count : null,
      comments_count: typeof m.comments_count === "number" ? m.comments_count : null,
    }));
}

/**
 * The whole login: code to long-lived token, Pages, the first Page with an
 * Instagram business account, then that account's profile and media.
 */
export async function completeInstagramLogin(code: string, redirectUri: string, now = new Date()): Promise<{
  tokens: MetaTokens; page: MetaPage; profile: InstagramProfile; media: InstagramMedia[];
}> {
  const short = await exchangeMetaCode(code, redirectUri, now);
  let tokens = short;
  try {
    tokens = await exchangeLongLivedToken(short.access_token, now);
  } catch (error) {
    console.error("meta: long-lived token exchange failed, keeping the short-lived token:", error);
  }
  const pages = await listPages(tokens.access_token);
  const page = pages.find((p) => p.instagram_business_account);
  if (!page || !page.instagram_business_account) {
    throw new Error("None of your Facebook Pages has an Instagram business or creator account linked. Link one in Instagram settings, then try again.");
  }
  const token = page.access_token ?? tokens.access_token;
  const [profile, media] = await Promise.all([
    fetchInstagramProfile(page.instagram_business_account, token),
    fetchInstagramMedia(page.instagram_business_account, token, 12),
  ]);
  return { tokens: { access_token: token, expires_at: tokens.expires_at }, page, profile, media };
}
