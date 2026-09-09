import Link from "next/link";
import { Plus } from "lucide-react";
import { requireManagerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { accountingByLocation } from "@/lib/data/accounting";
import { gatherBriefInput, RuleBasedBriefGenerator } from "@/lib/brief";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { LocationCard } from "@/components/dashboard/location-card";

export const metadata = { title: "Stores" };

export default async function StoresPage() {
  const ctx = await requireManagerContext();
  const supabase = await createSupabaseServerClient();
  const locIds = ctx.locations.map((l) => l.id);
  const addButton = ctx.isOwner ? (
    <Link href="/stores/new" className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-md bg-accent text-white text-[13.5px] font-medium hover:bg-accent-hover"><Plus className="h-4 w-4" />Add store</Link>
  ) : undefined;

  if (locIds.length === 0) {
    return (
      <>
        <PageHeader title="Stores" actions={addButton} />
        <EmptyState title="No stores yet" description={ctx.isOwner ? "Add your first store to get started." : "You have not been assigned to a store yet."} action={addButton} />
      </>
    );
  }

  const [today, briefInput, assigned] = await Promise.all([
    accountingByLocation(supabase, ctx.org.id, ctx.today, ctx.today),
    gatherBriefInput(supabase, ctx, ctx.today),
    supabase.from("employee_locations").select("location_id, employees!inner(employment_status)").in("location_id", locIds).eq("employees.employment_status", "active"),
  ]);
  const brief = await new RuleBasedBriefGenerator().generate(briefInput);
  const todayBy = new Map(today.map((r) => [r.location_id, r]));
  const assignedBy = new Map<string, number>();
  for (const a of assigned.data ?? []) assignedBy.set(a.location_id, (assignedBy.get(a.location_id) ?? 0) + 1);

  return (
    <>
      <PageHeader title="Stores" description={`${ctx.locations.length} active · today's numbers`} actions={addButton} />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {briefInput.stores.map((s) => {
          const loc = ctx.locations.find((l) => l.id === s.location.id);
          const acc = todayBy.get(s.location.id);
          const address = [loc?.address_line1, loc?.city, loc?.state].filter(Boolean).join(", ");
          return (
            <LocationCard key={s.location.id} currency={ctx.org.currency} rangeLabel="Today"
              store={{ id: s.location.id, name: s.location.name, address, sales: acc?.total_sales ?? 0, profit: acc?.profit ?? 0, status: s.status, employeesAssigned: assignedBy.get(s.location.id) ?? 0, items: brief.attention.filter((i) => i.locationId === s.location.id) }} />
          );
        })}
      </div>
    </>
  );
}
