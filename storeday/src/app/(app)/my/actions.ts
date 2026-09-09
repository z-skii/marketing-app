"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";

export async function updateProfileAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = z.object({
    full_name: z.string().trim().min(1, "Name is required").max(120),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
  }).safeParse({ full_name: formData.get("full_name") ?? "", phone: formData.get("phone") ?? "" });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null }).eq("id", user.id);
  if (error) return fail(error.message);
  revalidatePath("/my/profile");
  revalidatePath("/", "layout");
  return ok(undefined);
}

export async function changePasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireUser();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return fail("Password must be at least 8 characters");
  if (password !== confirm) return fail("Passwords do not match");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return fail(error.message);
  return ok(undefined);
}
