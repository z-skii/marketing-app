"use server";

import { devAuthEnabled, supabaseAnon } from "@/lib/supabase";
import { emailSchema } from "@/lib/validation";
import { friendlyAuthError } from "@/lib/auth-errors";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/config/site";

export type ResetRequestState = {
  step: "form" | "sent";
  email?: string;
  error?: string;
};

/** Sends the password-reset email. The link returns to /auth/reset here. */
export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { step: "form", error: "Enter a valid email." };
  if (!rateLimit(`pw-reset:${email.data}`, 3, 10 * 60_000)) {
    return { step: "form", email: email.data, error: "Too many emails requested. Wait a few minutes." };
  }

  if (!devAuthEnabled()) {
    const { error } = await supabaseAnon().auth.resetPasswordForEmail(email.data, {
      redirectTo: `${SITE_URL}/auth/reset`,
    });
    if (error) return { step: "form", email: email.data, error: friendlyAuthError(error.message) };
  }
  return { step: "sent", email: email.data };
}
