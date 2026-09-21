import Link from "next/link";
import { InstagramLogo, DownloadSimple, Clock, UsersThree, CurrencyDollar, Timer, Camera, PaperPlaneTilt, Hourglass } from "@phosphor-icons/react/dist/ssr";
import type { V2Context } from "@/lib/v2/core";
import { fmtDate, type Opportunity } from "@/lib/v2/opportunities";
import type { Invite } from "@/lib/v2/requests";
import type { StoryVerification } from "@/lib/v2/instagram";
import { formatMoney } from "@/components/fs/parts";
import { InspectButton } from "@/components/fs/SourceInspector";
import { ParticipateButton, StoryProofForm } from "./StoryControls";
import { RequestDecision } from "./RequestDecision";
import { DetailTop, fmtLong } from "./DetailParts";
import { Accordion, ActionCard, BizCard, Checks, DSection, Facts, Hero, HeroMedia, Steps, Timeline, WorkThumbV } from "./DetailKit";
import { StickyAction } from "./StickyAction";
import type { Participation } from "./RecreateDetail";

/**
 * Post a Story: the supplied creative inside a phone is the hero, the pay
 * sits on it, then the action the person's state and eligibility allow.
 * Post, keep live, send proof, get paid as the four steps; requirements
 * as checks; the business; the stage timeline; the rest behind accordions.
 */
const STAGES = ["Accepted", "Post", "Keep live", "Proof", "Review", "Paid"];

export function StoryDetail({ o, ctx, open, mine, invite, verification, paid, feePct, businessCategory = null }: {
  o: Opportunity; ctx: V2Context; open: boolean; mine: Participation; invite: Invite | null; verification: StoryVerification; paid: { cents: number; fee: number } | null; feePct: number; businessCategory?: string | null;
}) {
  const latest = mine.submissions[0] ?? null;
  const state = latest?.status ?? "none";
  const creative = o.details.creative_url ?? null;
  const liveHours = o.details.live_hours ?? 24;
  const minFollowers = o.details.min_followers ?? null;
  const spotsLeft = Math.max(o.slots - o.approved_count, 0);
  const ig = ctx.instagram;
  const participating = mine.application?.status === "accepted";
  const requestOpen = invite?.status === "sent";
  const declined = invite?.status === "declined";
  const acceptedRequest = invite?.status === "accepted";
  const needsInstagram = ig.status !== "connected";
  const tooFewFollowers = !needsInstagram && Boolean(minFollowers) && (ig.followers ?? 0) < (minFollowers ?? 0);
  const eligible = !needsInstagram && !tooFewFollowers;
  const canParticipate = eligible && !participating && !acceptedRequest && open && spotsLeft > 0 && state === "none" && !requestOpen && !declined;
  const proofOpen = (participating || acceptedRequest) && open && (state === "none" || state === "revision_requested");
  const fee = Math.floor((o.pay_cents * feePct) / 100);
  const net = o.pay_cents - fee;
  const deadline = fmtLong(o.deadline);
  const deadlineShort = o.deadline ? fmtDate(o.deadline) : null;
  const returnTo = encodeURIComponent(`/o/${o.id}`);
  const bizSub = [businessCategory, o.city].filter(Boolean).join(" · ") || "Business";
  const isPaid = state === "paid" && paid != null;
  const accepted = participating || acceptedRequest;
  const requirements = [
    `Keep it live ${liveHours} hours`,
    minFollowers ? `${minFollowers.toLocaleString()}+ followers` : null,
    "Post the creative as it is, no crop",
    ...o.requirements.filter((r) => !/live|followers|crop/i.test(r)),
  ].filter(Boolean) as string[];

  const now = state === "paid" ? 6 : state === "approved" ? 5 : state === "submitted" || state === "under_review" ? 4 : state === "revision_requested" ? 3 : state === "rejected" ? 4 : accepted ? 1 : requestOpen ? 0 : -1;
  const stickyLabel = state === "revision_requested" ? "Send new proof" : proofOpen ? "Send proof" : canParticipate ? "Take a spot" : needsInstagram && state === "none" && !accepted ? "Connect Instagram" : requestOpen ? "Answer request" : "See status";

  const status = requestOpen ? <span className="badge is-warning">Request for you</span>
    : declined ? <span className="badge">Declined</span>
    : state === "revision_requested" ? <span className="badge is-warning">Revision</span>
    : state === "submitted" || state === "under_review" ? <span className="badge is-info">In review</span>
    : state === "approved" ? <span className="badge is-success">Approved</span>
    : state === "paid" ? <span className="badge is-success">Paid</span>
    : state === "rejected" ? <span className="badge is-alert">Not approved</span>
    : accepted ? <span className="badge is-success">Your spot</span>
    : !open ? <span className="badge">Closed</span>
    : spotsLeft === 0 ? <span className="badge">Full</span>
    : <span className="badge is-success">Open</span>;

  return (
    <main className="fs-phone-main" id="main">
      <DetailTop o={o} open={open} />
      <div className="dt-page">
        <div className="dt-main-top">
          <Hero kind="story" chip={<><InstagramLogo size={16} aria-hidden />Story</>} business={{ name: o.business_name, logo: o.business_logo, verified: o.business_verified }} title={o.title} pay={o.pay_cents} per="per Story">
            <HeroMedia src={creative} kind="story" alt={`The Story creative from ${o.business_name}`} priority />
          </Hero>
          <Facts items={[
            { icon: <CurrencyDollar size={20} aria-hidden />, value: formatMoney(o.pay_cents).replace(/\.00$/, ""), label: "Pay" },
            { icon: <Timer size={20} aria-hidden />, value: `${liveHours}h`, label: "Keep live" },
            { icon: <UsersThree size={20} aria-hidden />, value: spotsLeft > 0 ? String(spotsLeft) : "Full", label: spotsLeft === 1 ? "Spot left" : "Spots left" },
            { icon: <Clock size={20} aria-hidden />, value: deadlineShort ?? "Open", label: invite ? "Deadline" : "Post by" },
          ]} />
        </div>

        <aside className="dt-rail">
          <ActionCard pay={o.pay_cents} per="per approved Story" net={isPaid ? paid.cents : net} feePct={isPaid ? Math.round((paid.fee * 100) / Math.max(paid.cents + paid.fee, 1)) : feePct} status={status}
            facts={[{ v: `${liveHours}h`, l: "Live" }, { v: minFollowers ? `${minFollowers.toLocaleString()}+` : "Any", l: "Followers" }, { v: deadlineShort ?? "No date", l: "Post by" }]}>
            {requestOpen && invite && (
              <div style={{ marginTop: 12 }}>
                <p className="t-body" style={{ fontWeight: 600 }}>{o.business_name} asks you to post this Story.</p>
                {invite.message && <p className="t-meta" style={{ marginTop: 6 }}>{invite.message}</p>}
                <RequestDecision inviteId={invite.id} businessName={o.business_name} kind="instagram_story" />
              </div>
            )}
            {declined && <p className="t-meta" style={{ marginTop: 12 }}>You declined this request.</p>}

            {state === "none" && !requestOpen && !declined && !accepted && (
              needsInstagram ? (
                <>
                  <Link href={`/me/instagram?return=${returnTo}`} className="fs-btn fs-btn-primary"><InstagramLogo size={20} aria-hidden /> Connect Instagram</Link>
                  <p className="dt-action-note">Story work posts on your own account. Add your handle once.</p>
                </>
              ) : tooFewFollowers ? (
                <>
                  <Link href={`/me/instagram?return=${returnTo}`} className="fs-btn fs-btn-secondary" style={{ width: "100%", marginTop: 12 }}>Update my Instagram</Link>
                  <p className="dt-action-note">Needs {(minFollowers ?? 0).toLocaleString()}+ followers. @{ig.handle} has {(ig.followers ?? 0).toLocaleString()} on file.</p>
                </>
              ) : canParticipate ? (
                <>
                  <div style={{ marginTop: 12 }}><ParticipateButton campaignId={o.id} /></div>
                  <p className="dt-action-note">Posting as @{ig.handle}. A spot is reserved for you; nothing is posted yet.</p>
                </>
              ) : <p className="t-meta" style={{ marginTop: 12 }}>{!open ? "This campaign is closed." : "All spots are taken."} <Link href="/home" className="link-accent">Find other work</Link></p>
            )}

            {state === "none" && accepted && !requestOpen && (
              <div style={{ marginTop: 12 }}>
                <p className="t-body" style={{ fontWeight: 600 }}>Post it as @{ig.handle ?? "your account"}{deadline ? `, by ${deadline}` : ""}.</p>
                {creative && <a href={creative} download className="btn btn-sm" style={{ marginTop: 8 }}><DownloadSimple size={16} aria-hidden /> Download creative</a>}
                {proofOpen ? <StoryProofForm campaignId={o.id} /> : <p className="t-meta" style={{ marginTop: 12 }}>This campaign is closed.</p>}
              </div>
            )}

            {state === "revision_requested" && latest && (
              <div style={{ marginTop: 12 }}>
                <div className="dt-work-row">
                  <WorkThumbV src={latest.media_urls[0] ?? null} alt="Your previous proof" />
                  <div style={{ minWidth: 0 }}>
                    <p className="t-body" style={{ fontWeight: 600 }}>What to change</p>
                    <p className="t-meta" style={{ marginTop: 4 }}>{latest.review_note ?? "Send new proof."}</p>
                    <p className="t-meta" style={{ marginTop: 4, color: "var(--tm-muted2)" }}>Sent {fmtDate(latest.created_at)}</p>
                  </div>
                </div>
                {proofOpen ? <StoryProofForm campaignId={o.id} label="Send new proof" /> : <p className="t-meta" style={{ marginTop: 12 }}>This campaign is closed.</p>}
              </div>
            )}
            {(state === "submitted" || state === "under_review") && latest && (
              <div className="dt-work-row">
                <WorkThumbV src={latest.media_urls[0] ?? null} alt="Your proof" />
                <div style={{ minWidth: 0 }}>
                  <p className="t-body" style={{ fontWeight: 600 }}>{o.business_name} is checking your proof.</p>
                  <p className="t-meta" style={{ marginTop: 4 }}>Sent {fmtDate(latest.created_at)}</p>
                  <Link href="/activity" className="btn btn-sm" style={{ marginTop: 8 }}>Activity</Link>
                </div>
              </div>
            )}
            {(state === "approved" || state === "paid") && latest && (
              <div className="dt-work-row">
                <WorkThumbV src={latest.media_urls[0] ?? null} alt="Your approved proof" />
                <div style={{ minWidth: 0 }}>
                  <p className="t-body" style={{ fontWeight: 600 }}>{isPaid ? `${formatMoney(paid.cents)} paid to your earnings.` : "Approved. Payment on its way."}</p>
                  <p className="t-meta" style={{ marginTop: 4 }}>Sent {fmtDate(latest.created_at)}</p>
                  <Link href="/earnings" className="btn btn-sm" style={{ marginTop: 8 }}>Earnings</Link>
                </div>
              </div>
            )}
            {state === "rejected" && latest && (
              <div className="dt-work-row">
                <WorkThumbV src={latest.media_urls[0] ?? null} alt="Your proof" />
                <div style={{ minWidth: 0 }}>
                  <p className="t-body" style={{ fontWeight: 600 }}>Not approved.</p>
                  <p className="t-meta" style={{ marginTop: 4 }}>{latest.review_note ?? `${o.business_name} did not approve this Story.`}</p>
                </div>
              </div>
            )}
          </ActionCard>
        </aside>

        <div className="dt-main-rest">
          <DSection title="What to do" id="steps">
            <Steps steps={[
              { text: "Post the creative", sub: "To your Story, as it is", icon: <InstagramLogo size={20} aria-hidden /> },
              { text: `Keep it live ${liveHours} hours`, sub: "Do not delete it early", icon: <Hourglass size={20} aria-hidden /> },
              { text: "Send proof", sub: "A screenshot and the Story link", icon: <Camera size={20} aria-hidden /> },
              { text: "Get paid", sub: "After the business approves", icon: <PaperPlaneTilt size={20} aria-hidden /> },
            ]} />
          </DSection>

          <DSection title="Requirements" id="requirements">
            <Checks items={[
              ...requirements.map((r) => ({ text: r })),
              { text: needsInstagram ? "Instagram: not connected" : `Instagram: @${ig.handle}${ig.followers != null ? ` · ${ig.followers.toLocaleString()} followers` : ""}`, state: needsInstagram || tooFewFollowers ? ("warn" as const) : ("ok" as const) },
            ]} />
            <div style={{ marginTop: 8 }}>
              <Accordion title="Full requirements">
                {o.brief && <p className="t-body" style={{ color: "var(--tm-text2)" }}>{o.brief}</p>}
                <p className="t-meta" style={{ marginTop: 8 }}>{verification.mode === "manual" ? `${o.business_name} reviews your screenshot and Story link. TapMart does not check Instagram itself.` : verification.note}</p>
              </Accordion>
            </div>
          </DSection>

          <DSection title="Creative" id="creative">
            <div className="dt-ref">
              <span className="dt-ref-thumb">
                {creative
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={creative} alt="The supplied Story creative" loading="lazy" />
                  : <span className="fs-video-fallback" style={{ fontSize: 12 }}>Not uploaded</span>}
              </span>
              <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                <p className="t-body" style={{ fontWeight: 600 }}>Supplied by {o.business_name}, 9:16</p>
                {creative && <InspectButton src={creative} alt={`The Story creative from ${o.business_name}, at its original ratio`} label="Zoom" className="btn btn-sm" />}
                {creative && <a href={creative} download className="btn btn-sm"><DownloadSimple size={16} aria-hidden /> Download</a>}
              </div>
            </div>
          </DSection>

          <DSection title="Business" id="business">
            <BizCard name={o.business_name} logo={o.business_logo} sub={bizSub} href={`/b/${o.business_slug}`} verified={o.business_verified} />
          </DSection>

          <DSection title="Timeline" id="timeline">
            <Timeline stages={STAGES} now={now} warn={state === "revision_requested" || state === "rejected"} />
          </DSection>

          <div style={{ marginTop: 28 }}>
            <Accordion title="Payment details">
              <dl className="dt-kv" style={{ marginTop: 0 }}>
                <dt>Pay</dt><dd>{formatMoney(o.pay_cents)} per approved Story</dd>
                <dt>Fee</dt><dd>{formatMoney(fee)} ({feePct}%)</dd>
                <dt>You keep</dt><dd>{formatMoney(net)}</dd>
                <dt>When</dt><dd>After {liveHours} hours live and approval</dd>
                {deadline && <><dt>Deadline</dt><dd>{deadline}</dd></>}
              </dl>
            </Accordion>
          </div>
        </div>
      </div>
      <StickyAction pay={formatMoney(o.pay_cents).replace(/\.00$/, "")} per="per Story" label={stickyLabel} tone={canParticipate || proofOpen || requestOpen || (needsInstagram && state === "none" && !accepted) ? "primary" : "quiet"} />
    </main>
  );
}
