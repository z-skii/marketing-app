import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/config/site";

/** Token-hash confirmation (used when the email template links here). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") || "/";
  const base = siteUrl();
  if (token_hash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      if (type === "recovery") return NextResponse.redirect(new URL("/reset-password", base));
      return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", base));
    }
    return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, base));
  }
  return NextResponse.redirect(new URL("/sign-in", base));
}
