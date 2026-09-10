import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { sqlOne } from "@/lib/db";
import { getMyParticipation } from "@/lib/v2/campaigns";
import type { V2Context } from "@/lib/v2/core";
import { deadlineLabel, isVideoUrl, type Opportunity } from "@/lib/v2/opportunities";
import { guideFromCampaign } from "@/lib/ai/guide";
import { formatCredit } from "@/lib/money";
import { Money } from "@/components/v2/ui";
import { NoPhoto } from "@/components/v2/EarnCards";
import { RecreateFlow } from "./RecreateFlow";
import { BusinessRow, StateCard, StepList, StickyCta, TopBar } from "./shared";

/**
 * Recreate a Reel. Three screens' worth of complexity, unfolded in order:
 * the reference and the money, what to do (visual steps), then the upload
 * with its check. The business approves; approval pays.
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

  const guide = guideFromCampaign(o.details as Record<string, unknown>, o.requirements);
  const spotsLeft = Math.max(o.slots - o.approved_count, 0);
  const media = o.details.reference_media_url ?? null;
  const video = isVideoUrl(media);
  const canSubmit = open && spotsLeft > 0 && (state === "none" || state === "revision_requested");
  const meta = [spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"}` : "Spots filled", deadlineLabel(o.deadline)].filter(Boolean).join(" · ");
  const rules = [
    `${guide.duration_seconds[0]} to ${guide.duration_seconds[1]} sec`,
    guide.orientation === "vertical" ? "Vertical 9:16" : "Horizontal 16:9",
    ...guide.rules.slice(0, 2),
  ];

  return (
    <main id="main" className={`mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8 ${canSubmit ? "pb-32 md:pb-8" : ""}`}>
      <TopBar o={o} open={open} />

      <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
        {/* The reference. On phones it is the screen. */}
        <div className="lg:sticky lg:top-8">
          <div className="relative mx-auto aspect-[9/16] w-full max-h-[78dvh] overflow-hidden rounded-[var(--radius-card)] bg-surface-2">
            {media ? (
              video ? (
                <video src={media} controls playsInline preload="metadata" poster={o.business_cover ?? undefined} className="absolute inset-0 h-full w-full bg-black object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media} alt="The reference to recreate" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" width={1080} height={1920} />
              )
            ) : o.business_cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.business_cover} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" width={1080} height={1920} />
            ) : (
              <NoPhoto name={o.business_name} logo={o.business_logo} />
            )}
            {!video && <div className="media-scrim absolute inset-x-0 bottom-0 h-3/5" aria-hidden />}
            <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">The reference</span>
            {!video && (
              <div className="absolute inset-x-4 bottom-4">
                <Money cents={o.pay_cents} size="hero" />
                <h1 className="mt-1 font-display text-[1.625rem] leading-[1.05] font-800 tracking-[-0.03em]">Recreate this Reel</h1>
              </div>
            )}
          </div>
          {video && (
            <div className="mt-4">
              <Money cents={o.pay_cents} size="hero" />
              <h1 className="mt-1 font-display text-[1.625rem] leading-[1.05] font-800 tracking-[-0.03em]">Recreate this Reel</h1>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between gap-3">
            <BusinessRow o={o} />
            <span className="shrink-0 text-sm text-ink-faint">{meta}</span>
          </div>
          {o.reference_url && (
            <a href={o.reference_url} target="_blank" rel="noopener noreferrer" className="link-row mt-1 text-sm">
              Open the original <ArrowSquareOut size={16} aria-hidden />
            </a>
          )}
        </div>

        <div className="min-w-0">
          {/* What to do: visual steps, then the rules as chips. */}
          <section className="mt-8 lg:mt-0" aria-labelledby="todo">
            <h2 id="todo" className="eyebrow">What you need to do</h2>
            <StepList steps={guide.steps} poster={!video ? media ?? o.business_cover : o.business_cover} />
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Rules">
              {rules.map((r) => <li key={r} className="pill !min-h-9 !py-1.5 text-sm">{r}</li>)}
            </ul>
            {guide.avoid.length > 0 && (
              <p className="mt-3 text-sm text-ink-faint">Avoid: {guide.avoid.slice(0, 3).join(", ")}.</p>
            )}
          </section>

          {/* Then the upload. */}
          <section className="mt-8" aria-label="Your version">
            {state === "none" && canSubmit && (
              <>
                <h2 className="eyebrow">Your version</h2>
                <div className="mt-3">
                  <RecreateFlow campaignId={o.id} guide={guide} rightsNote={rightsNote} />
                </div>
              </>
            )}
            {state === "none" && !canSubmit && (
              <StateCard title={!open ? "This campaign is closed" : "All spots are taken"}>
                <Link href="/home" className="btn btn-sm mt-3">Find another</Link>
              </StateCard>
            )}
            {["submitted", "under_review"].includes(state) && (
              <StateCard title="Sent. Waiting for approval." body="Approval pays into your earnings.">
                <Link href="/activity" className="btn btn-sm mt-3">My activity</Link>
              </StateCard>
            )}
            {state === "revision_requested" && latest && (
              <>
                <StateCard tone="signal" title="Changes requested" body={latest.review_note ?? "Upload a new version."} />
                {canSubmit && <div className="mt-3"><RecreateFlow campaignId={o.id} guide={guide} rightsNote={rightsNote} /></div>}
              </>
            )}
            {["approved", "paid"].includes(state) && (
              <StateCard tone="signal" title={`Approved, ${formatCredit(paid?.cents ?? o.pay_cents)} paid to your earnings`}>
                <Link href="/earnings" className="btn btn-signal btn-sm mt-3">See earnings</Link>
              </StateCard>
            )}
            {state === "rejected" && latest && (
              <StateCard title="Not approved" body={latest.review_note ?? "The business did not approve this version."} />
            )}
          </section>
        </div>
      </div>

      {canSubmit && state === "none" && <StickyCta cents={o.pay_cents} suffix="per approved Reel" href="#start" label="Start recreating" />}
    </main>
  );
}
