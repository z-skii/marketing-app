import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase owns Auth (email OTP) and Storage (link artwork). Application data
 * is read and written through Postgres directly — see lib/db.ts.
 *
 * The project URL and anon key are public by design (they ship in every
 * Supabase client bundle), so they are hardwired here — deliberately not
 * configurable. Environment overrides for them repeatedly arrived corrupted
 * from hosting dashboards and broke auth at runtime; a constant cannot. The
 * service role key is a real secret: env-only, server-only, never committed.
 */

const SUPABASE_URL = "https://mzqlmhuzbtcotmorgadf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGci••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••";

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
