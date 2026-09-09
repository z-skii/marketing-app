import { requireOwnerContext } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { NewStoreForm } from "@/components/locations/new-store-form";

export const metadata = { title: "Add store" };

export default async function NewStorePage() {
  const ctx = await requireOwnerContext();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Add store" description="Name, address and coordinates for Verified Shift clock-ins." back={{ href: "/stores", label: "Stores" }} />
      <Card><CardBody className="pt-4"><NewStoreForm defaultTimezone={ctx.org.timezone} /></CardBody></Card>
    </div>
  );
}
