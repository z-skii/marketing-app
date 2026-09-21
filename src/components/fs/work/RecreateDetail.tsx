import Link from "next/link";
import { Play, VideoCamera, UploadSimple, PaperPlaneTilt, Eye, Clock, UsersThree, MapPin, CurrencyDollar, Ruler, DeviceMobile } from "@phosphor-icons/react/dist/ssr";
import type { V2Context } from "@/lib/v2/core";
import { fmtDate, isVideoUrl, type Opportunity } from "@/lib/v2/opportunities";
import type { Invite } from "@/lib/v2/requests";
import { guideFromCampaign } from "@/lib/ai/guide";
import { formatMoney } from "@/components/fs/parts";
import { InspectButton } from "@/components/fs/SourceInspector";
import { RecreateUpload } from "./RecreateUpload";
import { RequestDecision } from "./RequestDecision";
import { DetailTop, fmtLong } from "./DetailParts";
import { Accordion, ActionCard, BizCard, Checks, DSection, Facts, Hero, HeroMedia, RefRow, Steps, Timeline, WorkThumbV, isVideo } from "./DetailKit";
import { StickyAction } from "./StickyAction";

/**
 * Recreate a Reel: the reference is the hero, the pay sits on it, four
 * facts under it, then the one action the person's state allows. Watch,
 * recreate, post, submit as four steps; the checklist; the reference;
 * the business; the stage timeline; everything else behind accordions.
 */
export type Participation = {
  application: { id: string; status: string } | null;
  submissions: { id: string; status: string; media_urls: string[]; review_note: string | null; created_at: string }[];
};

const STAGES = ["Accepted", "Create", "Post", "Submit", "Review", "Paid"];

export function RecreateDetail({ o, ctx, open, rightsNote, mine, invite, paid, feePct, businessCategory = null }: {
  o: Opportunity; ctx: V2Context; open: boolean; rightsNote: string; mine: Participation; invite: Invite | null; paid: { cents: number; fee: number } | null; feePct: number; businessCategory?: string | null;
}) {
  void ctx;
  const latest = mine.submissions[0] ?? null;
  const state = latest?.status ?? "none";
  const guide = guideFromCampaign(o.details as Record<string, unknown>, o.requirements);
  const spotsLeft = Math.max(o.slots - o.approved_count, 0);
  const media = o.details.reference_media_url ?? o.reference_url ?? null;
  const video = isVideoUrl(media);
  const requestOpen = invite?.status === "sent";
  const declined = invite?.status === "declined";
  const accepted = invite?.status === "accepted" || mine.application?.status === "accepted";
  const canSubmit = open && spotsLeft > 0 && !requestOpen && !declined && (state === "none" || state === "revision_requested");
  const fee = Math.floor((o.pay_cents * feePct) / 100);
  const net = o.pay_cents - fee;
  const deadline = fmtLong(o.deadline);
  const deadlineShort = o.deadline ? fmtDate(o.deadline) : null;
  const bizSub = [businessCategory, o.city].filter(Boolean).join(" · ") || "Business";
  const isPaid = state === "paid" && paid != null;

  const now = state === "paid" ? 6 : state === "approved" ? 5 : state === "submitted" || state === "under_review" ? 4 : state === "revision_requested" ? 3 : state === "rejected" ? 4 : accepted ? 1 : requestOpen ? 0 : -1;
  const stickyLabel = state === "revision_requested" ? "Upload new version" : canSubmit ? "Upload your Reel" : requestOpen ? "Answer request" : "See status";

  const status = state === "none" && requestOpen ? <span className="badge is-warning">Request for you</span>
    : state === "none" && declined ? <span className="badge">Declined</span>
    : state === "none" && accepted ? <span className="badge is-success">Accepted</span>
    : state === "none" && !open ? <span className="badge">Closed</span>
    : state === "none" && spotsLeft === 0 ? <span className="badge">Full</span>
    : state === "revision_requested" ? <span className="badge is-warning">Revision</span>
    : state === "submitted" || state === "under_review" ? <span className="badge is-info">In review</span>
    : state === "approved" ? <span className="badge is-success">Approved</span>
    : state === "paid" ? <span className="badge is-success">Paid</span>
    : state === "rejected" ? <span className="badge is-alert">Not approved</span>
    : <span className="badge is-success">Open</span>;

  return (
    <main className="fs-phone-main" id="main">
      <DetailTop o={o} open={open} />
      <div className="dt-page">
        <div className="dt-main-top">
          <Hero kind="reel" chip={<><Play size={16} weight="fill" aria-hidden />Recreate</>} business={{ name: o.business_name, logo: o.business_logo, verified: o.business_verified }} title={o.title} pay={o.pay_cents} per="per video">
            <HeroMedia src={media} poster={o.business_cover} kind="reel" alt="The reference Reel" priority />
          </Hero>
          <Facts items={[
            { icon: <CurrencyDollar size={20} aria-hidden />, value: formatMoney(o.pay_cents).replace(/\.00$/, ""), label: "Pay" },
            { icon: <Clock size={20} aria-hidden />, value: deadlineShort ?? "Open", label: invite ? "Deadline" : "Apply by" },
            { icon: <UsersThree size={20} aria-hidden />, value: spotsLeft > 0 ? String(spotsLeft) : "Full", label: spotsLeft === 1 ? "Spot left" : "Spots left" },
            { icon: <MapPin size={20} aria-hidden />, value: o.city ?? "Anywhere", label: "Location" },
          ]} />
        </div>

        <aside className="dt-rail">
          <ActionCard pay={o.pay_cents} per="per approved video" net={isPaid ? paid.cents : net} feePct={isPaid ? Math.round((paid.fee * 100) / Math.max(paid.cents + paid.fee, 1)) : feePct} status={status}
            facts={[{ v: `${guide.duration_seconds[0]} to ${guide.duration_seconds[1]}s`, l: "Length" }, { v: guide.orientation === "vertical" ? "9:16" : "16:9", l: "Format" }, { v: deadlineShort ?? "No date", l: "Deadline" }]}>
            {requestOpen && invite && (
              <div style={{ marginTop: 12 }}>
                <p className="t-body" style={{ fontWeight: 600 }}>{o.business_name} asks you to recreate this Reel.</p>
                {invite.message && <p className="t-meta" style={{ marginTop: 6 }}>{invite.message}</p>}
                <RequestDecision inviteId={invite.id} businessName={o.business_name} kind="recreate_reel" />
              </div>
            )}
            {declined && <p className="t-meta" style={{ marginTop: 12 }}>You declined this request.</p>}
            {state === "none" && !requestOpen && !declined && (canSubmit
              ? <div style={{ marginTop: 12 }}><RecreateUpload campaignId={o.id} guide={guide} rightsNote={rightsNote} /></div>
              : <p className="t-meta" style={{ marginTop: 12 }}>{!open ? "This campaign is closed." : "All spots are taken."} <Link href="/home" className="link-accent">Find other work</Link></p>)}
            {state === "revision_requested" && latest && (
              <div style={{ marginTop: 12 }}>
                <div className="dt-work-row">
                  <WorkThumbV src={latest.media_urls[0] ?? null} alt="Your previous version" />
                  <div style={{ minWidth: 0 }}>
                    <p className="t-body" style={{ fontWeight: 600 }}>What to change</p>
                    <p className="t-meta" style={{ marginTop: 4 }}>{latest.review_note ?? "Upload a new version."}</p>
                    <p className="t-meta" style={{ marginTop: 4, color: "var(--tm-muted2)" }}>Sent {fmtDate(latest.created_at)}</p>
                  </div>
                </div>
                {canSubmit ? <div style={{ marginTop: 12 }}><RecreateUpload campaignId={o.id} guide={guide} rightsNote={rightsNote} label="Upload a new version" /></div> : <p className="t-meta" style={{ marginTop: 12 }}>This campaign is closed.</p>}
              </div>
            )}
            {(state === "submitted" || state === "under_review") && latest && (
              <div className="dt-work-row">
                <WorkThumbV src={latest.media_urls[0] ?? null} alt="Your submitted version" />
                <div style={{ minWidth: 0 }}>
                  <p className="t-body" style={{ fontWeight: 600 }}>{o.business_name} is reviewing it.</p>
                  <p className="t-meta" style={{ marginTop: 4 }}>Sent {fmtDate(latest.created_at)}</p>
                  <Link href="/activity" className="btn btn-sm" style={{ marginTop: 8 }}>Activity</Link>
                </div>
              </div>
            )}
            {(state === "approved" || state === "paid") && latest && (
              <div className="dt-work-row">
                <WorkThumbV src={latest.media_urls[0] ?? null} alt="Your approved version" />
                <div style={{ minWidth: 0 }}>
                  <p className="t-body" style={{ fontWeight: 600 }}>{isPaid ? `${formatMoney(paid.cents)} paid to your earnings.` : "Approved. Payment on its way."}</p>
                  <p className="t-meta" style={{ marginTop: 4 }}>Sent {fmtDate(latest.created_at)}</p>
                  <Link href="/earnings" className="btn btn-sm" style={{ marginTop: 8 }}>Earnings</Link>
                </div>
              </div>
            )}
            {state === "rejected" && latest && (
              <div className="dt-work-row">
                <WorkThumbV src={latest.media_urls[0] ?? null} alt="Your version" />
                <div style={{ minWidth: 0 }}>
                  <p className="t-body" style={{ fontWeight: 600 }}>Not approved.</p>
                  <p className="t-meta" style={{ marginTop: 4 }}>{latest.review_note ?? `${o.business_name} did not approve this version.`}</p>
                  <Link href="/home" className="btn btn-sm" style={{ marginTop: 8 }}>Find other work</Link>
                </div>
              </div>
            )}
          </ActionCard>
        </aside>

        <div className="dt-main-rest">
          <DSection title="What to do" id="steps">
            <Steps steps={[
              { text: "Watch the reference", sub: "Note the shots and the order", icon: <Eye size={20} aria-hidden /> },
              { text: "Recreate the video", sub: `${guide.duration_seconds[0]} to ${guide.duration_seconds[1]} seconds, ${guide.orientation === "vertical" ? "vertical" : "horizontal"}`, icon: <VideoCamera size={20} aria-hidden /> },
              { text: "Post it", sub: "On your own account", icon: <PaperPlaneTilt size={20} aria-hidden /> },
              { text: "Upload it here", sub: "The business approves, approval pays", icon: <UploadSimple size={20} aria-hidden /> },
            ]} />
          </DSection>

          <DSection title="Requirements" id="requirements">
            <Checks items={[
              ...guide.checklist,
              ...(guide.checklist.length === 0 ? [`${guide.duration_seconds[0]} to ${guide.duration_seconds[1]} seconds`, guide.orientation === "vertical" ? "Vertical 9:16" : "Horizontal 16:9"] : []),
            ]} />
            {(guide.steps.length > 0 || guide.rules.length > 0 || guide.avoid.length > 0 || o.brief) && (
              <div style={{ marginTop: 8 }}>
                <Accordion title="Full requirements">
                  {o.brief && <p className="t-body" style={{ color: "var(--tm-text2)" }}>{o.brief}</p>}
                  {guide.steps.length > 0 && <div style={{ marginTop: 12 }}><Steps steps={guide.steps.map((s) => ({ text: s.text, sub: s.timing ?? null, frame: s.frame_url ?? null }))} /></div>}
                  {guide.rules.length > 0 && <div style={{ marginTop: 12 }}><Checks items={guide.rules} /></div>}
                  {guide.avoid.length > 0 && <div style={{ marginTop: 12 }}><Checks items={guide.avoid.map((a) => ({ text: `Avoid: ${a}`, state: "warn" as const }))} /></div>}
                  <p className="t-meta" style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap" }}><span><Ruler size={16} aria-hidden style={{ verticalAlign: "-3px" }} /> {guide.duration_seconds[0]} to {guide.duration_seconds[1]}s</span><span><DeviceMobile size={16} aria-hidden style={{ verticalAlign: "-3px" }} /> {guide.orientation === "vertical" ? "Vertical 9:16" : "Horizontal 16:9"}</span></p>
                </Accordion>
              </div>
            )}
          </DSection>

          <DSection title="Reference" id="reference">
            <RefRow src={media} poster={o.business_cover} alt="The reference Reel" originalHref={o.reference_url}>
              <p className="t-body" style={{ fontWeight: 600 }}>{video ? "The Reel to recreate" : "The still to recreate"}</p>
              {media && <InspectButton src={media} alt={`Reference for ${o.title}, at its original ratio`} label={video ? "Play" : "Zoom"} className="btn btn-sm" icon={false}><Play size={16} weight="fill" aria-hidden /> {video ? "Play" : "Zoom"}</InspectButton>}
            </RefRow>
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
                <dt>Pay</dt><dd>{formatMoney(o.pay_cents)} per approved video</dd>
                <dt>Fee</dt><dd>{formatMoney(fee)} ({feePct}%)</dd>
                <dt>You keep</dt><dd>{formatMoney(net)}</dd>
                <dt>When</dt><dd>Added to Earnings after approval</dd>
                {deadline && <><dt>Deadline</dt><dd>{deadline}</dd></>}
              </dl>
            </Accordion>
            <Accordion title="Terms"><p className="t-body" style={{ color: "var(--tm-text2)" }}>{rightsNote}</p></Accordion>
          </div>
        </div>
      </div>
      <StickyAction pay={formatMoney(o.pay_cents).replace(/\.00$/, "")} per="per video" label={stickyLabel} tone={canSubmit || requestOpen ? "primary" : "quiet"} />
    </main>
  );
}

/** Play or zoom, decided by the file kind, for callers that only have the URL. */
export function playOrZoom(src: string): string { return isVideo(src) ? "Play" : "Zoom"; }
