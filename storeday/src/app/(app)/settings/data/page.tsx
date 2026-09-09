import type { Metadata } from "next";
import Link from "next/link";
import { requireOwnerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { DataTools } from "@/components/settings/data-tools";
import { ActivityLog } from "@/components/settings/activity-log";
import { loadActivityLog } from "../activity-data";

export const metadata: Metadata = { title: "Data & activity" };

export default async function DataSettingsPage() {
  const ctx = await requireOwnerContext();
  const supabase = await createSupabaseServerClient();
  const entries = await loadActivityLog(supabase, ctx, 100);
  return (
    <div>
      <PageHeader title="Settings" description="Exports, demo data and the audit trail of changes." />
      <SettingsTabs active="data" isOwner />
      <div className="space-y-6">
        <DataTools exportHref="/api/export/csv?report=daily&range=this_year" isDemo={ctx.org.is_demo} />
        <section>
          <div className="flex items-center justify-between mb-1.5">
            <h2 className="text-[13px] font-semibold">Activity log <span className="text-text-3 font-normal">(last {entries.length})</span></h2>
            <Link href="/settings/activity" className="text-[12.5px] text-accent hover:underline">Open full page</Link>
          </div>
          <ActivityLog entries={entries} timezone={ctx.org.timezone} />
        </section>
      </div>
    </div>
  );
}
