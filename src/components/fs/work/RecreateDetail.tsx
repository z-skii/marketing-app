import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import type { V2Context } from "@/lib/v2/core";
import { fmtDate, isVideoUrl, type Opportunity } from "@/lib/v2/opportunities";
import type { Invite } from "@/lib/v2/requests";
import { guideFromCampaign } from "@/lib/ai/guide";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Money, formatMoney } from "@/components/fs/parts";
import { InspectButton } from "@/components/fs/SourceInspector";
import { RecreateUpload } from "./RecreateUpload";
import { RequestDecision } from "./RequestDecision";
import { BusinessLine, DetailTop, Facts, GoLink, PayBreakdown, Plane, PlainList, Section, Steps, WorkThumb, fmtLong } from "./DetailParts";

/**
 * Recreate a Reel, in Frame Shift: the reference joined to the graphite
 * task and its cobalt conditional pay; then what to film, what the
 * business checks, and the person's own work region, which changes with
 * the real submission state. After acceptance the screen is a workspace,
 * not discovery.
 */
export type Participation = {
  application: { id: string; status: string } | null;
  submissions: { id: string; status: string; media_urls: string[]; review_note: string | null; created_at: string }[];
};

export function RecreateDetail({ o, ctx, open, rightsNote, mine, invite, paid, feePct }: {
  o: Opportunity; ctx: V2Context; open: boolean; rightsNote: string; mine: Participation; invite: Invite | null; paid: { cents: number; fee: number } | null; feePct: number;
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
  const deadlineWord = invite ? "Campaign deadline" : "Apply by";

  return (
    <main className="fs-phone-main" id="main">
      <DetailTop o={o} open={open} />
      <div className="fs-detail">
        {/* Source assembly: the reference, then the commitment 12px lower (24px on desktop). */}
        <div className="fs-detail-source">
          <div className="fs-op-recreate is-detail">
            <div className="fs-media fs-contain" style={{ width: 184, height: 327 }}>
              {media ? (
                video ? <video src={media} controls playsInline preload="metadata" poster={o.business_cover ?? undefined} className="fs-ref-media" aria-label="The reference Reel" />
                  : <MediaPreview src={media} alt="The reference to recreate" className="fs-ref-media" priority sizes="224px" />
              ) : <div className="fs-video-fallback">Reference not available<span className="fs-video-note">The business has not uploaded one</span></div>}
              <span className="fs-media-caption">{video ? "Reference · Reel" : "Reference · still"}</span>
              {media && !video && (
                <InspectButton src={media} alt={`Reference for ${o.title}, at its original ratio`} label="Inspect" className="fs-btn" style={{ position: "absolute", left: 4, right: 4, bottom: 4, minHeight: 44, background: "#101820", color: "#F6F8FB", borderRadius: 8, fontSize: 14, padding: "0 8px", justifyContent: "flex-start" }} />
              )}
            </div>
            <div className="fs-joint fs-recreate-commitment">
              <div className="fs-on-dark" style={{ minHeight: 327, display: "flex", flexDirection: "column", color: "var(--fs-on-dark)" }}>
                <div style={{ padding: 12, flex: 1, background: "var(--fs-graphite)" }}>
                  <p className="fs-t-meta" style={{ color: "var(--fs-muted-dark)" }}>{invite ? "Direct request · Recreate Reel" : "Recreate Reel"}</p>
                  <h1 className="fs-t-task" style={{ color: "var(--fs-on-dark)", marginTop: 4 }}>{o.title}</h1>
                  <p className="fs-t-meta" style={{ color: "var(--fs-muted-dark)", marginTop: 4 }}>{o.business_name}</p>
                  <p className="fs-t-meta" style={{ color: "var(--fs-on-dark)", marginTop: 8 }}>Film your version.</p>
                </div>
                <div style={{ background: "var(--fs-accent)", padding: 12, minHeight: 112, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <Money cents={o.pay_cents} per="per approved version" className="fs-money-detail" dark />
                </div>
              </div>
            </div>
          </div>
          <p className="fs-t-meta" style={{ marginTop: 12 }}>
            {[spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"}` : "Spots filled", deadline ? `${deadlineWord} ${deadline}` : null].filter(Boolean).join(" · ")}
          </p>
          <BusinessLine o={o} />
          {o.reference_url && (
            <a href={o.reference_url} target="_blank" rel="noopener noreferrer" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }}>Open the original <ArrowSquareOut size={18} aria-hidden /></a>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          {requestOpen && invite && (
            <Plane decision style={{ marginTop: 24 }}>
              <p className="fs-t-meta">Request for you</p>
              <p className="fs-t-task" style={{ marginTop: 4 }}>{o.business_name} asks you to recreate this Reel.</p>
              <p className="fs-t-meta" style={{ marginTop: 4 }}>{formatMoney(invite.pay_cents)} per approved version. Nothing is agreed until you accept.</p>
              {invite.message && <p className="fs-t-body fs-note" style={{ marginTop: 12 }}>{invite.message}</p>}
              <RequestDecision inviteId={invite.id} businessName={o.business_name} kind="recreate_reel" />
            </Plane>
          )}
          {declined && (
            <Plane style={{ marginTop: 24 }}><p className="fs-t-label"><span className="fs-status is-neutral">Declined</span> · You declined this request.</p></Plane>
          )}

          {/* The work region comes first once there is work to do. */}
          {state !== "none" && <WorkState o={o} latest={latest!} previous={mine.submissions[1] ?? null} canSubmit={canSubmit} guide={guide} rightsNote={rightsNote} paid={paid} net={net} fee={fee} feePct={feePct} deadline={deadline} />}

          {state === "none" && !requestOpen && !declined && (
            <Section title={accepted ? "Your version" : "Take this on"} id="work">
              {accepted && <p className="fs-t-meta" style={{ marginBottom: 12 }}><span className="fs-status is-confirmed">Accepted</span> · Film and upload your version{deadline ? ` by ${deadline}` : ""}.</p>}
              {canSubmit ? (
                <>
                  <p className="fs-t-body">Only approved versions pay.</p>
                  <PayBreakdown gross={o.pay_cents} net={net} fee={fee} feePct={feePct} />
                  <div style={{ marginTop: 16 }}><RecreateUpload campaignId={o.id} guide={guide} rightsNote={rightsNote} /></div>
                </>
              ) : (
                <Plane>
                  <p className="fs-t-label">{!open ? "This campaign is closed." : "All spots are taken."}</p>
                  <GoLink href="/home">Find other work</GoLink>
                </Plane>
              )}
            </Section>
          )}

          <Section title="Before you film" id="brief">
            {o.brief && <p className="fs-t-body" style={{ marginTop: 4 }}>{o.brief}</p>}
            <Steps steps={guide.steps} />
            <Facts rows={[
              ["Length", `${guide.duration_seconds[0]} to ${guide.duration_seconds[1]} seconds`],
              ["Framing", guide.orientation === "vertical" ? "Vertical 9:16" : "Horizontal 16:9"],
              ...(guide.rules.length ? [["Keep", guide.rules.join(" · ")] as [string, React.ReactNode]] : []),
              ...(guide.avoid.length ? [["Avoid", guide.avoid.join(", ")] as [string, React.ReactNode]] : []),
            ]} />
          </Section>

          {guide.checklist.length > 0 && (
            <Section title="What the business checks" id="checks">
              <PlainList items={guide.checklist} />
              <p className="fs-t-meta" style={{ marginTop: 8 }}>{rightsNote}</p>
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}

function WorkState({ o, latest, previous, canSubmit, guide, rightsNote, paid, net, fee, feePct, deadline }: {
  o: Opportunity; latest: Participation["submissions"][number]; previous: Participation["submissions"][number] | null; canSubmit: boolean;
  guide: ReturnType<typeof guideFromCampaign>; rightsNote: string; paid: { cents: number; fee: number } | null; net: number; fee: number; feePct: number; deadline: string | null;
}) {
  const sent = fmtDate(latest.created_at);
  const file = latest.media_urls[0] ?? null;
  if (latest.status === "revision_requested") {
    return (
      <Section title="Revision requested" id="work">
        <div className="fs-note">
          <p className="fs-t-label">What {o.business_name} asked to change</p>
          <p className="fs-t-body" style={{ marginTop: 4 }}>{latest.review_note ?? "Upload a new version. The business did not leave a note."}</p>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 16 }}>
          <WorkThumb src={file} alt="Your previous version" />
          <div style={{ minWidth: 0 }}>
            <p className="fs-t-label">Your previous version</p>
            <p className="fs-t-meta">Sent {sent} · stays on record until the new one is sent</p>
            {file && (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(file)
              ? <a href={file} target="_blank" rel="noopener noreferrer" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, minHeight: 44 }}>Open file</a>
              : <InspectButton src={file} alt="Your previous version, at its original ratio" label="Inspect your version" style={{ paddingLeft: 0, minHeight: 44 }} />)}
          </div>
        </div>
        <p className="fs-t-body" style={{ marginTop: 16 }}>Resubmit a new version{deadline ? ` by ${deadline}` : ""}.</p>
        <PayBreakdown gross={o.pay_cents} net={net} fee={fee} feePct={feePct} />
        {canSubmit ? <div style={{ marginTop: 12 }}><RecreateUpload campaignId={o.id} guide={guide} rightsNote={rightsNote} label="Upload a new version" /></div>
          : <Plane style={{ marginTop: 12 }}><p className="fs-t-label">This campaign is closed, so a new version cannot be sent.</p></Plane>}
      </Section>
    );
  }
  if (latest.status === "submitted" || latest.status === "under_review") {
    return (
      <Section title="Your version" id="work">
        <Plane>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <WorkThumb src={file} alt="Your submitted version" />
            <div style={{ minWidth: 0 }}>
              <p className="fs-t-label"><span className="fs-status is-waiting">In review</span> · Sent {sent}</p>
              <p className="fs-t-meta" style={{ marginTop: 4 }}>{o.business_name} is reviewing your version.</p>
              {previous && <p className="fs-t-meta" style={{ marginTop: 4 }}>Replaces the version sent {fmtDate(previous.created_at)}.</p>}
              {file && !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(file) && <InspectButton src={file} alt="Your submitted version, at its original ratio" label="Inspect your version" style={{ paddingLeft: 0, minHeight: 44 }} />}
            </div>
          </div>
          <PayBreakdown gross={o.pay_cents} net={net} fee={fee} feePct={feePct} />
          <GoLink href="/activity">Open Activity</GoLink>
        </Plane>
      </Section>
    );
  }
  if (latest.status === "paid" || latest.status === "approved") {
    const isPaid = latest.status === "paid" && paid != null;
    return (
      <Section title="Your version" id="work">
        <Plane>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <WorkThumb src={file} alt="Your approved version" />
            <div style={{ minWidth: 0 }}>
              <p className="fs-t-label"><span className="fs-status is-confirmed">{isPaid ? "Approved and paid" : "Approved"}</span> · Sent {sent}</p>
              {!isPaid && <p className="fs-t-meta" style={{ marginTop: 4 }}><span className="fs-status is-waiting">Payment pending</span> · arrives when the business pays.</p>}
            </div>
          </div>
          {isPaid && paid
            ? <PayBreakdown gross={paid.cents + paid.fee} net={paid.cents} fee={paid.fee} feePct={paid.cents + paid.fee > 0 ? Math.round((paid.fee * 100) / (paid.cents + paid.fee)) : feePct} when="Paid to your earnings" basis="Available in Earnings" paid />
            : <PayBreakdown gross={o.pay_cents} net={net} fee={fee} feePct={feePct} when="When the business pays" basis="Added to earnings when paid" />}
          <GoLink href="/earnings">Open Earnings</GoLink>
        </Plane>
      </Section>
    );
  }
  return (
    <Section title="Your version" id="work">
      <Plane>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <WorkThumb src={file} alt="Your version" />
          <div style={{ minWidth: 0 }}>
            <p className="fs-t-label"><span className="fs-status is-problem">Not approved</span> · Sent {sent}</p>
            <p className="fs-t-body" style={{ marginTop: 4 }}>{latest.review_note ?? `${o.business_name} did not approve this version.`}</p>
          </div>
        </div>
        <Link href="/home" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: 8 }}>Find other work</Link>
      </Plane>
    </Section>
  );
}
