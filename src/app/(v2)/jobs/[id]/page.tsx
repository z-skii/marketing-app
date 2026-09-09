import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import {
  getApplications, getCampaign, getMyParticipation, getSubmissions,
} from "@/lib/v2/campaigns";
import { Avatar, Chip, Money, SectionTitle, StatusChip } from "@/components/v2/ui";
import { SaveButton } from "@/components/v2/SaveButton";
import {
  ApplyForm, DecideApplication, ReviewControls, ReviewStars, SubmitForm, WithdrawButton,
} from "./CampaignActions";

export const dynamic = "force-dynamic";

const NEEDS_APPLICATION = new Set(["photography", "videography", "general"]);
const KIND_LABEL: Record<string, string> = {
  ugc: "UGC", photography: "Photo shoot", videography: "Video shoot",
  content: "Content", car_ads: "Car ad", general: "Job",
};

/**
 * One campaign, three views: a creator sees the photo, the money, the brief
 * and the one action that applies to them (apply or submit); the business
 * sees applications and the review queue; everyone sees the same facts.
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

  const needsVerification = campaign.verified_only && !mine.isVerified;
  const canApply = applicationBased && !mine.application && open && !isManager && !needsVerification;
  const canSubmit =
    open && !isManager && spotsLeft > 0 && !liveSubmission &&
    (!applicationBased || accepted) && !needsVerification;

  // The one thing a creator can do right now, for the sticky bar on phones.
  const primary = canApply
    ? { href: "#apply", label: "Apply" }
    : canSubmit
      ? { href: "#submit", label: applicationBased ? "Submit your work" : `Make ${money(campaign.pay_cents)}` }
      : needsVerification && open && !isManager
        ? { href: "/me/creator", label: "Get verified to apply" }
        : null;

  const facts = [
    campaign.city,
    campaign.deadline && `Due ${fmtDate(campaign.deadline)}`,
    campaign.event_at && `On ${fmtDateTime(campaign.event_at)}`,
    spotsLeft > 0 ? `${spotsLeft} of ${campaign.slots} spot${campaign.slots === 1 ? "" : "s"} open` : "All spots filled",
    campaign.verified_only ? "Verified creators only" : null,
  ].filter(Boolean) as string[];

  return (
    <main id="main" className={`mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8 ${primary ? "pb-32 md:pb-8" : ""}`}>
      <div className="flex items-center justify-between">
        <BackButton fallback="/jobs" label="Jobs" />
        <span className="flex items-center gap-2">
          {campaign.status !== "open" && <StatusChip status={campaign.status} />}
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
            <SaveButton itemType="campaign" itemId={campaign.id} initialSaved={Boolean(saved)} />
          </span>
        </span>
      </div>

      {/* Hero: the business's photo, with the money on it. */}
      <div className="card mt-4 overflow-hidden">
        <div className="relative aspect-[4/3] w-full bg-surface-2 md:aspect-[16/9]">
          {campaign.business_cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={campaign.business_cover} alt="" className="h-full w-full object-cover" fetchPriority="high" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,_var(--color-surface-2),_var(--color-surface)_70%)]">
              <Avatar src={campaign.business_logo} name={campaign.business_name} size={80} />
            </div>
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
          <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">
            {KIND_LABEL[campaign.kind] ?? campaign.kind}
          </span>
          <div className="absolute inset-x-5 bottom-5">
            <Money cents={campaign.pay_cents} size="hero" suffix={applicationBased ? "for the job" : "per approved post"} />
          </div>
        </div>
        <div className="p-5">
          <h1 className="font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em] md:text-[2rem]">
            {campaign.title}
          </h1>
          <Link href={`/b/${campaign.business_slug}`} className="mt-3 flex items-center gap-2.5">
            <Avatar src={campaign.business_logo} name={campaign.business_name} size={28} />
            <span className="font-display text-[0.9375rem] font-600">{campaign.business_name}</span>
            <span className="text-sm text-ink-faint">See the business →</span>
          </Link>
          <p className="mt-3 text-sm text-ink-faint">{facts.join("  ·  ")}</p>
        </div>
      </div>

      <section className="mt-6">
        <SectionTitle>What they want</SectionTitle>
        <p className="mt-2 whitespace-pre-wrap text-[1.0625rem] leading-relaxed text-ink-soft">{campaign.brief}</p>
        {campaign.reference_url && (
          <a href={campaign.reference_url} target="_blank" rel="noopener noreferrer" className="btn mt-3">
            See the reference ↗
          </a>
        )}
      </section>

      {campaign.requirements.length > 0 && (
        <section className="mt-6">
          <SectionTitle>Requirements</SectionTitle>
          <ul className="row-list mt-2">
            {campaign.requirements.map((r, i) => (
              <li key={i} className="card-2 px-4 py-3 text-[0.9375rem]">{r}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-sm text-ink-faint">
        <span className="font-600 text-ink-soft">Content rights. </span>{campaign.rights_note}
      </p>

      {/* ------------------------------------------------ creator's panel */}
      {!isManager && (
        <section className="mt-8">
          {needsVerification && open && (
            <div className="card p-4">
              <p className="font-display text-base font-700">This job needs a verified creator profile.</p>
              <p className="mt-1 text-sm text-ink-soft">Verification takes an admin about a day.</p>
              <Link href="/me/creator" className="btn btn-signal mt-3">Request verification</Link>
            </div>
          )}

          {canApply && (
            <>
              <SectionTitle>Apply for this job</SectionTitle>
              <ApplyForm campaignId={campaign.id} />
            </>
          )}
          {mine.application && (
            <div className="card flex items-center gap-3 p-4">
              <p className="text-[0.9375rem]">Your application</p>
              <StatusChip status={mine.application.status} />
              <span className="ml-auto">
                {mine.application.status === "applied" && <WithdrawButton campaignId={campaign.id} />}
              </span>
            </div>
          )}

          {canSubmit && <SubmitForm campaignId={campaign.id} rightsNote={campaign.rights_note} />}
          {revisionAsked && !liveSubmission && (
            <div className="card card-signal mt-3 p-4">
              <p className="font-display text-base font-700 text-signal">Changes requested</p>
              {revisionAsked.review_note && <p className="mt-1 text-[0.9375rem]">{revisionAsked.review_note}</p>}
            </div>
          )}

          {mine.submissions.length > 0 && (
            <div className="mt-6">
              <SectionTitle>Your submissions</SectionTitle>
              <ul className="row-list mt-2">
                {mine.submissions.map((s) => (
                  <li key={s.id} className="card flex flex-wrap items-center gap-3 p-4">
                    <StatusChip status={s.status} />
                    <span className="text-sm text-ink-faint">
                      {fmtDate(s.created_at)}{"  ·  "}{s.media_urls.length} file{s.media_urls.length === 1 ? "" : "s"}
                    </span>
                    {s.review_note && s.status !== "revision_requested" && (
                      <span className="w-full text-sm text-ink-soft">{s.review_note}</span>
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
            <p className="mt-3 text-sm text-ink-faint">This campaign is no longer taking submissions.</p>
          )}
        </section>
      )}

      {/* ----------------------------------------------- business's panel */}
      {isManager && (
        <section className="mt-8">
          {applicationBased && (
            <div className="mb-8">
              <SectionTitle count={applications.length}>Applications</SectionTitle>
              {applications.length === 0 && (
                <p className="mt-2 text-sm text-ink-faint">No applications yet.</p>
              )}
              <ul className="row-list mt-2">
                {applications.map((a) => (
                  <li key={a.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={a.avatar_url} name={a.display_name ?? a.username} size={40} />
                      <span className="min-w-0 flex-1">
                        <Link href={`/u/${a.username}`} className="block truncate font-display text-base font-700 hover:text-signal">
                          {a.display_name ?? `@${a.username}`}
                        </Link>
                        <span className="text-sm text-ink-faint">
                          {a.completed_jobs} job{a.completed_jobs === 1 ? "" : "s"} done{a.verified ? "  ·  Verified" : ""}
                        </span>
                      </span>
                      <StatusChip status={a.status} />
                    </div>
                    {a.message && <p className="mt-3 text-[0.9375rem] text-ink-soft">{a.message}</p>}
                    {a.status === "applied" && (
                      <div className="mt-3"><DecideApplication applicationId={a.id} /></div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <SectionTitle count={submissions.length}>Submissions</SectionTitle>
          {submissions.length === 0 && (
            <p className="mt-2 text-sm text-ink-faint">
              Nothing submitted yet. Creators are seeing this campaign in their feed.
            </p>
          )}
          <ul className="row-list mt-2">
            {submissions.map((s) => (
              <li key={s.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <Avatar src={s.creator_avatar} name={s.creator_name ?? s.creator_username} size={40} />
                  <span className="min-w-0 flex-1">
                    <Link href={`/u/${s.creator_username}`} className="block truncate font-display text-base font-700 hover:text-signal">
                      {s.creator_name ?? `@${s.creator_username}`}
                    </Link>
                    {s.creator_verified && <Chip tone="rise">Verified</Chip>}
                  </span>
                  <StatusChip status={s.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {s.media_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-[10px] bg-surface-2">
                      {/\.(mp4|webm|mov)($|\?)/i.test(url) ? (
                        <span className="flex aspect-square items-center justify-center text-sm text-ink-soft">Video ↗</span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt={`Submission file ${i + 1}`} className="aspect-square w-full object-cover" />
                      )}
                    </a>
                  ))}
                </div>
                {s.note && <p className="mt-3 text-[0.9375rem] text-ink-soft">{s.note}</p>}
                {["submitted", "under_review", "revision_requested"].includes(s.status) && (
                  <ReviewControls submissionId={s.id} />
                )}
                {s.status === "paid" && (
                  <div className="mt-3"><ReviewStars contextType="submission" contextId={s.id} /></div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sticky action on phones: money on the left, the one button on the right. */}
      {primary && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-4 md:hidden">
          <div className="glass mx-auto flex max-w-2xl items-center gap-4 rounded-[var(--radius-card)] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <span className="pl-2">
              <Money cents={campaign.pay_cents} size="md" />
              <span className="block text-xs text-ink-faint">{applicationBased ? "for the job" : "per post"}</span>
            </span>
            <a href={primary.href} className="btn btn-signal btn-lg flex-1">{primary.label}</a>
          </div>
        </div>
      )}
    </main>
  );
}

function money(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}
function fmtDate(v: string) {
  return new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtDateTime(v: string) {
  return new Date(v).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
