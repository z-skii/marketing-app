import type { Metadata } from "next";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { ActivityLog } from "@/components/settings/activity-log";
import { loadActivityLog } from "../activity-data";

export const metadata: Metadata = { title: "Activity log" };

export default async function ActivityPage() {
  const ctx = await requireManagerContext();
  const supabase = await createSupabaseServerClient();
  const entries = await loadActivityLog(supabase, ctx, 100);
  return (
    <div>
      <PageHeader title="Settings" description="The last 100 audited changes: closed and reopened days, edits, hour corrections, settings." />
      <SettingsTabs active="activity" isOwner={ctx.isOwner} />
      <ActivityLog entries={entries} timezone={ctx.org.timezone} />
    </div>
  );
}
