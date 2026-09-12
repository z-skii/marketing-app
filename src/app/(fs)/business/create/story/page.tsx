import { requireBusinessContext } from "@/lib/v2/core";
import { loadPrefill, loadWizardBusiness } from "@/app/(v2)/business/create/prefill";
import { listCreativeAssets } from "@/lib/openai/assets";
import { loadFunding } from "@/lib/fs/funding";
import { StoryFlow, type ApprovedCreative } from "@/components/fs/business/flows/StoryFlow";

export const metadata = { title: "Instagram Story ads" };
export const dynamic = "force-dynamic";

export default async function StoryCreatePage({ searchParams }: { searchParams: Promise<{ rec?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/create/story"), searchParams]);
  const business = ctx.activeBusiness;
  const [full, prefill, assets, funding] = await Promise.all([
    loadWizardBusiness(business.id),
    loadPrefill(params.rec, business.id, "instagram_story"),
    listCreativeAssets(business.id, { type: "STORY_AD", status: "approved", limit: 12 }).catch(() => []),
    loadFunding(business.id),
  ]);
  const approved: ApprovedCreative[] = assets.map((a) => ({ id: a.id, url: a.url, label: `Approved Story creative · ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(a.approved_at ?? a.created_at))}` }));
  return <StoryFlow business={full} defaultCity={full.city ?? ctx.city ?? ""} prefill={prefill} approved={approved} funding={funding} />;
}
