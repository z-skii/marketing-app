import { redirect } from "next/navigation";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { getGoogleConnection, selectGoogleLocation, type GoogleLocationSummary, type GoogleMeta } from "@/lib/google/oauth";
import { runGoogleHealth } from "@/lib/google/business";
import { LocationPicker } from "./LocationPicker";

export const metadata = { title: "Pick a Google location" };
export const dynamic = "force-dynamic";

/**
 * After Google's consent screen: the locations Google listed for the
 * account. One location is picked on the spot; several need a choice.
 * Anything else (no pending row, no locations) goes back to Connections.
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
    try {
      await runGoogleHealth(business.id);
    } catch (error) {
      console.error("google: first check after connecting failed:", error);
    }
    redirect("/business/google?connected=1");
  }

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings/connections" label="Connections" />
      <h2 className="eyebrow mt-3">Google Business Profile</h2>
      <h1 className="mt-2 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Which location is {business.name}?</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Google lists {locations.length} locations on that account. TapMart manages one.</p>
      <LocationPicker locations={locations.map((l) => ({ name: l.name, title: l.title, address: l.address }))} />
    </main>
  );
}
