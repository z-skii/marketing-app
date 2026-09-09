import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Old address. The vehicle wizard lives under Profile now; the query string (e.g. ?return=) rides along. */
export default async function LegacyNewVehiclePage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") usp.set(key, value);
    else if (Array.isArray(value)) for (const v of value) usp.append(key, v);
  }
  const qs = usp.toString();
  redirect(`/me/vehicles/new${qs ? `?${qs}` : ""}`);
}
