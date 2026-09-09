"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/config/site";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Browser Supabase client (singleton). Used for realtime subscriptions and storage uploads. */
export function getSupabaseBrowserClient() {
  if (!client) client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
