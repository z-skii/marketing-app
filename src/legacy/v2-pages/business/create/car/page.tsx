import { requireBusinessContext } from "@/lib/v2/core";
import { loadPrefill, loadWizardBusiness } from "@/app/(v2)/business/create/prefill";
import { CarWizard } from "./CarWizard";

export const metadata = { title: "Car advertising" };
export const dynamic = "force-dynamic";

export default async function CarCreatePage({
  searchParams,
}: { searchParams: Promise<{ rec?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create/car"), searchParams]);
  const business = ctx.activeBusiness;
  const [full, prefill] = await Promise.all([
    loadWizardBusiness(business.id),
    loadPrefill(params.rec, business.id, "car_ads"),
  ]);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 pb-32 md:px-8 md:py-8">
      <p className="text-sm text-ink-faint">{business.name}  ·  Car advertising</p>
      <div className="mt-3">
        <CarWizard business={full} defaultCity={full.city ?? ctx.city ?? ""} prefill={prefill} />
      </div>
    </main>
  );
}
