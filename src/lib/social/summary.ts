import "server-only";
import { sql } from "@/lib/db";
import { getGrowthSummary, type GrowthSummary } from "@/lib/social/insights";

/**
 * Social in one glance: which platforms are connected and this period's
 * growth numbers. Connection status comes straight from connected_accounts;
 * a pending request counts as "none" (nothing is connected yet) but keeps
 * the handle when the provider already told us one.
 */

export type PlatformStatus = {
  provider: "instagram" | "facebook" | "tiktok";
  status: "connected" | "reconnect" | "none";
  handle: string | null;
};

export type SocialSummary = { platforms: PlatformStatus[]; growth: GrowthSummary };

export const SOCIAL_PLATFORMS: PlatformStatus["provider"][] = ["instagram", "facebook", "tiktok"];

export type ConnectionProvider = PlatformStatus["provider"] | "google_business";
export type ConnectionStatus = "disconnected" | "pending" | "connected" | "error";

export type ConnectionRow = {
  provider: ConnectionProvider;
  status: ConnectionStatus;
  external_name: string | null;
};

/** Every connected_accounts row for the business, as stored. */
export async function listConnections(businessId: string): Promise<ConnectionRow[]> {
  return sql<ConnectionRow>(
    `select provider, status::text as status, external_name
       from connected_accounts where business_id = $1`,
    [businessId],
  );
}

export function platformStatusFrom(provider: PlatformStatus["provider"], row: ConnectionRow | undefined): PlatformStatus {
  const status: PlatformStatus["status"] =
    row?.status === "connected" ? "connected" : row?.status === "error" ? "reconnect" : "none";
  const handle = row?.external_name?.trim() || null;
  return { provider, status, handle };
}

export async function getSocialSummary(businessId: string): Promise<SocialSummary> {
  const [rows, growth] = await Promise.all([listConnections(businessId), getGrowthSummary(businessId)]);
  const platforms = SOCIAL_PLATFORMS.map((p) => platformStatusFrom(p, rows.find((r) => r.provider === p)));
  return { platforms, growth };
}
