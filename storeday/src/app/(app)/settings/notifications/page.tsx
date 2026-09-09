import type { Metadata } from "next";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { NotificationPrefsForm, type PrefsValues } from "@/components/settings/notification-prefs-form";
import { NOTIFICATION_KINDS } from "@/components/notifications/kinds";

export const metadata: Metadata = { title: "Notification preferences" };

export default async function NotificationSettingsPage() {
  const ctx = await requireManagerContext();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("notification_preferences").select("prefs").eq("organization_id", ctx.org.id).eq("user_id", ctx.user.id).maybeSingle();
  const prefs = (data?.prefs && typeof data.prefs === "object" && !Array.isArray(data.prefs) ? data.prefs : {}) as Record<string, unknown>;
  const values: PrefsValues = {
    enabled: Object.fromEntries(NOTIFICATION_KINDS.map((k) => [k.kind, typeof prefs[k.kind] === "boolean" ? (prefs[k.kind] as boolean) : k.defaultOn])),
    cash_shortage_threshold: typeof prefs.cash_shortage_threshold === "number" ? prefs.cash_shortage_threshold : Number(prefs.cash_shortage_threshold) || 20,
    large_expense_threshold: typeof prefs.large_expense_threshold === "number" ? prefs.large_expense_threshold : Number(prefs.large_expense_threshold) || 500,
  };
  return (
    <div>
      <PageHeader title="Settings" description="Which alerts you receive for this business. Each manager sets their own." />
      <SettingsTabs active="notifications" isOwner={ctx.isOwner} />
      <NotificationPrefsForm values={values} currency={ctx.settings.currency || ctx.org.currency} />
    </div>
  );
}
