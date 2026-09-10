import Link from "next/link";
import { sqlOne } from "@/lib/db";
import { getMyParticipation } from "@/lib/v2/campaigns";
import type { V2Context } from "@/lib/v2/core";
import { storyVerification } from "@/lib/v2/instagram";
import { deadlineLabel, type Opportunity } from "@/lib/v2/opportunities";
import { formatCredit } from "@/lib/money";
import { Money } from "@/components/v2/ui";
import { NoPhoto } from "@/components/v2/EarnCards";
import { ParticipateButton, StoryProofForm } from "./Controls";
import { BusinessRow, StateCard, StickyCta, TopBar, WhatToDo } from "./shared";

/**
 * Post a Story: the creative is the hero. Setup is progressive: Instagram
 * first, then the follower bar, then Participate, then download, post, and
 * send proof. Verification is manual today and the screen says so.
 */
export async function StoryView({ o, ctx, open }: { o: Opportunity; ctx: V2Context; open: boolean }) {
  const [mine, verification] = await Promise.all([
    getMyParticipation(o.id, ctx.user.id),
    storyVerification(),
  ]);
  const latest = mine.submissions[0] ?? null;
  const state = latest?.status ?? "none";
  const paid = latest && ["approved", "paid"].includes(latest.status)
    ? await sqlOne<{ cents: number }>(
        `select amount_cents::int as cents from earnings where source = 'submission' and source_id = $1`,
        [latest.id],
      )
    : null;

  const creative = o.details.creative_url ?? o.business_cover;
  const liveHours = o.details.live_hours ?? 24;
  const minFollowers = o.details.min_followers ?? null;
  const spotsLeft = Math.max(o.slots - o.approved_count, 0);
  const ig = ctx.instagram;
  const participating = mine.application?.status === "accepted";

  // Requirements: the facts from details first, then the business's own lines
  // that do not repeat them.
  const requirements = [
    `Keep it live ${liveHours} hours`,
    minFollowers ? `${minFollowers.toLocaleString()}+ followers` : null,
    "Do not crop the creative",
    ...o.requirements.filter((r) => !/live|followers|crop/i.test(r)),
  ].filter(Boolean) as string[];

  const needsInstagram = ig.status === "disconnected";
  const tooFewFollowers = !needsInstagram && Boolean(minFollowers) && (ig.followers ?? 0) < (minFollowers ?? 0);
  const eligible = !needsInstagram && !tooFewFollowers;
  const canParticipate = eligible && !participating && open && spotsLeft > 0 && state === "none";
  const proofOpen = participating && open && (state === "none" || state === "revision_requested");

  const sticky = canParticipate
    ? { href: "#participate", label: "Participate" }
    : proofOpen ? { href: "#proof", label: "Send proof" } : null;
  const meta = [
    spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left` : "All spots taken",
    deadlineLabel(o.deadline),
  ].filter(Boolean).join("  ·  ");
  const returnTo = encodeURIComponent(`/o/${o.id}`);

  return (
    <main id="main" className={`mx-auto w-full max-w-4xl px-4 py-4 md:px-8 md:py-8 ${sticky ? "pb-32 rail:pb-8" : ""}`}>
      <TopBar o={o} open={open} />

      <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-start lg:gap-8">
        {/* Hero: the 9:16 creative, exactly as it will be posted. */}
        <div className="relative mx-auto w-full max-w-[24rem] md:max-w-none">
          {creative ? (
            <div className="relative mx-auto aspect-[9/16] w-full max-w-[24rem] overflow-hidden rounded-[var(--radius-card)] bg-surface-2 lg:max-w-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={creative} alt="The story creative" fetchPriority="high" width={1080} height={1920} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ) : (
            <div className="mx-auto aspect-[9/16] w-full max-w-[16rem] overflow-hidden rounded-[var(--radius-card)] md:max-w-none">
              <NoPhoto name={o.business_name} logo={o.business_logo} />
            </div>
          )}
        </div>

        <div className="mt-5 min-w-0 lg:mt-0">
          <p className="text-sm text-ink-soft">Earn</p>
          <Money cents={o.pay_cents} size="hero" suffix="per story" />
          <h1 className="mt-2 font-display text-[1.5rem] leading-[1.05] font-700 tracking-[-0.02em] md:text-[1.5rem]">
            Post this to your Story
          </h1>
          <BusinessRow o={o} />
          <p className="mt-3 text-sm text-ink-faint">{meta}</p>

          <WhatToDo items={requirements} />

          <p className="mt-3 text-sm text-ink-faint">
            {verification.mode === "manual"
              ? `Verified by ${o.business_name} from your screenshot and story link.`
              : verification.note}
          </p>

          <section className="mt-6">
            {needsInstagram && (
              <StateCard title="Connect Instagram to participate" body="Story campaigns pay per story on your own account. Add your handle once and every Story campaign opens up.">
                <Link href={`/me/instagram?return=${returnTo}`} className="btn btn-signal btn-lg mt-4 w-full">Connect Instagram</Link>
              </StateCard>
            )}
            {tooFewFollowers && (
              <StateCard
                title={`This one needs ${(minFollowers ?? 0).toLocaleString()}+ followers`}
                body={`@${ig.handle ?? "you"} has ${(ig.followers ?? 0).toLocaleString()} on file. If that changed, update it on your profile.`}
              >
                <Link href={`/me/instagram?return=${returnTo}`} className="btn btn-sm mt-3">Update my Instagram</Link>
              </StateCard>
            )}

            {eligible && state === "none" && !participating && (
              canParticipate ? (
                <>
                  <h2 className="eyebrow">Take a spot</h2>
                  <p className="mt-1 mb-3 text-sm text-ink-soft">
                    Posting as @{ig.handle}. Then you download the creative, post it, and send proof.
                  </p>
                  <ParticipateButton campaignId={o.id} />
                </>
              ) : (
                <StateCard
                  title={!open ? "This campaign is closed" : "All spots are taken"}
                  body={!open ? "It is no longer taking stories." : "Every paid spot is already used."}
                >
                  <Link href="/home" className="btn btn-sm mt-3">Find another</Link>
                </StateCard>
              )
            )}

            {eligible && participating && (state === "none" || state === "revision_requested") && (
              <>
                {state === "revision_requested" && latest && (
                  <div className="mb-3">
                    <StateCard tone="signal" title="Changes requested" body={latest.review_note ?? "The business asked for a change. Send new proof."} />
                  </div>
                )}
                <h2 className="eyebrow">Three steps</h2>
                <ol className="row-list mt-2">
                  <li className="card flex gap-3 p-4">
                    <span className="tnum font-display text-lg font-700 text-signal">1</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[1.0625rem] font-600">Download the creative</span>
                      <span className="mt-0.5 block text-sm text-ink-soft">Save it to your phone as is.</span>
                      {o.details.creative_url && (
                        <a href={o.details.creative_url} download className="btn btn-sm mt-3">Download</a>
                      )}
                    </span>
                  </li>
                  <li className="card flex gap-3 p-4">
                    <span className="tnum font-display text-lg font-700 text-signal">2</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[1.0625rem] font-600">Post it to your Story</span>
                      <span className="mt-0.5 block text-sm text-ink-soft">Keep it live {liveHours} hours. Do not crop it.</span>
                    </span>
                  </li>
                  <li className={`card flex gap-3 p-4 ${proofOpen ? "card-signal" : ""}`}>
                    <span className="tnum font-display text-lg font-700 text-signal">3</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[1.0625rem] font-600">Send proof</span>
                      <span className="mt-0.5 block text-sm text-ink-soft">A screenshot of the story and its link.</span>
                      {proofOpen ? (
                        <StoryProofForm campaignId={o.id} />
                      ) : (
                        <span className="mt-2 block text-sm text-ink-faint">This campaign is closed.</span>
                      )}
                    </span>
                  </li>
                </ol>
              </>
            )}

            {["submitted", "under_review"].includes(state) && (
              <StateCard title="Proof sent" body={`${o.business_name} checks it and approves. Then ${formatCredit(o.pay_cents)} goes to your earnings.`}>
                <Link href="/activity" className="btn btn-sm mt-3">See my activity</Link>
              </StateCard>
            )}
            {["approved", "paid"].includes(state) && (
              <StateCard title={`Approved, ${formatCredit(paid?.cents ?? o.pay_cents)} paid to your earnings`} body="Thanks for posting. The money is ready to pay out.">
                <Link href="/earnings" className="btn btn-signal btn-sm mt-3">See earnings</Link>
              </StateCard>
            )}
            {state === "rejected" && latest && (
              <StateCard title="Not approved" body={latest.review_note ?? "The business did not approve this story."} />
            )}
          </section>
        </div>
      </div>

      {sticky && <StickyCta cents={o.pay_cents} suffix="per story" href={sticky.href} label={sticky.label} />}
    </main>
  );
}
