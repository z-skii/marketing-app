"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function acceptInvitationAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`);
  const { data: orgId, error } = await supabase.rpc("accept_invitation", { p_token: token });
  if (error) redirect(`/invite/${token}?error=${encodeURIComponent(error.message)}`);
  if (orgId) await supabase.from("profiles").update({ active_organization_id: orgId }).eq("id", user.id);
  redirect("/");
}
