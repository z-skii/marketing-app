"use server";

import { supabaseAnon, devAuthEnabled } from "@/lib/supabase";
import { emailSchema, passwordSchema, usernameSchema } from "@/lib/validation";
import { friendlyAuthError } from "@/lib/auth-errors";
import { rateLimit } from "@/lib/rate-limit";
import { sql } from "@/lib/db";
import { SITE_URL } from "@/config/site";

export type SignUpState = {
  step: "form" | "sent";
  email?: string;
  username?: string;
  error?: string;
  notice?: string;
};

/**
 * Creates the account with email + password. The verification email that
 * follows only proves ownership of the address; it never signs anyone in.
 * Once verified, the account signs in with its password forever.
 */
export async function createAccount(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const username = usernameSchema.safeParse(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email.success) return { step: "form", error: "Enter a valid email." };
  if (!username.success) {
    return {
      step: "form", email: email.data,
      error: username.error.issues[0]?.message ?? "Pick a different username.",
    };
  }
  const pw = passwordSchema.safeParse(password);
  if (!pw.success) {
    return {
      step: "form", email: email.data, username: username.data,
      error: pw.error.issues[0]?.message ?? "Choose a stronger password.",
    };
  }
  if (password !== confirm) {
    return { step: "form", email: email.data, username: username.data, error: "Those passwords don't match." };
  }
  if (!rateLimit(`signup:${email.data}`, 5, 10 * 60_000)) {
    return { step: "form", email: email.data, username: username.data, error: "Too many attempts. Wait a few minutes." };
  }

  try {
    const taken = await sql<{ n: string }>(
      `select count(*)::text as n from profiles where lower(username) = lower($1)`,
      [username.data],
    );
    if (Number(taken[0]?.n ?? 0) > 0) {
      return { step: "form", email: email.data, error: "That username is taken. Try another." };
    }
  } catch {
    // Pre-migration deploys skip the early check; uniqueness still holds at creation.
  }

  if (devAuthEnabled()) {
    return { step: "sent", email: email.data };
  }

  const { data, error } = await supabaseAnon().auth.signUp({
    email: email.data,
    password,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/confirm`,
      data: { username: username.data },
    },
  });
  if (error) return { step: "form", email: email.data, username: username.data, error: friendlyAuthError(error.message) };

  // An already-registered email comes back as a user with no identities
  // rather than an error, so enumeration stays hard for outsiders while the
  // legitimate owner still gets pointed the right way.
  if (data.user && data.user.identities?.length === 0) {
    return { step: "form", email: email.data, username: username.data, error: "That email already has an account. Sign in instead." };
  }

  return { step: "sent", email: email.data };
}

/** Re-send the verification email from the "check your email" screen. */
export async function resendSignUpEmail(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { step: "form", error: "Enter a valid email." };
  if (!rateLimit(`resend:${email.data}`, 3, 10 * 60_000)) {
    return { step: "sent", email: email.data, error: "Too many emails requested. Wait a few minutes." };
  }
  if (!devAuthEnabled()) {
    const { error } = await supabaseAnon().auth.resend({ type: "signup", email: email.data });
    if (error) return { step: "sent", email: email.data, error: friendlyAuthError(error.message) };
  }
  return { step: "sent", email: email.data, notice: "Verification email sent again." };
}
