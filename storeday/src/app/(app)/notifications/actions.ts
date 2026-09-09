"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { parseMoneyInput } from "@/lib/utils/currency";
import { NOTIFICATION_KINDS } from "@/components/notifications/kinds";

function revalidate() {
  revalidatePath("/notifications");
  revalidatePath("/", "layout"); // unread badge in the shell
}

export async function markReadAction(id: string): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", ctx.user.id).is("read_at", null);
  if (error) return fail(error.message);
  revalidate();
  return ok(undefined);
}

export async function markAllReadAction(): Promise<ActionResult<{ count: number }>> {
  const ctx = await requireOrgContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", ctx.user.id).is("read_at", null).select("id");
  if (error) return fail(error.message);
  revalidate();
  return ok({ count: data?.length ?? 0 });
}

export interface NotificationPrefs {
  [key: string]: boolean | number | undefined;
  cash_shortage_threshold?: number;
  large_expense_threshold?: number;
}

/**
 * Saves the signed-in user's preferences for the active organization (notification_preferences.prefs JSON).
 * Form fields: one checkbox per kind (name = kind), cash_shortage_threshold, large_expense_threshold.
 */
export async function saveNotificationPreferencesAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) return fail("Notification preferences apply to managers and owners");
  const prefs: NotificationPrefs = {};
  for (const k of NOTIFICATION_KINDS) prefs[k.kind] = formData.get(k.kind) === "on";
  const cash = parseMoneyInput(String(formData.get("cash_shortage_threshold") ?? ""));
  const large = parseMoneyInput(String(formData.get("large_expense_threshold") ?? ""));
  if (cash != null && cash < 0) return fail("Cash shortage threshold cannot be negative");
  if (large != null && large < 0) return fail("Large expense threshold cannot be negative");
  prefs.cash_shortage_threshold = cash ?? 20;
  prefs.large_expense_threshold = large ?? 500;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notification_preferences").upsert(
    { organization_id: ctx.org.id, user_id: ctx.user.id, prefs },
    { onConflict: "organization_id,user_id" },
  );
  if (error) return fail(error.message);
  revalidatePath("/settings/notifications");
  return ok(undefined);
}
