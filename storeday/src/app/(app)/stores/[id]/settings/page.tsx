import Link from "next/link";
import { notFound } from "next/navigation";
import { pickLocation, requireOwnerContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { LocationSettingsForm } from "@/components/locations/location-settings-form";

export const metadata = { title: "Store settings" };

export default async function StoreSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOwnerContext();
  const { id } = await params;
  const loc = pickLocation(ctx, id);
  if (!loc || loc.id !== id) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: s } = await supabase.from("location_settings").select("*").eq("location_id", loc.id).maybeSingle();
  return (
    <div className="max-w-2xl">
      <PageHeader title={`${loc.name} settings`} back={{ href: `/stores/${loc.id}`, label: loc.name }}
        description={<>Clock-in radius and address live in <Link href={`/stores/${loc.id}/edit`} className="text-accent hover:underline">Edit store</Link>.</>} />
      <Card><CardBody className="pt-4">
        <LocationSettingsForm locationId={loc.id} currency={ctx.org.currency} initial={{
          require_accounting_closeout: s?.require_accounting_closeout ?? true,
          require_closing_checklist: s?.require_closing_checklist ?? false,
          require_opening_checklist: s?.require_opening_checklist ?? false,
          require_employee_verification: s?.require_employee_verification ?? true,
          require_cash_count: s?.require_cash_count ?? false,
          require_manager_approval: s?.require_manager_approval ?? false,
          starting_cash: Number(s?.starting_cash ?? 0),
          opens_at: s?.opens_at ?? null,
          closes_at: s?.closes_at ?? null,
        }} />
      </CardBody></Card>
    </div>
  );
}
