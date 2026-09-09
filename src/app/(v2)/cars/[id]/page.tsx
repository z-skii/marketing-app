import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Old address. Vehicles are private now and managed from Profile. */
export default async function LegacyVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/me/vehicles/${encodeURIComponent(id)}`);
}
