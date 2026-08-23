"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, upsertUserByEmail } from "@/lib/auth";
import { devAuthEnabled, supabaseAnon } from "@/lib/supabase";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { friendlyAuthError } from "@/lib/auth-errors";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export type AuthFormState = {
  error?: string;
  notice?: string;
  /** Set when the error was "email not confirmed", so the form can offer a resend. */
  needsVerification?: boolean;
  email?: string;
};

/**
 * Password sign-in. The email must have been verified once at sign-up; after
 * that it is email + password forever. On success we mint the app's own
 * signed session cookie, exactly as before.
 */
export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email.success) return { error: "Enter a valid email." };
  if (!password) return { error: "Enter your password.", email: email.data };

  if (!rateLimit(`pw-signin:${email.data}`, LIMITS.otpVerify.limit, LIMITS.otpVerify.windowMs)) {
    return { error: "Too many attempts. Wait a few minutes.", email: email.data };
  }

  let metaUsername: string | undefined;
  if (devAuthEnabled()) {
    // Local shim: fixed password, no email round-trips.
    if (password !== "password123") {
      return { error: "That email or password is wrong.", email: email.data };
    }
  } else {
    const { data, error } = await supabaseAnon().auth.signInWithPassword({
      email: email.data,
      password,
    });
    if (error) {
      return {
        error: friendlyAuthError(error.message),
        needsVerification: error.message.toLowerCase().includes("not confirmed"),
        email: email.data,
      };
    }
    if (!data.user?.email) {
      return { error: "Something went wrong. Try again in a minute.", email: email.data };
    }
    metaUsername = typeof data.user.user_metadata?.username === "string"
      ? data.user.user_metadata.username
      : undefined;
  }

  const userId = await upsertUserByEmail(email.data, metaUsername);
  await createSession(userId);

  const next = String(formData.get("next") ?? "/dashboard");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

/** Re-send the account verification email for an address that never confirmed. */
export async function resendVerification(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email." };
  if (!rateLimit(`resend:${email.data}`, 3, 10 * 60_000)) {
    return { error: "Too many emails requested. Wait a few minutes.", email: email.data };
  }

  if (!devAuthEnabled()) {
    const { error } = await supabaseAnon().auth.resend({ type: "signup", email: email.data });
    if (error) return { error: friendlyAuthError(error.message), email: email.data };
  }
  return { notice: `Verification email sent to ${email.data}.`, email: email.data };
}

export async function signOut() {
  await destroySession();
  redirect("/");
}

