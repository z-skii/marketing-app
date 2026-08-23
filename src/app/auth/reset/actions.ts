"use server";

import { supabaseAnon } from "@/lib/supabase";
import { passwordSchema } from "@/lib/validation";
import { friendlyAuthError } from "@/lib/auth-errors";

export type CompleteResetResult = { ok: true } | { ok: false; error: string };

/**
 * Completes a password reset. The recovery link put a short-lived token pair
 * in the URL fragment; we adopt it server-side just long enough to set the
 * new password, then send the visitor to sign in normally. Nothing here mints
 * an app session.
 */
export async function completePasswordReset(
  accessToken: string,
  refreshToken: string,
  password: string,
  confirm: string,
): Promise<CompleteResetResult> {
  if (!accessToken || accessToken.length > 4096 || !refreshToken || refreshToken.length > 4096) {
    return { ok: false, error: "That reset link is invalid or has expired. Request a new one." };
  }
  const pw = passwordSchema.safeParse(password);
  if (!pw.success) {
    return { ok: false, error: pw.error.issues[0]?.message ?? "Choose a stronger password." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Those passwords don't match." };
  }

  const client = supabaseAnon();
  const { error: sessionError } = await client.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) {
    return { ok: false, error: "That reset link is invalid or has expired. Request a new one." };
  }

  const { error } = await client.auth.updateUser({ password });
  await client.auth.signOut().catch(() => {});
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}
