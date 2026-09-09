import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import {
  getApplications, getCampaign, getMyParticipation, getSubmissions,
} from "@/lib/v2/campaigns";
import { Avatar, Chip, MetaLine, Money, SectionTitle, StatusChip } from "@/components/v2/ui";
import { SaveButton } from "@/components/v2/SaveButton";
import {
  ApplyForm, DecideApplication, ReviewControls, ReviewStars, SubmitForm, WithdrawButton,
} from "./CampaignActions";

export const dynamic = "force-dynamic";

const NEEDS_APPLICATION = new Set(["photography", "videography", "general"]);

/**
 * One campaign, three views: a creator sees the brief and the one action
 * that applies to them (apply or submit); the business sees applications and
 * the submission review queue; everyone sees the same facts.
 */
export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;

  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const isManager = ctx.businesses.some((b) => b.id === campaign.business_id);
  if (campaign.status === "draft" && !isManager) notFound();

  const [mine, submissions, applications, saved] = await Promise.all([
    getMyParticipation(id, ctx.user.id),
    isManager ? getSubmissions(id) : Promise.resolve([]),
    isManager && NEEDS_APPLICATION.has(campaign.kind) ? getApplications(id) : Promise.resolve([]),
    sqlOne(
      `select 1 as x from saved_items where profile_id = $1 and item_type = 'campaign' and item_id = $2`,
      [ctx.user.id, id],
    ),
  ]);

  const applicationBased = NEEDS_APPLICATION.has(campaign.kind);
  const accepted = mine.application?.status === "accepted";
  const open = campaign.status === "open" &&
    (!campaign.deadline || new Date(campaign.deadline) > new Date());
  const spotsLeft = Math.max(campaign.slots - campaign.approved_count, 0);
  const liveSubmission = mine.submissions.find((s) =>
    ["submitted", "under_review", "approved", "paid"].includes(s.status));
  const revisionAsked = mine.submissions.find((s) => s.status === "revision_requested");

  const canSubmit =
    open && !isManager && spotsLeft > 0 && !liveSubmission &&
    (!applicationBased || accepted) &&
    (!campaign.verified_only || mine.isVerified);

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <BackButton fallback="/jobs" label="Jobs" />

      <header className="mt-3">
        <div className="flex items-center gap-3">
          <Link href={`/b/${campaign.business_slug}`} className="flex min-w-0 items-center gap-2.5">
            <Avatar src={campaign.business_logo} name={campaign.business_name} size={36} />
            <span className="truncate font-mono text-xs font-600">{campaign.business_name}</span>
          </Link>
          <span className="ml-auto flex items-center gap-2">
            <StatusChip status={campaign.status} />
            <SaveButton itemType="campaign" itemId={campaign.id} initialSaved={Boolean(saved)} />
          </span>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl leading-[0.98] font-900 tracking-[-0.03em]">
            {campaign.title}
          </h1>
          <Money cents={campaign.pay_cents} suffix={applicationBased ? undefined : " each"} />
        </div>
        <MetaLine
          parts={[
            campaign.city,
            campaign.deadline &&
              `due ${new Date(campaign.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            campaign.event_at &&
              `on ${new Date(campaign.event_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`,
            `${spotsLeft} of ${campaign.slots} spot${campaign.slots === 1 ? "" : "s"} left`,
            campaign.verified_only ? "verified creators only" : null,
          ]}
        />
      </header>

      <section className="mt-5 whitespace-pre-wrap text-sm leading-relaxed">{campaign.brief}</section>

      {campaign.reference_url && (
        <p className="mt-3">
          <a href={campaign.reference_url} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-signal underline underline-offset-2">
            View reference ↗
          </a>
        </p>
      )}

      {campaign.requirements.length > 0 && (
        <section className="mt-5">
          <SectionTitle>Requirements</SectionTitle>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {campaign.requirements.map((r, i) => (
              <li key={i} className="flex gap-2"><span className="text-signal">—</span>{r}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5 border-l-2 border-rule pl-3">
        <p className="eyebrow">Content rights</p>
        <p className="mt-1 text-xs text-ink-faint">{campaign.rights_note}</p>
      </section>

      {/* ------------------------------------------------ creator's panel */}
      {!isManager && (
        <section className="rule mt-6 pt-5">
          {campaign.verified_only && !mine.isVerified && (
            <p className="border border-rule p-3 font-mono text-xs text-ink-faint">
              This job needs a verified creator profile.{" "}
              <Link href="/me/creator" className="text-signal underline underline-offset-2">Request verification</Link>
            </p>
          )}

          {applicationBased && !mine.application && open && !(campaign.verified_only && !mine.isVerified) && (
            <>
              <SectionTitle>Apply for this job</SectionTitle>
              <ApplyForm campaignId={campaign.id} />
            </>
          )}
          {mine.application && (
            <div className="flex items-center gap-3">
              <p className="text-sm">Your application:</p>
              <StatusChip status={mine.application.status} />
              {mine.application.status === "applied" && <WithdrawButton campaignId={campaign.id} />}
            </div>
          )}

          {canSubmit && <SubmitForm campaignId={campaign.id} rightsNote={campaign.rights_note} />}
          {revisionAsked && !liveSubmission && (
            <div className="mt-3 border border-signal p-3">
              <p className="font-mono text-xs font-600 text-signal">Revision requested</p>
              {revisionAsked.review_note && <p className="mt-1 text-sm">{revisionAsked.review_note}</p>}
            </div>
          )}

          {mine.submissions.length > 0 && (
            <div className="mt-4">
              <SectionTitle>Your submissions</SectionTitle>
              <ul className="mt-2 flex flex-col gap-2">
                {mine.submissions.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 border border-rule p-3">
                    <StatusChip status={s.status} />
                    <span className="font-mono text-[0.6875rem] text-ink-faint">
                      {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {" · "}{s.media_urls.length} file{s.media_urls.length === 1 ? "" : "s"}
                    </span>
                    {s.review_note && s.status !== "revision_requested" && (
                      <span className="w-full text-xs text-ink-faint">{s.review_note}</span>
                    )}
                    {s.status === "paid" && (
                      <span className="ml-auto"><ReviewStars contextType="submission" contextId={s.id} /></span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!open && campaign.status !== "draft" && (
            <p className="mt-3 font-mono text-xs text-ink-faint">This campaign is no longer taking submissions.</p>
          )}
        </section>
      )}

      {/* ----------------------------------------------- business's panel */}
      {isManager && (
        <section className="rule mt-6 pt-5">
          {applicationBased && (
            <div className="mb-6">
              <SectionTitle count={applications.length}>Applications</SectionTitle>
              {applications.length === 0 && (
                <p className="mt-2 font-mono text-xs text-ink-faint">No applications yet.</p>
              )}
              <ul className="mt-2 flex flex-col gap-2">
                {applications.map((a) => (
                  <li key={a.id} className="border border-rule p-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={a.avatar_url} name={a.display_name ?? a.username} size={30} />
                      <Link href={`/u/${a.username}`} className="font-mono text-xs font-600 hover:text-signal">
                        @{a.username}
                      </Link>
                      {a.verified && <Chip tone="rise">verified</Chip>}
                      <span className="font-mono text-[0.625rem] text-ink-faint">
                        {a.completed_jobs} job{a.completed_jobs === 1 ? "" : "s"} done
                      </span>
                      <span className="ml-auto"><StatusChip status={a.status} /></span>
                    </div>
                    {a.message && <p className="mt-2 text-sm">{a.message}</p>}
                    {a.status === "applied" && (
                      <div className="mt-2"><DecideApplication applicationId={a.id} /></div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <SectionTitle count={submissions.length}>Submissions</SectionTitle>
          {submissions.length === 0 && (
            <p className="mt-2 font-mono text-xs text-ink-faint">
              Nothing submitted yet — creators are seeing this campaign in their feed.
            </p>
          )}
          <ul className="mt-2 flex flex-col gap-3">
            {submissions.map((s) => (
              <li key={s.id} className="border border-rule p-3">
                <div className="flex items-center gap-2.5">
                  <Avatar src={s.creator_avatar} name={s.creator_name ?? s.creator_username} size={30} />
                  <Link href={`/u/${s.creator_username}`} className="font-mono text-xs font-600 hover:text-signal">
                    @{s.creator_username}
                  </Link>
                  {s.creator_verified && <Chip tone="rise">verified</Chip>}
                  <span className="ml-auto"><StatusChip status={s.status} /></span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {s.media_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                      {/\.(mp4|webm|mov)($|\?)/i.test(url) ? (
                        <span className="flex h-20 w-20 items-center justify-center border border-ink bg-ink font-mono text-[0.625rem] text-paper">video ↗</span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={`Submission file ${i + 1}`} className="h-20 w-20 border border-ink object-cover" />
                      )}
                    </a>
                  ))}
                </div>
                {s.note && <p className="mt-2 text-sm text-ink-faint">{s.note}</p>}
                {["submitted", "under_review", "revision_requested"].includes(s.status) && (
                  <ReviewControls submissionId={s.id} />
                )}
                {s.status === "paid" && (
                  <div className="mt-2"><ReviewStars contextType="submission" contextId={s.id} /></div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
