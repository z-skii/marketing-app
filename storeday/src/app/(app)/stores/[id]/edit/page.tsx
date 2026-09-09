import { notFound } from "next/navigation";
import { pickLocation, requireOwnerContext } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { EditStoreForm } from "@/components/locations/edit-store-form";

export const metadata = { title: "Edit store" };

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOwnerContext();
  const { id } = await params;
  const loc = pickLocation(ctx, id);
  if (!loc || loc.id !== id) notFound();
  return (
    <div className="max-w-2xl">
      <PageHeader title={`Edit ${loc.name}`} back={{ href: `/stores/${loc.id}`, label: loc.name }} />
      <Card><CardBody className="pt-4">
        <EditStoreForm defaultTimezone={ctx.org.timezone} initial={{
          id: loc.id, name: loc.name, address_line1: loc.address_line1, city: loc.city, state: loc.state, postal_code: loc.postal_code,
          phone: loc.phone, timezone: loc.timezone, latitude: loc.latitude, longitude: loc.longitude, geofence_radius_m: loc.geofence_radius_m,
        }} />
      </CardBody></Card>
    </div>
  );
}
