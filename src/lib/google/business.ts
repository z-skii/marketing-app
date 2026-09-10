import "server-only";
import { sql, sqlOne } from "@/lib/db";
import {
  fetchLocation, fetchMediaSummary, formatAddress, getGoogleConnection, googleConfigured, listReviews, withGoogleToken,
  type GoogleHoursPeriod, type GoogleLocation, type GoogleMeta, type GoogleReview,
} from "@/lib/google/oauth";

/**
 * Google Business Profile health, from the real listing only.
 *
 * There is exactly one provider: the Business Profile API, reachable when
 * the server has Google credentials and the business has a connected
 * google_business account with a chosen location. Without that nothing is
 * scored, nothing is flagged and nothing is stored: runGoogleHealth throws
 * NotConnectedError and getLastGoogleHealth returns null.
 *
 * Every stored check carries `source: "api"` and `observed`, the raw value
 * it was derived from, so a person can trace any line back to Google.
 */

export type GoogleHealthSource = "api";

export type GoogleCheckStatus = "ok" | "warn" | "missing";

export type GoogleCheck = {
  key: string;
  label: string;
  status: GoogleCheckStatus;
  detail: string;
  source: GoogleHealthSource;
  /** The raw value the check looked at, as Google reported it. */
  observed: unknown;
};

export type GoogleHealth = {
  checks: GoogleCheck[];
  score: number;
  source: GoogleHealthSource;
  ran_at: string;
};

export class NotConnectedError extends Error {
  constructor(message = "Google is not connected.") {
    super(message);
    this.name = "NotConnectedError";
  }
}

export type GoogleReviewSummary = {
  total: number | null;
  average: number | null;
  unanswered: number | null;
  unanswered_items: GoogleReview[];
  /** Why reviews could not be read, when Google refused. */
  unavailable_reason: string | null;
};

/** What Google knows about the listing. Null means "not known", never "empty". */
export type GoogleProfileData = {
  location_name: string;
  account: string | null;
  name: string | null;
  category: string | null;
  additional_categories: string[];
  description: string | null;
  hours: GoogleHoursPeriod[] | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  open_status: string | null;
  photo_count: number | null;
  last_photo_at: string | null;
  photos_unavailable_reason: string | null;
  reviews: GoogleReviewSummary | null;
  maps_uri: string | null;
  new_review_uri: string | null;
  fetched_at: string;
};

export interface GoogleBusinessProvider {
  id: GoogleHealthSource;
  available(businessId: string): Promise<boolean>;
  fetchProfile(businessId: string): Promise<GoogleProfileData>;
}

export function googleOauthConfigured(): boolean {
  return googleConfigured();
}

/** Turn a location resource (plus reviews and media) into GoogleProfileData. Pure. */
export function profileFromLocation(
  location: GoogleLocation,
  extras: {
    account: string | null;
    reviews: { data: { total: number | null; average: number | null; reviews: GoogleReview[] } | null; reason: string | null };
    media: { data: { count: number; latestCreateTime: string | null } | null; reason: string | null };
    now?: Date;
  },
): GoogleProfileData {
  const periods = location.regularHours?.periods;
  const unanswered = extras.reviews.data ? extras.reviews.data.reviews.filter((r) => !r.replied) : [];
  return {
    location_name: location.name,
    account: extras.account,
    name: location.title?.trim() || null,
    category: location.categories?.primaryCategory?.displayName?.trim() || null,
    additional_categories: (location.categories?.additionalCategories ?? []).map((c) => c.displayName ?? "").filter(Boolean),
    description: location.profile?.description?.trim() || null,
    hours: Array.isArray(periods) ? periods : null,
    phone: location.phoneNumbers?.primaryPhone?.trim() || null,
    website: location.websiteUri?.trim() || null,
    address: formatAddress(location.storefrontAddress),
    open_status: location.openInfo?.status ?? null,
    photo_count: extras.media.data ? extras.media.data.count : null,
    last_photo_at: extras.media.data?.latestCreateTime ?? null,
    photos_unavailable_reason: extras.media.reason,
    reviews: extras.reviews.data
      ? {
          total: extras.reviews.data.total,
          average: extras.reviews.data.average,
          unanswered: unanswered.length,
          unanswered_items: unanswered.slice(0, 10),
          unavailable_reason: null,
        }
      : { total: null, average: null, unanswered: null, unanswered_items: [], unavailable_reason: extras.reviews.reason },
    maps_uri: location.metadata?.mapsUri ?? null,
    new_review_uri: location.metadata?.newReviewUri ?? null,
    fetched_at: (extras.now ?? new Date()).toISOString(),
  };
}

/**
 * The only provider. Reads the chosen location, its reviews and its photos
 * through the API with the business's own token, and stores the snapshot in
 * connected_accounts.meta.profile with last_synced_at.
 */
export const apiProvider: GoogleBusinessProvider = {
  id: "api",
  async available(businessId) {
    if (!googleConfigured()) return false;
    const row = await getGoogleConnection(businessId);
    return Boolean(row && row.status === "connected" && row.access_token && (row.meta as GoogleMeta).location?.name);
  },
  async fetchProfile(businessId) {
    if (!(await this.available(businessId))) throw new NotConnectedError();
    return withGoogleToken(businessId, async (token, row) => {
      const meta = row.meta as GoogleMeta;
      const location = meta.location!;
      const resource = await fetchLocation(token, location.name);
      const [reviews, media] = await Promise.all([
        listReviews(token, location.account, location.name),
        fetchMediaSummary(token, location.account, location.name),
      ]);
      const profile = profileFromLocation(resource, { account: location.account, reviews, media });
      await sql(
        `update connected_accounts
            set meta = meta || jsonb_build_object('profile', $2::jsonb), last_synced_at = now(), last_error = null, updated_at = now()
          where business_id = $1 and provider = 'google_business'`,
        [businessId, JSON.stringify(profile)],
      );
      return profile;
    });
  },
};

// ------------------------------------------------------------------ checks

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function hoursStatus(hours: GoogleHoursPeriod[] | null): { status: GoogleCheckStatus; detail: string } {
  if (hours == null || hours.length === 0) return { status: "missing", detail: "No opening hours on the listing." };
  const days = new Set(hours.map((p) => p.openDay).filter((d): d is string => typeof d === "string" && DAYS.includes(d)));
  if (days.size === 0) return { status: "warn", detail: "Hours are set but in a shape TapMart could not read." };
  return days.size < 7
    ? { status: "warn", detail: `Hours for ${days.size} of 7 days.` }
    : { status: "ok", detail: "Hours for every day of the week." };
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/** The checklist. Pure, runs on API data only, so it can be tested without a database. */
export function evaluateGoogleProfile(p: GoogleProfileData, now = new Date()): GoogleCheck[] {
  const hours = hoursStatus(p.hours);
  const descriptionLength = p.description?.trim().length ?? 0;
  const api = "api" as const;
  const checks: GoogleCheck[] = [
    { key: "name", label: "Business name", source: api, observed: p.name, status: hasText(p.name) ? "ok" : "missing",
      detail: hasText(p.name) ? `Listed as ${p.name}.` : "No business name on the listing." },
    { key: "category", label: "Category", source: api, observed: p.category, status: hasText(p.category) ? "ok" : "missing",
      detail: hasText(p.category) ? `Category: ${p.category}.` : "No primary category. Google matches searches to it." },
    { key: "hours", label: "Opening hours", source: api, observed: p.hours, ...hours },
    { key: "phone", label: "Phone number", source: api, observed: p.phone, status: hasText(p.phone) ? "ok" : "missing",
      detail: hasText(p.phone) ? `Listed as ${p.phone}.` : "No phone number. People call from the listing." },
    { key: "website", label: "Website", source: api, observed: p.website, status: hasText(p.website) ? "ok" : "warn",
      detail: hasText(p.website) ? `Linked to ${p.website}.` : "No website linked. A social profile link also works." },
    { key: "address", label: "Address", source: api, observed: p.address, status: hasText(p.address) ? "ok" : "missing",
      detail: hasText(p.address) ? `Listed at ${p.address}.` : "No address. Without it the listing does not show on the map." },
    { key: "description", label: "Description", source: api, observed: p.description,
      status: descriptionLength >= 150 ? "ok" : descriptionLength >= 40 ? "warn" : "missing",
      detail: descriptionLength >= 150 ? `${descriptionLength} characters.`
        : descriptionLength >= 40 ? `${descriptionLength} characters. Google allows 750; aim for at least 150.`
        : descriptionLength > 0 ? `${descriptionLength} characters. That is too short to help.` : "No description on the listing." },
  ];

  if (p.photo_count !== null) {
    const photos = p.photo_count;
    checks.push({
      key: "photos", label: "Photos", source: api, observed: photos,
      status: photos >= 3 ? "ok" : photos >= 1 ? "warn" : "missing",
      detail: photos >= 3 ? `${photos} photos on the listing.` : photos >= 1 ? `Only ${photos} photo${photos === 1 ? "" : "s"}. Listings with more photos get more calls.` : "No photos on the listing.",
    });
    if (p.last_photo_at) {
      const last = new Date(p.last_photo_at).getTime();
      const stale = Number.isFinite(last) && now.getTime() - last > NINETY_DAYS_MS;
      const days = Number.isFinite(last) ? Math.floor((now.getTime() - last) / (24 * 60 * 60 * 1000)) : null;
      checks.push({
        key: "photo_activity", label: "Photo activity", source: api, observed: p.last_photo_at,
        status: stale ? "warn" : "ok",
        detail: stale ? "No photos added in 90 days." : days !== null ? `Last photo added ${days} day${days === 1 ? "" : "s"} ago.` : "Photos are being added.",
      });
    }
  }

  if (p.reviews && p.reviews.unanswered !== null) {
    const n = p.reviews.unanswered;
    checks.push({
      key: "reviews", label: "Review replies", source: api, observed: { total: p.reviews.total, unanswered: n },
      status: n === 0 ? "ok" : n >= 3 ? "missing" : "warn",
      detail: n === 0
        ? (p.reviews.total ? `Every one of ${p.reviews.total} reviews has a reply.` : "No reviews yet.")
        : `${n} review${n === 1 ? "" : "s"} without a reply.`,
    });
  }
  return checks;
}

const STATUS_POINTS: Record<GoogleCheckStatus, number> = { ok: 1, warn: 0.5, missing: 0 };

export function scoreChecks(checks: GoogleCheck[]): number {
  if (checks.length === 0) return 0;
  const total = checks.reduce((s, c) => s + STATUS_POINTS[c.status], 0);
  return Math.round((total / checks.length) * 100);
}

/** Evaluate a stored or freshly fetched snapshot without touching Google. Pure apart from the insert. */
export async function storeGoogleHealth(businessId: string, profile: GoogleProfileData, now = new Date()): Promise<GoogleHealth> {
  const checks = evaluateGoogleProfile(profile, now);
  const score = scoreChecks(checks);
  const row = await sqlOne<{ created_at: string }>(
    `insert into google_health_checks (business_id, source, checks, score)
     values ($1, 'api', $2::jsonb, $3) returning created_at`,
    [businessId, JSON.stringify(checks), score],
  );
  return { checks, score, source: "api", ran_at: row?.created_at ?? now.toISOString() };
}

/**
 * Fetch the listing through the API, run the checks, store the run. Throws
 * NotConnectedError when there is no connected account: there is nothing
 * honest to check without one.
 */
export async function runGoogleHealth(businessId: string): Promise<GoogleHealth> {
  if (!(await apiProvider.available(businessId))) throw new NotConnectedError();
  const profile = await apiProvider.fetchProfile(businessId);
  return storeGoogleHealth(businessId, profile);
}

/** The stored snapshot from the last sync, only while connected. */
export async function getGoogleProfileSnapshot(businessId: string): Promise<GoogleProfileData | null> {
  const row = await getGoogleConnection(businessId);
  if (!row || row.status !== "connected") return null;
  const profile = (row.meta as GoogleMeta).profile;
  return profile && typeof profile === "object" && typeof (profile as GoogleProfileData).location_name === "string"
    ? (profile as GoogleProfileData)
    : null;
}

/** The last stored API run, or null when Google is not connected. */
export async function getLastGoogleHealth(businessId: string): Promise<GoogleHealth | null> {
  const connection = await getGoogleConnection(businessId);
  if (!connection || connection.status !== "connected") return null;
  const row = await sqlOne<{ checks: GoogleCheck[]; score: number | null; created_at: string }>(
    `select checks, score, created_at from google_health_checks
      where business_id = $1 and source = 'api' order by created_at desc limit 1`,
    [businessId],
  );
  if (!row) return null;
  const checks = (Array.isArray(row.checks) ? row.checks : []).filter((c) => c && typeof c.key === "string");
  return { checks, score: row.score ?? scoreChecks(checks), source: "api", ran_at: row.created_at };
}

export async function listGoogleHealthRuns(businessId: string, limit = 10) {
  return sql<{ id: string; score: number | null; source: GoogleHealthSource; created_at: string }>(
    `select id, score, source, created_at from google_health_checks
      where business_id = $1 and source = 'api' order by created_at desc limit $2`,
    [businessId, Math.min(Math.max(limit, 1), 50)],
  );
}
