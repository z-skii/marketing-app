"use server";

import { createSession, upsertUserByEmail } from "@/lib/auth";
import { supabaseAnon } from "@/lib/supabase";

export type MagicLinkResult = { ok: true } | { ok: false; error: string };

/**
 * Completes a magic-link sign-in.
 *
 * Supabase's hosted verify endpoint redirects the visitor back to us with an
 * access token. The token is only trusted after Supabase itself confirms it
 * (auth.getUser validates the JWT server-side); then we mint our own session
 * cookie exactly as the code flow does.
 */
export async function completeMagicLink(accessToken: string): Promise<MagicLinkResult> {
  if (!accessToken || accessToken.length > 4096) {
    return { ok: false, error: "That link didn't carry a valid sign-in." };
  }

  const { data, error } = await supabaseAnon().auth.getUser(accessToken);
  if (error || !data.user?.email) {
    return { ok: false, error: "That sign-in link is invalid or has expired." };
  }

  const userId = await upsertUserByEmail(data.user.email);
  await createSession(userId);
  return { ok: true };
}
