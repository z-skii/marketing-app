"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, upsertUserByEmail } from "@/lib/auth";
import { devAuthEnabled, isSupabaseConfigured, supabaseAnon } from "@/lib/supabase";
import { emailSchema, otpSchema } from "@/lib/validation";
import { SITE_URL } from "@/config/site";
import { LIMITS, rateLimit } from "@/lib/rate-limit";

export type SignInState = {
  step: "email" | "code";
  email?: string;
  error?: string;
  notice?: string;
};

/** Step one: prove the address exists by sending a six-digit code to it. */
export async function requestCode(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { step: "email", error: parsed.error.issues[0]?.message ?? "Enter a valid email." };
  }
  const email = parsed.data;

  if (!rateLimit(`otp-req:${email}`, LIMITS.otpRequest.limit, LIMITS.otpRequest.windowMs)) {
    return { step: "email", email, error: "Too many codes requested. Try again in a few minutes." };
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabaseAnon().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${SITE_URL}/auth/confirm`,
      },
    });
    if (error) {
      return {
        step: "email",
        email,
        error: `We couldn't send the email (${error.message}). Try again in a few minutes.`,
      };
    }
    return {
      step: "code",
      email,
      notice: `Email sent to ${email} — click the sign-in link in it, or enter the code below if your email shows one. Check spam too.`,
    };
  }

  if (devAuthEnabled()) {
    return {
      step: "code",
      email,
      notice: "Development mode — any 6-digit code will sign you in.",
    };
  }

  return { step: "email", email, error: "Sign-in is not configured yet." };
}

/** Step two: verify the code, then mint our own session cookie. */
export async function verifyCode(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const code = otpSchema.safeParse(formData.get("code"));

  if (!email.success) return { step: "email", error: "Start again." };
  if (!code.success) {
    return { step: "code", email: email.data, error: code.error.issues[0]?.message ?? "Enter the code." };
  }

  if (!rateLimit(`otp-ver:${email.data}`, LIMITS.otpVerify.limit, LIMITS.otpVerify.windowMs)) {
    return { step: "code", email: email.data, error: "Too many attempts. Request a fresh code." };
  }

  if (isSupabaseConfigured()) {
    const { error } = await supabaseAnon().auth.verifyOtp({
      email: email.data,
      token: code.data,
      type: "email",
    });
    if (error) return { step: "code", email: email.data, error: "That code didn't work." };
  } else if (!devAuthEnabled()) {
    return { step: "email", error: "Sign-in is not configured yet." };
  }

  const userId = await upsertUserByEmail(email.data);
  await createSession(userId);

  const next = String(formData.get("next") ?? "/dashboard");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signOut() {
  await destroySession();
  redirect("/");
}
