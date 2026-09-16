import { requireBusinessContext } from "@/lib/v2/core";
import { loadPrefill, loadWizardBusiness } from "@/app/(v2)/business/create/prefill";
import { getBrief } from "@/lib/ai/briefs";
import { getTrendForBusiness } from "@/lib/trends";
import { loadFunding } from "@/lib/fs/funding";
import { RecreateFlow, type StoredBriefProp } from "@/components/fs/business/flows/RecreateFlow";

export const metadata = { title: "Recreate a Reel" };
export const dynamic = "force-dynamic";

export default async function RecreateCreatePage({ searchParams }: { searchParams: Promise<{ rec?: string; brief?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create/recreate"), searchParams]);
  const business = ctx.activeBusiness;
  const [full, prefill, stored, funding] = await Promise.all([
    loadWizardBusiness(business.id),
    loadPrefill(params.rec, business.id, "recreate_reel"),
    params.brief && /^[0-9a-f-]{36}$/i.test(params.brief) ? getBrief(params.brief, business.id) : Promise.resolve(null),
    loadFunding(business.id),
  ]);
  let storedBrief: StoredBriefProp | null = null;
  if (stored && stored.status === "draft") {
    const trend = stored.trend_id ? await getTrendForBusiness(stored.trend_id, business.id) : null;
    storedBrief = { id: stored.id, trendId: stored.trend_id, brief: stored.brief, source: stored.source, referenceUrl: trend?.reference_url ?? null, referenceMediaUrl: trend?.media_url ?? null };
  }
  return <RecreateFlow business={full} defaultCity={full.city ?? ctx.city ?? ""} prefill={prefill} storedBrief={storedBrief} funding={funding} />;
}
