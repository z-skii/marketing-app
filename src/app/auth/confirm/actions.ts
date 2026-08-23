"use server";

import { upsertUserByEmail } from "@/lib/auth";
import { supabaseAnon } from "@/lib/supabase";

export type ConfirmResult = { ok: true } | { ok: false; error: string };

/**
 * Completes email verification. The verification link proves ownership of the
 * address and nothing more: we validate the token server-side, make sure the
 * member profile exists (assigning the member number), and then send the
 * visitor to sign in with their password. No session is minted here.
 */
export async function confirmEmail(accessToken: string): Promise<ConfirmResult> {
  if (!accessToken || accessToken.length > 4096) {
    return { ok: false, error: "That verification link is invalid or has expired." };
  }

  const { data, error } = await supabaseAnon().auth.getUser(accessToken);
  if (error || !data.user?.email) {
    return { ok: false, error: "That verification link is invalid or has expired." };
  }

  await upsertUserByEmail(data.user.email);
  return { ok: true };
}
