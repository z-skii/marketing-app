import { redirect } from "next/navigation";
import { requireBusinessContext } from "@/lib/v2/core";
import { getGoogleConnection, selectGoogleLocation, type GoogleLocationSummary, type GoogleMeta } from "@/lib/google/oauth";
import { runGoogleHealth } from "@/lib/google/business";
import { UtilityHead } from "@/components/fs/settings/Rows";
import { LocationPicker } from "@/components/fs/settings/GoogleControls";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Pick a Google location" };
export const dynamic = "force-dynamic";

/**
 * After Google's consent screen: the locations Google listed for the
 * account. One location is picked on the spot; several need a choice.
 * Anything else goes back to Connections.
 */
export default async function GoogleLocationPage() {
  const ctx = await requireBusinessContext("/business/settings/connections/google");
  const business = ctx.activeBusiness;
  const row = await getGoogleConnection(business.id);
  const locations = ((row?.meta as GoogleMeta | undefined)?.locations ?? []) as GoogleLocationSummary[];

  if (!row || row.status === "disconnected") redirect("/business/settings/connections");
  if (row.status === "connected") redirect("/business/google");
  if (row.status !== "pending" || locations.length === 0) redirect("/business/settings/connections?error=no_locations&provider=google");
  if (locations.length === 1) {
    await selectGoogleLocation(business.id, locations[0].name);
    try { await runGoogleHealth(business.id); } catch (error) { console.error("google: first check after connecting failed:", error); }
    redirect("/business/google?connected=1");
  }

  return (
    <main className="fs-phone-main fs-utility" id="main">
      <UtilityHead title={`Which location is ${business.name}?`} lede={`Google lists ${locations.length} locations on that account. TapMart manages one.`} back={<BackLink fallback="/business/settings/connections" label="Connections" />} />
      <LocationPicker locations={locations.map((l) => ({ name: l.name, title: l.title, address: l.address }))} />
    </main>
  );
}
