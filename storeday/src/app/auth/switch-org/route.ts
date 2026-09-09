import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { siteUrl } from "@/config/site";

export async function POST(req: Request) {
  const form = await req.formData();
  const orgId = String(form.get("organization_id") ?? "");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user && orgId) {
    const { data: m } = await supabase.from("organization_members").select("id").eq("organization_id", orgId).eq("user_id", user.id).maybeSingle();
    if (m) await supabase.from("profiles").update({ active_organization_id: orgId }).eq("id", user.id);
  }
  return NextResponse.redirect(new URL("/", siteUrl()), { status: 303 });
}
