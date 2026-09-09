"use server";

import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import {
  ensureConversation, notify, requireBusinessMember, requireOnboarded, systemMessage,
} from "@/lib/v2/core";
import { payMarketplaceWork, InsufficientCreditError } from "@/lib/v2/money";
import { getCampaign } from "@/lib/v2/campaigns";

/**
 * Campaign participation and review. Every action re-checks authorization
 * server-side: creators touch only their own applications/submissions,
 * review belongs to the campaign's business members, approval pays through
 * the ledger, never a client-supplied number.
 */

type Result = { ok: boolean; error?: string };

const fail = (error: string): Result => ({ ok: false, error });

async function openCampaignOrNull(campaignId: string) {
  const campaign = await getCampaign(campaignId);
  if (!campaign || campaign.status !== "open") return null;
  if (campaign.deadline && new Date(campaign.deadline) < new Date()) return null;
  return campaign;
}

// ------------------------------------------------------------- creator side

export async function applyToCampaign(campaignId: string, message: string): Promise<Result> {
  const ctx = await requireOnboarded();
  const campaign = await openCampaignOrNull(campaignId);
  if (!campaign) return fail("This job is no longer open.");
  if (campaign.business_owner_id === ctx.user.id) return fail("This is your own campaign.");
  if (campaign.verified_only) {
    const verified = await sqlOne(
      `select 1 as x from creator_profiles where profile_id = $1 and verification = 'verified'`,
      [ctx.user.id],
    );
    if (!verified) return fail("This job needs a verified creator profile. Request verification on your profile.");
  }

  await sql(
    `insert into applications (campaign_id, applicant_id, message)
     values ($1, $2, nullif($3, ''))
     on conflict (campaign_id, applicant_id) do nothing`,
    [campaignId, ctx.user.id, message.trim().slice(0, 1000)],
  );
  await notify(
    campaign.business_owner_id, "application",
    `New applicant for "${campaign.title}"`,
    { body: `@${ctx.user.username} applied.`, href: `/business/campaigns/${campaignId}` },
  );
  revalidatePath(`/o/${campaignId}`);
  revalidatePath(`/business/campaigns/${campaignId}`);
  return { ok: true };
}

export async function withdrawApplication(campaignId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  await sql(
    `update applications set status = 'withdrawn', decided_at = now()
      where campaign_id = $1 and applicant_id = $2 and status = 'applied'`,
    [campaignId, ctx.user.id],
  );
  revalidatePath(`/o/${campaignId}`);
  revalidatePath(`/business/campaigns/${campaignId}`);
  return { ok: true };
}

export async function submitWork(
  campaignId: string,
  input: { mediaUrls: string[]; note: string; rightsAck: boolean },
): Promise<Result> {
  const ctx = await requireOnboarded();
  const campaign = await openCampaignOrNull(campaignId);
  if (!campaign) return fail("This campaign is no longer open.");
  if (campaign.business_owner_id === ctx.user.id) return fail("This is your own campaign.");
  if (!input.rightsAck) return fail("Confirm the content-rights note before submitting.");
  const mediaUrls = (input.mediaUrls ?? []).filter((u) => typeof u === "string").slice(0, 10);
  if (mediaUrls.length === 0) return fail("Upload your work first.");
  if (campaign.approved_count >= campaign.slots) return fail("All spots are already filled.");

  if (campaign.verified_only) {
    const verified = await sqlOne(
      `select 1 as x from creator_profiles where profile_id = $1 and verification = 'verified'`,
      [ctx.user.id],
    );
    if (!verified) return fail("This campaign needs a verified creator profile.");
  }

  // One live submission per creator per campaign; a revision replaces it.
  const existing = await sqlOne<{ id: string; status: string }>(
    `select id, status::text as status from submissions
      where campaign_id = $1 and creator_id = $2
      order by created_at desc limit 1`,
    [campaignId, ctx.user.id],
  );
  if (existing && ["submitted", "under_review", "approved", "paid"].includes(existing.status)) {
    return fail("You already have a submission in review here.");
  }

  const submission = await sqlOne<{ id: string }>(
    `insert into submissions (campaign_id, creator_id, media_urls, note, rights_ack)
     values ($1, $2, $3, nullif($4, ''), true) returning id`,
    [campaignId, ctx.user.id, mediaUrls, input.note.trim().slice(0, 2000)],
  );

  const conversation = await ensureConversation("campaign", campaignId, [
    ctx.user.id, campaign.business_owner_id,
  ]);
  await systemMessage(conversation, `@${ctx.user.username} uploaded a submission.`);
  await notify(
    campaign.business_owner_id, "submission",
    `New submission for "${campaign.title}"`,
    { body: `@${ctx.user.username} submitted work to review.`, href: `/business/campaigns/${campaignId}` },
  );
  revalidatePath(`/o/${campaignId}`);
  revalidatePath(`/business/campaigns/${campaignId}`);
  return submission ? { ok: true } : fail("Could not submit. Try again.");
}

// ------------------------------------------------------------ business side

async function requireCampaignManager(campaignId: string) {
  const ctx = await requireOnboarded();
  const campaign = await getCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found.");
  await requireBusinessMember(ctx.user.id, campaign.business_id, ["owner", "manager"]);
  return { ctx, campaign };
}

export async function decideApplication(
  applicationId: string,
  decision: "accepted" | "declined",
): Promise<Result> {
  const app = await sqlOne<{ campaign_id: string; applicant_id: string; status: string }>(
    `select campaign_id, applicant_id, status::text as status from applications where id = $1`,
    [applicationId],
  );
  if (!app) return fail("Application not found.");
  let campaignTitle = "";
  try {
    const { campaign } = await requireCampaignManager(app.campaign_id);
    campaignTitle = campaign.title;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  if (app.status !== "applied") return fail("Already decided.");

  await sql(
    `update applications set status = $2, decided_at = now() where id = $1`,
    [applicationId, decision],
  );
  await notify(
    app.applicant_id, "application",
    decision === "accepted"
      ? `You got the job: "${campaignTitle}"`
      : `Update on "${campaignTitle}"`,
    {
      body: decision === "accepted"
        ? "The business accepted your application. Check the details and get started."
        : "The business went with someone else this time.",
      href: `/o/${app.campaign_id}`,
    },
  );
  revalidatePath(`/o/${app.campaign_id}`);
  revalidatePath(`/business/campaigns/${app.campaign_id}`);
  return { ok: true };
}

export async function reviewSubmission(
  submissionId: string,
  decision: "approved" | "rejected" | "revision_requested",
  note: string,
): Promise<Result> {
  const submission = await sqlOne<{ id: string; campaign_id: string; creator_id: string; status: string }>(
    `select id, campaign_id, creator_id, status::text as status from submissions where id = $1`,
    [submissionId],
  );
  if (!submission) return fail("Submission not found.");

  let managed;
  try {
    managed = await requireCampaignManager(submission.campaign_id);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  const { ctx, campaign } = managed;
  if (!["submitted", "under_review", "revision_requested"].includes(submission.status)) {
    return fail("This submission was already decided.");
  }
  const cleanNote = note.trim().slice(0, 1000);
  if (decision !== "approved" && !cleanNote) {
    return fail("Tell the creator why. A short reason helps them fix it.");
  }
  if (decision === "approved" && campaign.approved_count >= campaign.slots) {
    return fail("All paid spots are already used. Close the campaign or add slots.");
  }

  if (decision === "approved") {
    // Money moves first; if the wallet can't cover it nothing changes.
    try {
      await payMarketplaceWork({
        payerId: campaign.business_owner_id,
        workerId: submission.creator_id,
        amountCents: campaign.pay_cents,
        source: "submission",
        sourceId: submission.id,
        memo: `Approved work: ${campaign.title}`,
      });
    } catch (e) {
      if (e instanceof InsufficientCreditError) return fail(e.message);
      if (e instanceof Error && e.message.includes("already been paid")) return fail("Already paid.");
      throw e;
    }
    await sql(
      `update submissions set status = 'paid', review_note = nullif($2, ''),
              reviewed_at = now(), paid_at = now() where id = $1`,
      [submissionId, cleanNote],
    );
    await sql(
      `update creator_profiles set completed_jobs = completed_jobs + 1 where profile_id = $1`,
      [submission.creator_id],
    );
    // Filling the last slot completes the campaign.
    const fresh = await getCampaign(campaign.id);
    if (fresh && fresh.approved_count >= fresh.slots) {
      await sql(`update campaigns set status = 'completed' where id = $1 and status = 'open'`, [campaign.id]);
    }
  } else {
    await sql(
      `update submissions set status = $2, review_note = $3, reviewed_at = now() where id = $1`,
      [submissionId, decision, cleanNote],
    );
  }

  const conversation = await ensureConversation("campaign", campaign.id, [
    submission.creator_id, ctx.user.id,
  ]);
  const line =
    decision === "approved" ? "Submission approved. Payment sent."
    : decision === "rejected" ? "Submission was not approved."
    : "Revision requested.";
  await systemMessage(conversation, line);
  await notify(
    submission.creator_id, "submission",
    decision === "approved"
      ? `Approved! You earned from "${campaign.title}"`
      : decision === "rejected"
        ? `Submission not approved: "${campaign.title}"`
        : `Revision requested: "${campaign.title}"`,
    { body: cleanNote || undefined, href: `/o/${campaign.id}` },
  );
  revalidatePath(`/o/${campaign.id}`);
  revalidatePath(`/business/campaigns/${campaign.id}`);
  return { ok: true };
}

export async function closeCampaign(campaignId: string): Promise<Result> {
  try {
    await requireCampaignManager(campaignId);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  await sql(
    `update campaigns set status = 'closed' where id = $1 and status in ('open', 'paused')`,
    [campaignId],
  );
  revalidatePath(`/o/${campaignId}`);
  revalidatePath(`/business/campaigns/${campaignId}`);
  return { ok: true };
}
