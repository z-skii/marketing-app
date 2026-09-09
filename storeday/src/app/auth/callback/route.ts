import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/config/site";

/** PKCE code exchange for email confirmation / password reset / invite links. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";
  const type = url.searchParams.get("type");
  const base = siteUrl();
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") return NextResponse.redirect(new URL("/reset-password", base));
      return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", base));
    }
    return NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, base));
  }
  return NextResponse.redirect(new URL("/sign-in", base));
}
