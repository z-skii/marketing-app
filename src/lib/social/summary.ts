import "server-only";
import { sql } from "@/lib/db";
import { getGrowthSummary, type GrowthSummary } from "@/lib/social/insights";

/**
 * Social in one glance: which platforms are connected and this period's
 * growth numbers. Connection status comes straight from connected_accounts;
 * a pending row is "connecting", never "connected", and a manual row never
 * counts as connected for anything that needs real data.
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

/** The five honest states every provider row maps onto. */
export type ConnectionState = "not_connected" | "connecting" | "connected" | "needs_reconnect" | "error";

export type ConnectionRow = {
  provider: ConnectionProvider;
  status: ConnectionStatus;
  source: "oauth" | "manual";
  external_id: string | null;
  external_name: string | null;
  avatar_url: string | null;
  meta: Record<string, unknown>;
  last_error: string | null;
  last_synced_at: string | null;
  connected_at: string | null;
};

export const NEEDS_RECONNECT = "Needs reconnect";

export function connectionState(row: Pick<ConnectionRow, "status" | "last_error"> | undefined | null): ConnectionState {
  if (!row || row.status === "disconnected") return "not_connected";
  if (row.status === "pending") return "connecting";
  if (row.status === "connected") return "connected";
  return row.last_error === NEEDS_RECONNECT ? "needs_reconnect" : "error";
}

export const STATE_LABEL: Record<ConnectionState, string> = {
  not_connected: "Not connected",
  connecting: "Connecting",
  connected: "Connected",
  needs_reconnect: "Needs reconnect",
  error: "Error",
};

/** Every connected_accounts row for the business, as stored (tokens excluded). */
export async function listConnections(businessId: string): Promise<ConnectionRow[]> {
  return sql<ConnectionRow>(
    `select provider, status::text as status, source, external_id, external_name, avatar_url, meta,
            last_error, last_synced_at, connected_at
       from connected_accounts where business_id = $1`,
    [businessId],
  );
}

export function platformStatusFrom(provider: PlatformStatus["provider"], row: ConnectionRow | undefined): PlatformStatus {
  const state = connectionState(row);
  const status: PlatformStatus["status"] =
    state === "connected" ? "connected" : state === "needs_reconnect" || state === "error" ? "reconnect" : "none";
  const handle = state === "connected" ? row?.external_name?.trim() || null : null;
  return { provider, status, handle };
}

export async function getSocialSummary(businessId: string): Promise<SocialSummary> {
  const [rows, growth] = await Promise.all([listConnections(businessId), getGrowthSummary(businessId)]);
  const platforms = SOCIAL_PLATFORMS.map((p) => platformStatusFrom(p, rows.find((r) => r.provider === p)));
  return { platforms, growth };
}
