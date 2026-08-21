import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase owns Auth (email OTP) and Storage (link artwork). Application data
 * is read and written through Postgres directly — see lib/db.ts.
 *
 * The service role key is server-only and must never reach the browser.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function supabaseAnon(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase is not configured.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function supabaseService(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "link-images";

/**
 * Development shortcut: with no mail provider wired up, signing in would be
 * impossible locally. Guarded so it can never be true in a production build.
 */
export function devAuthEnabled(): boolean {
  return process.env.AUTH_DEV_MODE === "true" && process.env.NODE_ENV !== "production";
}
