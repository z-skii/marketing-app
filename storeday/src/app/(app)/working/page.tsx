import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { activeShifts } from "@/lib/data/team";
import { todayIn } from "@/lib/utils/time";
import { PageHeader } from "@/components/ui/misc";
import { WhosWorking, type WorkingStore } from "@/components/shifts/whos-working";

export const metadata: Metadata = { title: "Who's Working" };

export default async function WorkingPage() {
  const ctx = await requireManagerContext();
  const supabase = await createSupabaseServerClient();
  const todays = Array.from(new Set(ctx.locations.map((l) => todayIn(l.timezone))));

  const [active, { data: completed }] = await Promise.all([
    activeShifts(supabase, ctx.org.id),
    supabase
      .from("shifts")
      .select("id, employee_id, location_id, business_date, clock_in_at, clock_out_at, worked_minutes, verification_status, employees(first_name, last_name)")
      .eq("organization_id", ctx.org.id)
      .eq("status", "completed")
      .in("business_date", todays)
      .order("clock_in_at"),
  ]);

  const stores: WorkingStore[] = ctx.locations.map((l) => {
    const today = todayIn(l.timezone);
    return {
      id: l.id,
      name: l.name,
      timezone: l.timezone,
      active: active.filter((s) => s.location_id === l.id).map((s) => ({
        id: s.id, employee_id: s.employee_id, employee_name: s.employee_name, clock_in_at: s.clock_in_at, break_minutes: s.break_minutes, verification_status: s.verification_status,
      })),
      completed: (completed ?? []).filter((s) => s.location_id === l.id && s.business_date === today).map((s) => {
        const e = s.employees as { first_name: string; last_name: string } | null;
        return {
          id: s.id, employee_id: s.employee_id, employee_name: `${e?.first_name ?? ""} ${e?.last_name ?? ""}`.trim() || "Employee",
          clock_in_at: s.clock_in_at, clock_out_at: s.clock_out_at, worked_minutes: s.worked_minutes, verification_status: s.verification_status,
        };
      }),
    };
  });

  return (
    <div>
      <PageHeader
        title="Who's Working"
        description="Live from Verified Shift clock-ins. Updates automatically."
        actions={<Link href="/shifts/new" className="inline-flex h-8.5 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-[13.5px] hover:bg-surface-2"><Plus className="h-3.5 w-3.5" />Add shift manually</Link>}
      />
      <WhosWorking orgId={ctx.org.id} stores={stores} />
    </div>
  );
}
