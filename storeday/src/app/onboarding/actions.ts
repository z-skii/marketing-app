"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrgContext, requireUser } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { feetToMeters } from "@/lib/calc/geo";

export async function createBusinessAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireUser();
  const schema = z.object({ name: z.string().trim().min(1, "Business name is required"), business_type: z.string().trim().optional(), timezone: z.string().trim().min(1) });
  const parsed = schema.safeParse({ name: formData.get("name"), business_type: formData.get("business_type"), timezone: formData.get("timezone") });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const supabase = await createSupabaseServerClient();
  const { data: orgId, error } = await supabase.rpc("create_organization", { p_name: parsed.data.name, p_business_type: parsed.data.business_type || undefined, p_timezone: parsed.data.timezone, p_currency: "USD" });
  if (error) return fail(error.message);
  await supabase.from("organizations").update({ onboarding_step: 3 }).eq("id", orgId);
  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function setOnboardingStepAction(step: number): Promise<ActionResult> {
  const ctx = await getOrgContext();
  if (!ctx) return fail("No business");
  const supabase = await createSupabaseServerClient();
  await supabase.from("organizations").update({ onboarding_step: step }).eq("id", ctx.org.id);
  revalidatePath("/onboarding");
  return ok(undefined);
}

export async function saveAccountingPrefsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ctx = await getOrgContext();
  if (!ctx || !ctx.isOwner) return fail("Not allowed");
  const supabase = await createSupabaseServerClient();
  const currency = String(formData.get("currency") || "USD").toUpperCase().slice(0, 3);
  const { error } = await supabase.from("organization_settings").update({
    currency, cash_check_enabled: formData.get("cash_check_enabled") === "on", other_sales_enabled: formData.get("other_sales_enabled") === "on",
  }).eq("organization_id", ctx.org.id);
  if (error) return fail(error.message);
  await supabase.from("organizations").update({ currency, onboarding_step: 5 }).eq("id", ctx.org.id);
  const extra = String(formData.get("extra_categories") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (extra.length) {
    await supabase.from("expense_categories").upsert(extra.map((name, i) => ({ organization_id: ctx.org.id, name, bucket: "other" as const, sort_order: 100 + i })), { onConflict: "organization_id,name", ignoreDuplicates: true });
  }
  revalidatePath("/onboarding");
  return ok(undefined);
}

export async function saveClockSettingsAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ctx = await getOrgContext();
  if (!ctx || !ctx.isOwner) return fail("Not allowed");
  const ft = Number(formData.get("radius_ft") || 250);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("organization_settings").update({
    default_geofence_radius_m: Math.max(15, Math.round(feetToMeters(ft))),
    allow_clock_in_without_photo: formData.get("require_photo") !== "on",
    allow_clock_in_outside_radius: formData.get("block_outside") !== "on",
  }).eq("organization_id", ctx.org.id);
  if (error) return fail(error.message);
  await supabase.from("organizations").update({ onboarding_step: 7, onboarding_completed: true }).eq("id", ctx.org.id);
  revalidatePath("/", "layout");
  redirect("/dashboard?welcome=1");
}
