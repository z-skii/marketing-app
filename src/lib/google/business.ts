import "server-only";
import { sql, sqlOne } from "@/lib/db";

/**
 * Google Business Profile health. Two providers, one interface:
 *
 *   profileProvider  reads the business row TapMart already has (name,
 *                    category, hours, phone, website, address, photos,
 *                    description) and reports source "profile".
 *   apiProvider      would read the real Business Profile through Google's
 *                    API. It is only "available" when Google OAuth
 *                    credentials exist on the server and the business has a
 *                    connected google_business account. The API call itself
 *                    is not implemented in this environment and says so;
 *                    it never returns made-up data.
 *
 * runGoogleHealth stores every run in google_health_checks so the score has
 * a history, and returns fixes that link to the profile editor.
 */

export type GoogleHealthSource = "profile" | "api";

export type GoogleCheckStatus = "ok" | "warn" | "missing";

export type GoogleCheck = {
  key: string;
  label: string;
  status: GoogleCheckStatus;
  detail: string;
};

export type GoogleFix = { key: string; label: string; href: string };

export type GoogleHealth = {
  checks: GoogleCheck[];
  score: number;
  source: GoogleHealthSource;
  fixes: GoogleFix[];
  ran_at: string;
};

/** What a provider knows about the profile. Null means "not known", never "empty". */
export type GoogleProfileData = {
  name: string | null;
  category: string | null;
  description: string | null;
  hours: unknown;
  phone: string | null;
  website: string | null;
  address: string | null;
  photo_count: number | null;
};

export interface GoogleBusinessProvider {
  id: GoogleHealthSource;
  available(businessId: string): Promise<boolean>;
  fetchProfile(businessId: string): Promise<GoogleProfileData>;
}

export function googleOauthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

async function googleConnected(businessId: string): Promise<boolean> {
  const row = await sqlOne(
    `select 1 as ok from connected_accounts
      where business_id = $1 and provider = 'google_business' and status = 'connected'`,
    [businessId],
  );
  return Boolean(row);
}

/**
 * The real thing, gated on real credentials. Fetching is deliberately a
 * clear error until the Business Profile API client exists; see
 * docs/business-services.md for what that needs.
 */
export const apiProvider: GoogleBusinessProvider = {
  id: "api",
  async available(businessId) {
    return googleOauthConfigured() && (await googleConnected(businessId));
  },
  async fetchProfile(businessId) {
    if (!(await this.available(businessId))) {
      throw new Error("Google Business Profile API is not available: connect Google and configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
    }
    throw new Error("Google Business Profile API fetch is not implemented in this environment. The profile provider runs the checks instead.");
  },
};

/** Derives the checks from the businesses row. Always available. */
export const profileProvider: GoogleBusinessProvider = {
  id: "profile",
  async available() {
    return true;
  },
  async fetchProfile(businessId) {
    const row = await sqlOne<{
      name: string; category: string | null; description: string | null; hours: unknown;
      phone: string | null; website: string | null; address: string | null;
      logo_url: string | null; cover_url: string | null;
    }>(
      `select name, category, description, hours, phone, website, address, logo_url, cover_url
         from businesses where id = $1`,
      [businessId],
    );
    if (!row) throw new Error("Business not found.");
    return {
      name: row.name,
      category: row.category,
      description: row.description,
      hours: row.hours,
      phone: row.phone,
      website: row.website,
      address: row.address,
      photo_count: [row.logo_url, row.cover_url].filter(Boolean).length,
    };
  },
};

function hasText(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function hoursStatus(hours: unknown): { status: GoogleCheckStatus; detail: string } {
  if (hours == null) return { status: "missing", detail: "No opening hours on the profile." };
  if (Array.isArray(hours)) {
    return hours.length ? { status: "ok", detail: `${hours.length} day entries.` } : { status: "missing", detail: "Hours are empty." };
  }
  if (typeof hours === "object") {
    const days = Object.keys(hours as Record<string, unknown>).length;
    if (days === 0) return { status: "missing", detail: "Hours are empty." };
    return days < 7
      ? { status: "warn", detail: `Hours for ${days} of 7 days.` }
      : { status: "ok", detail: "Hours for every day of the week." };
  }
  return { status: "warn", detail: "Hours are set but in a shape TapMart could not read." };
}

/** The checklist itself. Pure, so it can be tested without a database. */
export function evaluateGoogleProfile(p: GoogleProfileData): GoogleCheck[] {
  const hours = hoursStatus(p.hours);
  const descriptionLength = p.description?.trim().length ?? 0;
  const photos = p.photo_count ?? 0;
  return [
    { key: "name", label: "Business name", status: hasText(p.name) ? "ok" : "missing",
      detail: hasText(p.name) ? `Listed as ${p.name}.` : "No business name." },
    { key: "category", label: "Category", status: hasText(p.category) ? "ok" : "missing",
      detail: hasText(p.category) ? `Category: ${p.category}.` : "Google matches searches to your category. Pick one." },
    { key: "hours", label: "Opening hours", ...hours },
    { key: "phone", label: "Phone number", status: hasText(p.phone) ? "ok" : "missing",
      detail: hasText(p.phone) ? "A phone number is listed." : "No phone number. People call from the listing." },
    { key: "website", label: "Website", status: hasText(p.website) ? "ok" : "warn",
      detail: hasText(p.website) ? "A website is linked." : "No website linked. A social profile link also works." },
    { key: "address", label: "Address", status: hasText(p.address) ? "ok" : "missing",
      detail: hasText(p.address) ? "An address is listed." : "No address. Without it the profile does not show on the map." },
    { key: "photos", label: "Photos", status: photos >= 2 ? "ok" : photos === 1 ? "warn" : "missing",
      detail: photos >= 2 ? `${photos} photos (logo and cover).` : photos === 1 ? "Only one photo. Add a logo and a cover." : "No photos yet." },
    { key: "description", label: "Description",
      status: descriptionLength >= 150 ? "ok" : descriptionLength >= 40 ? "warn" : "missing",
      detail: descriptionLength >= 150 ? `${descriptionLength} characters.`
        : descriptionLength >= 40 ? `${descriptionLength} characters. Google allows 750; aim for at least 150.`
        : "No description or a very short one." },
  ];
}

const STATUS_POINTS: Record<GoogleCheckStatus, number> = { ok: 1, warn: 0.5, missing: 0 };

export function scoreChecks(checks: GoogleCheck[]): number {
  if (checks.length === 0) return 0;
  const total = checks.reduce((s, c) => s + STATUS_POINTS[c.status], 0);
  return Math.round((total / checks.length) * 100);
}

const FIX_LABELS: Record<string, string> = {
  name: "Set the business name",
  category: "Pick a category",
  hours: "Add opening hours",
  phone: "Add a phone number",
  website: "Add your website",
  address: "Add the address",
  photos: "Add a logo and cover photo",
  description: "Write a longer description",
};

export function fixesFor(checks: GoogleCheck[]): GoogleFix[] {
  return checks
    .filter((c) => c.status !== "ok")
    .map((c) => ({ key: c.key, label: FIX_LABELS[c.key] ?? `Fix ${c.label.toLowerCase()}`, href: `/business/edit#${c.key}` }));
}

/** Run the checks with the best available provider, store the run, return it. */
export async function runGoogleHealth(businessId: string): Promise<GoogleHealth> {
  let provider: GoogleBusinessProvider = profileProvider;
  let profile: GoogleProfileData | null = null;

  if (await apiProvider.available(businessId)) {
    try {
      profile = await apiProvider.fetchProfile(businessId);
      provider = apiProvider;
    } catch (error) {
      console.error("google health: API provider unavailable, using the profile:", error);
    }
  }
  if (!profile) {
    provider = profileProvider;
    profile = await profileProvider.fetchProfile(businessId);
  }

  const checks = evaluateGoogleProfile(profile);
  const score = scoreChecks(checks);
  const row = await sqlOne<{ created_at: string }>(
    `insert into google_health_checks (business_id, source, checks, score)
     values ($1, $2, $3::jsonb, $4) returning created_at`,
    [businessId, provider.id, JSON.stringify(checks), score],
  );
  return { checks, score, source: provider.id, fixes: fixesFor(checks), ran_at: row?.created_at ?? new Date().toISOString() };
}

/** The last stored run, if any. */
export async function getLastGoogleHealth(businessId: string): Promise<GoogleHealth | null> {
  const row = await sqlOne<{ checks: GoogleCheck[]; score: number | null; source: GoogleHealthSource; created_at: string }>(
    `select checks, score, source, created_at from google_health_checks
      where business_id = $1 order by created_at desc limit 1`,
    [businessId],
  );
  if (!row) return null;
  const checks = Array.isArray(row.checks) ? row.checks : [];
  return { checks, score: row.score ?? scoreChecks(checks), source: row.source, fixes: fixesFor(checks), ran_at: row.created_at };
}

export async function listGoogleHealthRuns(businessId: string, limit = 10) {
  return sql<{ id: string; score: number | null; source: GoogleHealthSource; created_at: string }>(
    `select id, score, source, created_at from google_health_checks
      where business_id = $1 order by created_at desc limit $2`,
    [businessId, Math.min(Math.max(limit, 1), 50)],
  );
}
