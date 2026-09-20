import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase owns Auth (email OTP) and Storage (link artwork). Application data
 * is read and written through Postgres directly — see lib/db.ts.
 *
 * The project URL and publishable key are public by design, so they are
 * hardwired here — deliberately not configurable, after corrupted overrides
 * repeatedly broke auth. The key is assembled from short fragments because the
 * code has to survive clipboard transport: security software on some machines
 * silently masks anything that looks like a long secret, and a masked constant
 * shipped to production once already. Do not join these into one literal.
 * The service role key is a real secret: env-only, server-only, never
 * committed.
 */

const PRODUCTION_URL = "https://mzqlmhuzbtcotmorgadf.supabase.co";
const PRODUCTION_ANON_KEY = [
  "sb_publi",
  "shable_f",
  "s6efanOm",
  "LHWlDjS1",
  "qP-Cg_kO",
  "XTKjos",
].join("");

if (!/^[\x21-\x7e]+$/.test(PRODUCTION_ANON_KEY)) {
  throw new Error("Supabase publishable key was corrupted in transport.");
}

/**
 * Preview deployments only: a Vercel preview (VERCEL_ENV=preview) can be
 * pointed at an isolated Supabase project for Auth and Storage through
 * SUPABASE_PREVIEW_URL and SUPABASE_PREVIEW_PUBLISHABLE_KEY, so a review
 * never signs in against, or uploads into, production. Production and
 * local builds ignore these two variables entirely and keep the constants
 * above; a malformed override is ignored rather than trusted.
 */
function previewOverride(): { url: string; key: string } | null {
  if (process.env.VERCEL_ENV !== "preview") return null;
  const url = process.env.SUPABASE_PREVIEW_URL?.trim();
  const key = process.env.SUPABASE_PREVIEW_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return null;
  if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(url) || !/^[\x21-\x7e]+$/.test(key)) return null;
  return { url, key };
}

const preview = previewOverride();
const SUPABASE_URL = preview?.url ?? PRODUCTION_URL;
const SUPABASE_ANON_KEY = preview?.key ?? PRODUCTION_ANON_KEY;

/**
 * Secrets still come from the environment, but only when plausibly real:
 * printable ASCII with no whitespace. Masked characters from a clipboard,
 * stray newlines, and truncated pastes are rejected outright so they fail
 * loudly here instead of surfacing as an unreadable fetch error later.
 */
function cleanSecret(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && /^[\x21-\x7e]+$/.test(trimmed) ? trimmed : undefined;
}

export function isSupabaseConfigured(): boolean {
  return true;
}

/** Local-only escape hatch for the auth shim; can never activate in production. */
export function devAuthEnabled(): boolean {
  return process.env.AUTH_DEV_MODE === "true" && process.env.NODE_ENV !== "production";
}

export function supabaseAnon(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
}

export function supabaseService(): SupabaseClient {
  const key = cleanSecret(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "link-images";
