import { BusinessShell } from "../../../parts";
import { Attribution } from "./Attribution";

/** Attribution: which campaign or creator creates repeat customers. Counts only. source=<key> opens one source. Fixture state only. */
export default async function AttributionPage({ searchParams }: { searchParams: Promise<{ source?: string }> }) {
  const sp = await searchParams;
  return <BusinessShell bare active="Business" title="Attribution" mainClass="loy-main"><Attribution initial={sp.source ? `${sp.source}` : null} /></BusinessShell>;
}
