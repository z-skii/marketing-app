import "server-only";
import { sqlOne } from "@/lib/db";
import {
  apiProvider, getGoogleProfileSnapshot, storeGoogleHealth, type GoogleCheck, type GoogleProfileData,
} from "@/lib/google/business";
import { patchLocation, withGoogleToken, type GoogleHoursPeriod, type GoogleLocation } from "@/lib/google/oauth";

/**
 * Fix Google: for every failing check, what the listing says now, what
 * TapMart proposes, and whether the Business Information API lets TapMart
 * apply it. Hours, phone, website and description can be PATCHed. Name,
 * address, categories, photos and reviews cannot be changed through the
 * API TapMart has, so those carry a reason and a deep link instead.
 *
 * Nothing is ever applied on its own: applyFix runs only when a person
 * taps "Approve change" on a specific fix.
 */

export type GoogleFix = {
  key: string;
  label: string;
  current: string | null;
  proposed: string | null;
  canApply: boolean;
  reason?: string;
  /** Where to make the change by hand when the API does not allow it. */
  href?: string;
};

export const GOOGLE_MANUAL_REASON = "Google does not allow this change through the API. Do it in your Google Business Profile.";
export const GOOGLE_PROFILE_URL = "https://business.google.com/";

export const PATCHABLE_KEYS = ["hours", "phone", "website", "description"] as const;
export type PatchableKey = (typeof PATCHABLE_KEYS)[number];

type BusinessRow = { phone: string | null; website: string | null; description: string | null; hours: unknown };

const DAY_NAMES: Record<string, string> = {
  mon: "MONDAY", monday: "MONDAY", tue: "TUESDAY", tuesday: "TUESDAY", wed: "WEDNESDAY", wednesday: "WEDNESDAY",
  thu: "THURSDAY", thursday: "THURSDAY", fri: "FRIDAY", friday: "FRIDAY", sat: "SATURDAY", saturday: "SATURDAY",
  sun: "SUNDAY", sunday: "SUNDAY",
};

function parseTime(v: string): { hours: number; minutes: number } | null {
  const m = v.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 24 || minutes > 59) return null;
  return { hours, minutes };
}

/**
 * Convert the hours a business typed into TapMart into Google periods.
 * Accepts { monday: "09:00-17:00" } style objects, { monday: { open, close } },
 * or an array of Google periods as is. Returns null when the shape is not one
 * TapMart can read, so nothing invented reaches Google.
 */
export function hoursToGooglePeriods(hours: unknown): GoogleHoursPeriod[] | null {
  if (!hours) return null;
  if (Array.isArray(hours)) {
    const ok = hours.every((p) => p && typeof p === "object" && typeof (p as GoogleHoursPeriod).openDay === "string");
    return ok && hours.length ? (hours as GoogleHoursPeriod[]) : null;
  }
  if (typeof hours !== "object") return null;
  const periods: GoogleHoursPeriod[] = [];
  for (const [rawDay, value] of Object.entries(hours as Record<string, unknown>)) {
    const day = DAY_NAMES[rawDay.toLowerCase()];
    if (!day) continue;
    let open: string | null = null;
    let close: string | null = null;
    if (typeof value === "string") {
      const parts = value.split(/\s*(?:-|to)\s*/);
      if (parts.length === 2) [open, close] = parts;
    } else if (value && typeof value === "object") {
      const v = value as { open?: unknown; close?: unknown };
      if (typeof v.open === "string" && typeof v.close === "string") { open = v.open; close = v.close; }
    }
    if (!open || !close) continue;
    const o = parseTime(open);
    const c = parseTime(close);
    if (!o || !c) continue;
    periods.push({ openDay: day, openTime: o, closeDay: day, closeTime: c });
  }
  return periods.length ? periods : null;
}

function pad(n: number | undefined): string {
  return String(n ?? 0).padStart(2, "0");
}

/** "Mon 09:00 to 17:00, Tue ..." for a list of Google periods. */
export function describePeriods(periods: GoogleHoursPeriod[] | null): string | null {
  if (!periods || periods.length === 0) return null;
  return periods
    .map((p) => `${(p.openDay ?? "").slice(0, 3)} ${pad(p.openTime?.hours)}:${pad(p.openTime?.minutes)} to ${pad(p.closeTime?.hours)}:${pad(p.closeTime?.minutes)}`)
    .join(", ");
}

const LABELS: Record<string, string> = {
  name: "Business name",
  category: "Category",
  hours: "Opening hours",
  phone: "Phone number",
  website: "Website",
  address: "Address",
  description: "Description",
  photos: "Photos",
  photo_activity: "Photo activity",
  reviews: "Review replies",
};

/** Build the fix list from failing checks, the snapshot and the TapMart profile. Pure. */
export function fixesFrom(checks: GoogleCheck[], profile: GoogleProfileData, business: BusinessRow): GoogleFix[] {
  const manualHref = profile.maps_uri ?? GOOGLE_PROFILE_URL;
  const fixes: GoogleFix[] = [];
  for (const check of checks) {
    if (check.status === "ok") continue;
    const label = LABELS[check.key] ?? check.label;
    switch (check.key) {
      case "phone": {
        const proposed = business.phone?.trim() || null;
        fixes.push(proposed && proposed !== profile.phone
          ? { key: "phone", label, current: profile.phone, proposed, canApply: true }
          : { key: "phone", label, current: profile.phone, proposed: null, canApply: false, reason: "Add a phone number to your TapMart profile first, then TapMart can send it to Google.", href: "/business/edit#phone" });
        break;
      }
      case "website": {
        const proposed = business.website?.trim() || null;
        fixes.push(proposed && proposed !== profile.website
          ? { key: "website", label, current: profile.website, proposed, canApply: true }
          : { key: "website", label, current: profile.website, proposed: null, canApply: false, reason: "Add a website to your TapMart profile first, then TapMart can send it to Google.", href: "/business/edit#website" });
        break;
      }
      case "description": {
        const proposed = business.description?.trim() || null;
        const usable = proposed && proposed.length >= 40 && proposed.length <= 750 && proposed !== profile.description;
        fixes.push(usable
          ? { key: "description", label, current: profile.description, proposed, canApply: true }
          : { key: "description", label, current: profile.description, proposed: null, canApply: false, reason: "Write a description of at least 40 characters on your TapMart profile first, then TapMart can send it to Google.", href: "/business/edit#description" });
        break;
      }
      case "hours": {
        const periods = hoursToGooglePeriods(business.hours);
        fixes.push(periods
          ? { key: "hours", label, current: describePeriods(profile.hours), proposed: describePeriods(periods), canApply: true }
          : { key: "hours", label, current: describePeriods(profile.hours), proposed: null, canApply: false, reason: "TapMart has no opening hours for you yet. Set them in your Google Business Profile.", href: manualHref });
        break;
      }
      case "reviews": {
        const n = profile.reviews?.unanswered ?? 0;
        fixes.push({ key: "reviews", label, current: `${n} review${n === 1 ? "" : "s"} without a reply`, proposed: "Reply to each review", canApply: false, reason: GOOGLE_MANUAL_REASON, href: manualHref });
        break;
      }
      case "photos":
      case "photo_activity": {
        fixes.push({ key: check.key, label, current: check.detail, proposed: "Add recent photos of the place, the product and the people", canApply: false, reason: GOOGLE_MANUAL_REASON, href: manualHref });
        break;
      }
      default: {
        fixes.push({ key: check.key, label, current: typeof check.observed === "string" ? check.observed : null, proposed: null, canApply: false, reason: GOOGLE_MANUAL_REASON, href: manualHref });
      }
    }
  }
  return fixes;
}

export async function googleFixes(businessId: string, checks: GoogleCheck[]): Promise<GoogleFix[]> {
  const [profile, business] = await Promise.all([
    getGoogleProfileSnapshot(businessId),
    sqlOne<BusinessRow>(`select phone, website, description, hours from businesses where id = $1`, [businessId]),
  ]);
  if (!profile || !business) return [];
  return fixesFrom(checks, profile, business);
}

/** Body and updateMask for a PATCH. Pure, so the request shape is testable. */
export function patchFor(key: PatchableKey, proposed: string): { updateMask: string; body: Partial<GoogleLocation> } {
  switch (key) {
    case "phone":
      return { updateMask: "phoneNumbers.primaryPhone", body: { phoneNumbers: { primaryPhone: proposed } } };
    case "website":
      return { updateMask: "websiteUri", body: { websiteUri: proposed } };
    case "description":
      return { updateMask: "profile.description", body: { profile: { description: proposed } } };
    case "hours": {
      let periods: GoogleHoursPeriod[] | null = null;
      try { periods = hoursToGooglePeriods(JSON.parse(proposed)); } catch { periods = null; }
      if (!periods) throw new Error("Those hours are not in a shape Google accepts.");
      return { updateMask: "regularHours", body: { regularHours: { periods } } };
    }
  }
}

/**
 * Apply one approved fix through the Business Information API with the
 * business's own token, then refresh the snapshot and the stored checks so
 * the screen shows what Google now says. `proposedValue` for hours is the
 * JSON of the periods or the TapMart hours object.
 */
export async function applyFix(businessId: string, key: string, proposedValue: string): Promise<{ applied: true; key: PatchableKey }> {
  const patchable = PATCHABLE_KEYS.find((k) => k === key);
  if (!patchable) throw new Error(GOOGLE_MANUAL_REASON);
  const value = proposedValue.trim();
  if (!value) throw new Error("Nothing to send to Google.");
  if (patchable === "description" && (value.length < 40 || value.length > 750)) throw new Error("Google descriptions are 40 to 750 characters.");
  if (patchable === "website" && !/^https?:\/\//i.test(value)) throw new Error("The website needs to start with http:// or https://.");
  const snapshot = await getGoogleProfileSnapshot(businessId);
  if (!snapshot) throw new Error("Google is not connected.");

  const { updateMask, body } = patchFor(patchable, value);
  await withGoogleToken(businessId, (token) => patchLocation(token, snapshot.location_name, updateMask, body));
  // Read back what Google now has and re-run the checks against it.
  const profile = await apiProvider.fetchProfile(businessId);
  await storeGoogleHealth(businessId, profile);
  return { applied: true, key: patchable };
}
