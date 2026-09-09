import Link from "next/link";
import { sqlOne } from "@/lib/db";
import { getMyParticipation } from "@/lib/v2/campaigns";
import type { V2Context } from "@/lib/v2/core";
import { deadlineLabel, isVideoUrl, type Opportunity } from "@/lib/v2/opportunities";
import { formatCredit } from "@/lib/money";
import { Money, SectionTitle } from "@/components/v2/ui";
import { NoPhoto } from "@/components/v2/EarnCards";
import { SubmitForm } from "../../jobs/[id]/CampaignActions";
import { BusinessRow, StateCard, StickyCta, TopBar, WhatToDo } from "./shared";

/**
 * Recreate a Reel: watch the reference, film your version, upload it. No
 * claim step; the upload is the participation.
 */
export async function RecreateView({
  o, ctx, open, rightsNote,
}: { o: Opportunity; ctx: V2Context; open: boolean; rightsNote: string }) {
  const mine = await getMyParticipation(o.id, ctx.user.id);
  const latest = mine.submissions[0] ?? null;
  const state = latest?.status ?? "none";
  const paid = latest && ["approved", "paid"].includes(latest.status)
    ? await sqlOne<{ cents: number }>(
        `select amount_cents::int as cents from earnings where source = 'submission' and source_id = $1`,
        [latest.id],
      )
    : null;

  const spotsLeft = Math.max(o.slots - o.approved_count, 0);
  const media = o.details.reference_media_url ?? null;
  const video = isVideoUrl(media);
  const range = o.details.duration_seconds;
  const canSubmit = open && spotsLeft > 0 && (state === "none" || state === "revision_requested");
  const meta = [
    spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left` : "All spots taken",
    deadlineLabel(o.deadline),
    range ? `${range[0]} to ${range[1]} seconds` : null,
  ].filter(Boolean).join("  ·  ");

  return (
    <main id="main" className={`mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8 ${canSubmit ? "pb-32 md:pb-8" : ""}`}>
      <TopBar o={o} open={open} />

      {/* Hero: the reference itself. Controls stay usable, so the money sits below. */}
      <div className="card mt-4 overflow-hidden">
        <div className="relative aspect-[4/3] w-full bg-surface-2 md:aspect-[16/9]">
          {media ? (
            video ? (
              <video src={media} controls playsInline preload="metadata" className="h-full w-full bg-black object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media} alt="The reference to recreate" className="h-full w-full object-cover" fetchPriority="high" />
            )
          ) : o.business_cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={o.business_cover} alt="" className="h-full w-full object-cover" fetchPriority="high" />
          ) : (
            <NoPhoto name={o.business_name} logo={o.business_logo} />
          )}
          {!video && <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />}
          <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">
            {media ? "The reference" : "Recreate"}
          </span>
          {!media && o.reference_url && (
            <a href={o.reference_url} target="_blank" rel="noopener noreferrer" className="btn absolute bottom-4 left-4">
              Watch the reference →
            </a>
          )}
        </div>
        <div className="p-5">
          <Money cents={o.pay_cents} size="hero" suffix="per approved version" />
          <h1 className="mt-2 font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em] md:text-[2rem]">
            Recreate this Reel
          </h1>
          <BusinessRow o={o} />
          <p className="mt-3 text-sm text-ink-faint">{meta}</p>
          {media && o.reference_url && (
            <a href={o.reference_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm mt-4">
              Open the original ↗
            </a>
          )}
        </div>
      </div>

      <WhatToDo items={o.requirements} />
      {o.brief && <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">{o.brief}</p>}

      <section className="mt-8">
        {state === "none" && canSubmit && (
          <>
            <SectionTitle>Your version</SectionTitle>
            <p className="mt-1 text-sm text-ink-soft">Upload it here. The business reviews it and approval pays into your earnings.</p>
            <SubmitForm campaignId={o.id} rightsNote={rightsNote} />
          </>
        )}
        {state === "none" && !canSubmit && (
          <StateCard
            title={!open ? "This campaign is closed" : "All spots are taken"}
            body={!open ? "It is no longer taking versions." : "Every paid spot has been approved already."}
          >
            <Link href="/home" className="btn btn-sm mt-3">Find another →</Link>
          </StateCard>
        )}
        {["submitted", "under_review"].includes(state) && (
          <StateCard
            title="Submitted, waiting for approval"
            body="The business is reviewing your version. Once approved, the pay lands in your earnings."
          >
            <Link href="/activity" className="btn btn-sm mt-3">See my activity →</Link>
          </StateCard>
        )}
        {state === "revision_requested" && latest && (
          <>
            <StateCard tone="signal" title="Changes requested" body={latest.review_note ?? "The business asked for a change. Upload a new version."} />
            {canSubmit ? (
              <SubmitForm campaignId={o.id} rightsNote={rightsNote} />
            ) : (
              <p className="mt-3 text-sm text-ink-faint">This campaign is no longer taking versions.</p>
            )}
          </>
        )}
        {["approved", "paid"].includes(state) && (
          <StateCard title={`Approved, ${formatCredit(paid?.cents ?? o.pay_cents)} paid to your earnings`} body="Nice work. The money is ready to pay out.">
            <Link href="/earnings" className="btn btn-signal btn-sm mt-3">See earnings →</Link>
          </StateCard>
        )}
        {state === "rejected" && latest && (
          <StateCard title="Not approved" body={latest.review_note ?? "The business did not approve this version."} />
        )}
      </section>

      {canSubmit && <StickyCta cents={o.pay_cents} suffix="per version" href="#submit" label="Submit my version" />}
    </main>
  );
}
