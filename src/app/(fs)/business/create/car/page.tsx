import { requireBusinessContext } from "@/lib/v2/core";
import { loadPrefill, loadWizardBusiness } from "@/app/(v2)/business/create/prefill";
import { loadFunding } from "@/lib/fs/funding";
import { CarFlow } from "@/components/fs/business/flows/CarFlow";

export const metadata = { title: "Car advertising" };
export const dynamic = "force-dynamic";

export default async function CarCreatePage({ searchParams }: { searchParams: Promise<{ rec?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create/car"), searchParams]);
  const business = ctx.activeBusiness;
  const [full, prefill, funding] = await Promise.all([
    loadWizardBusiness(business.id),
    loadPrefill(params.rec, business.id, "car_ads"),
    loadFunding(business.id),
  ]);
  return <CarFlow business={full} defaultCity={full.city ?? ctx.city ?? ""} prefill={prefill} funding={funding} />;
}
