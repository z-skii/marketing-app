import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase owns Auth (email OTP) and Storage (link artwork). Application data
 * is read and written through Postgres directly — see lib/db.ts.
 *
 * The project URL and anon key are public by design (they ship in every
 * Supabase client bundle), so they are baked in here as defaults and can be
 * overridden by environment variables. The service role key is a real secret:
 * env-only, server-only, never committed.
 */

const DEFAULT_SUPABASE_URL = "https://mzqlmhuzbtcotmorgadf.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGci••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••";

function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
}

function supabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

export function supabaseAnon(): SupabaseClient {
  return createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
}

export function supabaseService(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createClient(supabaseUrl(), key, { auth: { persistSession: false } });
}

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "link-images";

/**
 * Development shortcut: with no mail provider wired up, signing in would be
 * impossible locally. Guarded so it can never be true in a production build.
 */
export function devAuthEnabled(): boolean {
  return process.env.AUTH_DEV_MODE === "true" && process.env.NODE_ENV !== "production";
}
