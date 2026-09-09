"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/config/site";
import { fail, ok, type ActionResult } from "@/lib/action-result";

const credentials = z.object({ email: z.string().trim().email("Enter a valid email"), password: z.string().min(8, "Password must be at least 8 characters") });

export async function signInAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
    return fail("Incorrect email or password");
  }
  const next = String(formData.get("next") || "/");
  redirect(next.startsWith("/") ? next : "/");
}

export async function signUpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const schema = credentials.extend({ full_name: z.string().trim().min(1, "Enter your name") });
  const parsed = schema.safeParse({ email: formData.get("email"), password: formData.get("password"), full_name: formData.get("full_name") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const next = String(formData.get("next") || "/onboarding");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return fail(error.message);
  // With email confirmation enabled there is no session yet.
  if (!data.session) redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}&next=${encodeURIComponent(next)}`);
  redirect(next.startsWith("/") ? next : "/onboarding");
}

export async function forgotPasswordAction(_prev: ActionResult<{ sent: true }> | null, formData: FormData): Promise<ActionResult<{ sent: true }>> {
  const email = z.string().trim().email().safeParse(formData.get("email"));
  if (!email.success) return fail("Enter a valid email");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${siteUrl()}/auth/callback?type=recovery` });
  if (error) return fail(error.message);
  return ok({ sent: true });
}

export async function resetPasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return fail("Password must be at least 8 characters");
  if (password !== confirm) return fail("Passwords do not match");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(error.message);
  redirect("/");
}

export async function resendVerificationAction(_prev: ActionResult<{ sent: true }> | null, formData: FormData): Promise<ActionResult<{ sent: true }>> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return fail("Missing email");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${siteUrl()}/auth/callback` } });
  if (error) return fail(error.message);
  return ok({ sent: true });
}
