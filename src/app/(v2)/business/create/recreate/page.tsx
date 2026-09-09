import { requireBusinessContext } from "@/lib/v2/core";
import { loadPrefill, loadWizardBusiness } from "../prefill";
import { RecreateWizard } from "./RecreateWizard";

export const metadata = { title: "Recreate a Reel" };
export const dynamic = "force-dynamic";

export default async function RecreateCreatePage({
  searchParams,
}: { searchParams: Promise<{ rec?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create/recreate"), searchParams]);
  const business = ctx.activeBusiness;
  const [full, prefill] = await Promise.all([
    loadWizardBusiness(business.id),
    loadPrefill(params.rec, business.id, "recreate_reel"),
  ]);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 pb-32 md:px-8 md:py-8">
      <p className="text-sm text-ink-faint">{business.name}  ·  Recreate a Reel</p>
      <div className="mt-3">
        <RecreateWizard business={full} defaultCity={full.city ?? ctx.city ?? ""} prefill={prefill} />
      </div>
    </main>
  );
}
