"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Refreshes the page when any checklist submission of the org changes (someone starts/completes a checklist). */
export function ChecklistRealtimeRefresh({ orgId }: { orgId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`checklists:${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "checklist_submissions", filter: `organization_id=eq.${orgId}` }, () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId, router]);
  return null;
}
