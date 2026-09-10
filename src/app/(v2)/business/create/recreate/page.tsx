import { requireBusinessContext } from "@/lib/v2/core";
import { loadPrefill, loadWizardBusiness } from "../prefill";
import { getBrief } from "@/lib/ai/briefs";
import { getTrendForBusiness } from "@/lib/trends";
import { RecreateWizard, type StoredBriefProp } from "./RecreateWizard";

export const metadata = { title: "Recreate a Reel" };
export const dynamic = "force-dynamic";

export default async function RecreateCreatePage({
  searchParams,
}: { searchParams: Promise<{ rec?: string; brief?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create/recreate"), searchParams]);
  const business = ctx.activeBusiness;
  const [full, prefill, stored] = await Promise.all([
    loadWizardBusiness(business.id),
    loadPrefill(params.rec, business.id, "recreate_reel"),
    params.brief && /^[0-9a-f-]{36}$/i.test(params.brief) ? getBrief(params.brief, business.id) : Promise.resolve(null),
  ]);
  let storedBrief: StoredBriefProp | null = null;
  if (stored && stored.status === "draft") {
    const trend = stored.trend_id ? await getTrendForBusiness(stored.trend_id, business.id) : null;
    storedBrief = {
      id: stored.id, trendId: stored.trend_id, brief: stored.brief, source: stored.source,
      referenceUrl: trend?.reference_url ?? null, referenceMediaUrl: trend?.media_url ?? null,
    };
  }

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 pb-32 md:px-8 md:py-8">
      <p className="text-sm text-ink-faint">{business.name}  ·  Recreate a Reel</p>
      <div className="mt-3">
        <RecreateWizard business={full} defaultCity={full.city ?? ctx.city ?? ""} prefill={prefill} storedBrief={storedBrief} />
      </div>
    </main>
  );
}
