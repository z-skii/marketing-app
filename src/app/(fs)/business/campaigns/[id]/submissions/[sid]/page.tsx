import { redirect } from "next/navigation";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import { getSubmissions } from "@/lib/v2/campaigns";
import { getBusinessCampaign, getCreatorProvenance } from "@/lib/fs/business-campaigns";
import { loadFunding } from "@/lib/fs/funding";
import { SubmissionReview } from "@/components/fs/business/campaign/SubmissionReview";

export const dynamic = "force-dynamic";

/** One submission or Story proof, reviewed against the campaign it answers. */
export default async function SubmissionReviewPage({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  const ctx = await requireBusinessContext(`/business/campaigns/${id}/submissions/${sid}`);
  const campaign = await getBusinessCampaign(id);
  if (!campaign || campaign.business_id !== ctx.activeBusiness.id) redirect("/business/campaigns");
  try { await requireBusinessMember(ctx.user.id, campaign.business_id); } catch { redirect("/business/campaigns"); }
  const submission = (await getSubmissions(campaign.id)).find((s) => s.id === sid) ?? null;
  if (!submission) redirect(`/business/campaigns/${id}`);
  const [provenance, funding] = await Promise.all([getCreatorProvenance(submission.creator_id), loadFunding(campaign.business_id)]);
  return <SubmissionReview campaign={campaign} submission={submission} provenance={provenance} funding={funding} />;
}
