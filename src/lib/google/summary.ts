import "server-only";
import { getLastGoogleHealth, runGoogleHealth, type GoogleCheck, type GoogleHealth } from "@/lib/google/business";

/**
 * The Google Business listing in one glance, for Overview and the Business
 * tab. Built from the last stored check (a check is run when none exists
 * yet). Every issue line comes from a real warn or missing check, nothing is
 * estimated. `fixHref` is where "Fix Google" should go.
 */

export type GoogleSummary = {
  status: "attention" | "ok" | "unknown";
  score: number | null;
  issues: string[];
  fixHref: string;
  source: "profile" | "api" | null;
};

/** One short line per check that is not fine. */
const SHORT: Record<string, { warn: string; missing: string }> = {
  name: { warn: "Business name unclear.", missing: "No business name." },
  category: { warn: "Category unclear.", missing: "No category." },
  hours: { warn: "Hours incomplete.", missing: "Hours missing." },
  phone: { warn: "Phone number unclear.", missing: "No phone number." },
  website: { warn: "No website linked.", missing: "No website linked." },
  address: { warn: "Address incomplete.", missing: "No address." },
  photos: { warn: "Only 1 photo.", missing: "No photos." },
  description: { warn: "Description is short.", missing: "No description." },
};

export function googleIssueLine(check: GoogleCheck): string {
  const s = SHORT[check.key];
  if (!s) return check.detail;
  return check.status === "warn" ? s.warn : s.missing;
}

export const GOOGLE_HREF = "/business/google";

export async function getGoogleSummary(businessId: string): Promise<GoogleSummary> {
  let health: GoogleHealth | null = null;
  try {
    health = (await getLastGoogleHealth(businessId)) ?? (await runGoogleHealth(businessId));
  } catch (error) {
    console.error("google summary: could not read or run the checks:", error);
  }
  if (!health) return { status: "unknown", score: null, issues: [], fixHref: GOOGLE_HREF, source: null };

  // Missing checks first, then warnings, so the worst news leads.
  const failing = health.checks
    .filter((c) => c.status !== "ok")
    .sort((a, b) => (a.status === "missing" ? 0 : 1) - (b.status === "missing" ? 0 : 1));

  return {
    status: failing.length > 0 ? "attention" : "ok",
    score: health.score,
    issues: failing.slice(0, 3).map(googleIssueLine),
    fixHref: health.fixes[0]?.href ?? GOOGLE_HREF,
    source: health.source,
  };
}
