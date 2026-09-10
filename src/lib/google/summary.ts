import "server-only";
import { getLastGoogleHealth, type GoogleCheck } from "@/lib/google/business";
import { getGoogleConnection, googleConfigured, NEEDS_RECONNECT, type GoogleMeta } from "@/lib/google/oauth";

/**
 * The Google Business listing in one glance, for Overview and the Business
 * tab. Nothing is shown before a real connection exists: `not_connected`
 * carries no score and no issues. Issues come only from stored API checks.
 */

export type GoogleConnectionState = "not_connected" | "connecting" | "connected" | "needs_reconnect" | "error";

export type GoogleSummary = {
  status: "not_connected" | "connecting" | "needs_reconnect" | "attention" | "ok" | "unknown";
  score: number | null;
  issues: string[];
  fixHref: string;
  /**
   * "api" once real checks exist. "profile" is kept in the type for older
   * callers only; it is never produced any more.
   */
  source: "api" | "profile" | null;
  configured: boolean;
  connection: { status: GoogleConnectionState; locationTitle: string | null; lastSyncedAt: string | null };
};

/** One short line per check that is not fine. */
const SHORT: Record<string, { warn: string; missing: string }> = {
  name: { warn: "Business name unclear.", missing: "No business name." },
  category: { warn: "Category unclear.", missing: "No category." },
  hours: { warn: "Hours incomplete.", missing: "Hours missing." },
  phone: { warn: "Phone number unclear.", missing: "No phone number." },
  website: { warn: "No website linked.", missing: "No website linked." },
  address: { warn: "Address incomplete.", missing: "No address." },
  photos: { warn: "Few photos.", missing: "No photos." },
  photo_activity: { warn: "No photos in 90 days.", missing: "No photos in 90 days." },
  description: { warn: "Description is short.", missing: "No description." },
};

export function googleIssueLine(check: GoogleCheck): string {
  if (check.key === "reviews") return check.detail;
  const s = SHORT[check.key];
  if (!s) return check.detail;
  return check.status === "warn" ? s.warn : s.missing;
}

export const GOOGLE_HREF = "/business/google";
export const GOOGLE_CONNECT_HREF = "/business/settings/connections";

/** Map a connected_accounts row onto the five honest states. */
export function connectionStateFrom(row: { status: string; last_error: string | null } | null): GoogleConnectionState {
  if (!row || row.status === "disconnected") return "not_connected";
  if (row.status === "pending") return "connecting";
  if (row.status === "connected") return "connected";
  return row.last_error === NEEDS_RECONNECT ? "needs_reconnect" : "error";
}

export async function getGoogleSummary(businessId: string): Promise<GoogleSummary> {
  const configured = googleConfigured();
  const row = await getGoogleConnection(businessId);
  const state = connectionStateFrom(row);
  const meta = (row?.meta ?? {}) as GoogleMeta;
  const connection = {
    status: state,
    locationTitle: meta.location?.title ?? row?.external_name ?? null,
    lastSyncedAt: row?.last_synced_at ?? null,
  };
  const base: Pick<GoogleSummary, "score" | "issues" | "source" | "configured" | "connection"> =
    { score: null, issues: [], source: null, configured, connection };

  if (state === "not_connected") return { status: "not_connected", ...base, fixHref: GOOGLE_HREF };
  if (state === "connecting") return { status: "connecting", ...base, fixHref: GOOGLE_CONNECT_HREF + "/google" };
  if (state === "needs_reconnect" || state === "error") return { status: "needs_reconnect", ...base, fixHref: GOOGLE_CONNECT_HREF };

  let health = null;
  try {
    health = await getLastGoogleHealth(businessId);
  } catch (error) {
    console.error("google summary: could not read the checks:", error);
  }
  if (!health) return { status: "unknown", ...base, fixHref: GOOGLE_HREF };

  // Missing checks first, then warnings, so the worst news leads.
  const failing = health.checks
    .filter((c) => c.status !== "ok")
    .sort((a, b) => (a.status === "missing" ? 0 : 1) - (b.status === "missing" ? 0 : 1));

  return {
    status: failing.length > 0 ? "attention" : "ok",
    score: health.score,
    issues: failing.slice(0, 3).map(googleIssueLine),
    fixHref: GOOGLE_HREF,
    source: "api",
    configured,
    connection,
  };
}
