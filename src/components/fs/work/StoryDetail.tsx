import Link from "next/link";
import type { V2Context } from "@/lib/v2/core";
import { fmtDate, type Opportunity } from "@/lib/v2/opportunities";
import type { Invite } from "@/lib/v2/requests";
import type { StoryVerification } from "@/lib/v2/instagram";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Money, formatMoney } from "@/components/fs/parts";
import { InspectButton } from "@/components/fs/SourceInspector";
import { ParticipateButton, StoryProofForm } from "./StoryControls";
import { RequestDecision } from "./RequestDecision";
import { BusinessLine, DetailTop, GoLink, Plane, PlainList, Section, WorkThumb, fmtLong } from "./DetailParts";
import type { Participation } from "./RecreateDetail";

/**
 * Post a Story, in Frame Shift: the supplied creative as an intact sheet,
 * the commitment beside it, then eligibility as literal states, the
 * requirements, and the person's task: take a spot, post, send proof.
 */
export function StoryDetail({ o, ctx, open, mine, invite, verification, paid, feePct }: {
  o: Opportunity; ctx: V2Context; open: boolean; mine: Participation; invite: Invite | null; verification: StoryVerification; paid: { cents: number; fee: number } | null; feePct: number;
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
  const net = o.pay_cents - Math.floor((o.pay_cents * feePct) / 100);
  const deadline = fmtLong(o.deadline);
  const returnTo = encodeURIComponent(`/o/${o.id}`);
  const requirements = [
    `Keep it live ${liveHours} hours`,
    minFollowers ? `${minFollowers.toLocaleString()}+ followers` : null,
    "Do not crop the creative",
    ...o.requirements.filter((r) => !/live|followers|crop/i.test(r)),
  ].filter(Boolean) as string[];
  const igLine = ig.status === "connected"
    ? `@${ig.handle ?? ""} · ${ig.verifiedBy === "api" ? "Connected" : "Confirmed manually"}${ig.followers != null ? ` · ${ig.followers.toLocaleString()} followers` : ""}`
    : ig.status === "pending" ? "Checking your account" : ig.status === "error" ? "Connection needs attention" : "Not connected";

  return (
    <main className="fs-phone-main" id="main">
      <DetailTop o={o} open={open} />
      <div className="fs-detail">
        <div className="fs-detail-source">
          <div className="fs-op-story is-detail">
            <div className="fs-joint fs-story-commitment" style={{ display: "flex", flexDirection: "column" }}>
              <p className="fs-t-meta">{invite ? "Direct request · Instagram Story ad" : "Instagram Story ad"}</p>
              <div style={{ marginTop: 8, borderLeft: "3px solid var(--fs-accent)", paddingLeft: 12, minHeight: 64, display: "flex", alignItems: "center" }}>
                <Money cents={o.pay_cents} per={`after ${liveHours}h live and approval`} className="fs-money-detail" />
              </div>
              <h1 className="fs-t-task" style={{ marginTop: 12 }}>{o.title}</h1>
              <BusinessLine o={o} />
              <p className="fs-t-meta" style={{ marginTop: 4 }}>{minFollowers ? `${minFollowers.toLocaleString()}+ followers · ` : ""}{liveHours}h live</p>
              <p className="fs-t-meta" style={{ marginTop: 12 }}>{[spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"}` : "Spots filled", deadline ? `Apply by ${deadline}` : null].filter(Boolean).join(" · ")}</p>
            </div>
            <div>
              <div className="fs-media fs-sheet-source fs-story-sheet" style={{ width: 180, height: 320 }}>
                {creative ? <MediaPreview src={creative} alt={`The supplied Story creative for ${o.business_name}`} className="fs-story-media" priority sizes="198px" />
                  : <div className="fs-video-fallback" style={{ background: "var(--fs-underlay)", color: "var(--fs-muted)" }}>Creative not uploaded yet</div>}
              </div>
              <p className="fs-t-meta" style={{ marginTop: 8 }}>Supplied creative</p>
              {creative && <InspectButton src={creative} alt={`The Story creative from ${o.business_name}, at its original ratio`} label="Inspect" style={{ paddingLeft: 0, minHeight: 44 }} />}
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          {requestOpen && invite && (
            <Plane decision style={{ marginTop: 24 }}>
              <p className="fs-t-meta">Request for you</p>
              <p className="fs-t-task" style={{ marginTop: 4 }}>{o.business_name} asks you to post this Story.</p>
              <p className="fs-t-meta" style={{ marginTop: 4 }}>{formatMoney(invite.pay_cents)} after {liveHours}h live and approval. Nothing is agreed until you accept.</p>
              {invite.message && <p className="fs-t-body fs-note" style={{ marginTop: 12 }}>{invite.message}</p>}
              <RequestDecision inviteId={invite.id} businessName={o.business_name} kind="instagram_story" />
            </Plane>
          )}
          {declined && <Plane style={{ marginTop: 24 }}><p className="fs-t-label"><span className="fs-status is-neutral">Declined</span> · You declined this request.</p></Plane>}

          {/* Work region, by real state. */}
          {state === "revision_requested" && latest && (
            <Section title="Revision requested" id="work">
              <div className="fs-note">
                <p className="fs-t-label">What {o.business_name} asked to change</p>
                <p className="fs-t-body" style={{ marginTop: 4 }}>{latest.review_note ?? "Send new proof. The business did not leave a note."}</p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 16 }}>
                <WorkThumb src={latest.media_urls[0] ?? null} alt="Your previous proof" />
                <div><p className="fs-t-label">Your previous proof</p><p className="fs-t-meta">Sent {fmtDate(latest.created_at)} · stays on record until new proof is sent</p></div>
              </div>
              {proofOpen ? <StoryProofForm campaignId={o.id} label="Send new proof" /> : <p className="fs-t-meta" style={{ marginTop: 12 }}>This campaign is closed, so new proof cannot be sent.</p>}
            </Section>
          )}
          {(state === "submitted" || state === "under_review") && latest && (
            <Section title="Your proof" id="work">
              <Plane>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <WorkThumb src={latest.media_urls[0] ?? null} alt="Your screenshot of the story" />
                  <div style={{ minWidth: 0 }}>
                    <p className="fs-t-label"><span className="fs-status is-waiting">In review</span> · Sent {fmtDate(latest.created_at)}</p>
                    <p className="fs-t-meta" style={{ marginTop: 4 }}>{o.business_name} checks it and approves. Then {formatMoney(net)} goes to your earnings ({formatMoney(o.pay_cents)} less the {feePct}% fee).</p>
                  </div>
                </div>
                <GoLink href="/activity">Open Activity</GoLink>
              </Plane>
            </Section>
          )}
          {(state === "paid" || state === "approved") && latest && (
            <Section title="Your proof" id="work">
              <Plane>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <WorkThumb src={latest.media_urls[0] ?? null} alt="Your approved proof" />
                  <div style={{ minWidth: 0 }}>
                    <p className="fs-t-label"><span className="fs-status is-confirmed">{state === "paid" && paid ? "Approved and paid" : "Approved"}</span> · Sent {fmtDate(latest.created_at)}</p>
                    {state === "paid" && paid ? (
                      <><p className="fs-money-record" style={{ marginTop: 8 }}>{formatMoney(paid.cents)}</p><p className="fs-t-meta">to your earnings · {formatMoney(paid.cents + paid.fee)} less {formatMoney(paid.fee)} fee</p></>
                    ) : <p className="fs-t-meta" style={{ marginTop: 4 }}><span className="fs-status is-waiting">Payment pending</span> · {formatMoney(net)} arrives when the business pays.</p>}
                  </div>
                </div>
                <GoLink href="/earnings">Open Earnings</GoLink>
              </Plane>
            </Section>
          )}
          {state === "rejected" && latest && (
            <Section title="Your proof" id="work">
              <Plane><p className="fs-t-label"><span className="fs-status is-problem">Not approved</span> · Sent {fmtDate(latest.created_at)}</p><p className="fs-t-body" style={{ marginTop: 4 }}>{latest.review_note ?? `${o.business_name} did not approve this story.`}</p></Plane>
            </Section>
          )}

          {state === "none" && !requestOpen && !declined && (
            (participating || acceptedRequest) ? (
              <Section title="Your task" id="work">
                <p className="fs-t-meta" style={{ marginBottom: 4 }}><span className="fs-status is-confirmed">Accepted</span> · Posting as @{ig.handle ?? "your account"}{deadline ? ` · by ${deadline}` : ""}</p>
                <ol className="fs-steps">
                  <li><div className="fs-step"><span className="fs-step-frame" aria-hidden>01</span><span><span className="fs-t-body" style={{ display: "block" }}>Download the creative as is.</span>{creative && <a href={creative} download className="fs-btn fs-btn-secondary fs-btn-sm" style={{ marginTop: 4 }}>Download</a>}</span></div></li>
                  <li><div className="fs-step"><span className="fs-step-frame" aria-hidden>02</span><span className="fs-t-body">Post it to your Story. Keep it live {liveHours} hours. Do not crop it.</span></div></li>
                  <li><div className="fs-step"><span className="fs-step-frame" aria-hidden>03</span><span className="fs-t-body">Send proof: a screenshot of the story and its link.</span></div></li>
                </ol>
                {proofOpen ? <StoryProofForm campaignId={o.id} /> : <p className="fs-t-meta" style={{ marginTop: 12 }}>This campaign is closed.</p>}
                <p className="fs-t-meta" style={{ marginTop: 12 }}>Approval pays {formatMoney(net)} to your earnings ({formatMoney(o.pay_cents)} less the {feePct}% fee).</p>
              </Section>
            ) : (
              <Section title="Take this on" id="work">
                {needsInstagram ? (
                  <Plane>
                    <p className="fs-t-label"><span className="fs-status is-problem">Instagram not connected</span></p>
                    <p className="fs-t-meta" style={{ marginTop: 4 }}>Story campaigns pay per story on your own account. Add your handle once.</p>
                    <Link href={`/me/instagram?return=${returnTo}`} className="fs-btn fs-btn-primary" style={{ marginTop: 12 }}>Connect Instagram</Link>
                  </Plane>
                ) : tooFewFollowers ? (
                  <Plane>
                    <p className="fs-t-label"><span className="fs-status is-problem">Needs {(minFollowers ?? 0).toLocaleString()}+ followers</span></p>
                    <p className="fs-t-meta" style={{ marginTop: 4 }}>@{ig.handle} has {(ig.followers ?? 0).toLocaleString()} on file. If that changed, update it on your profile.</p>
                    <Link href={`/me/instagram?return=${returnTo}`} className="fs-btn fs-btn-secondary" style={{ marginTop: 12 }}>Update my Instagram</Link>
                  </Plane>
                ) : canParticipate ? (
                  <>
                    <p className="fs-t-body">Posting as @{ig.handle}. Taking a spot reserves it; you then download the creative, post it, and send proof. Approval pays {formatMoney(net)} to your earnings.</p>
                    <div style={{ marginTop: 12 }}><ParticipateButton campaignId={o.id} /></div>
                  </>
                ) : (
                  <Plane><p className="fs-t-label">{!open ? "This campaign is closed." : "All spots are taken."}</p><GoLink href="/home">Find other work</GoLink></Plane>
                )}
              </Section>
            )
          )}

          <Section title="Eligibility" id="eligibility">
            <Link href={`/me/instagram?return=${returnTo}`} className="fs-row-link" style={{ minHeight: 56 }}>
              <span><span className="fs-t-label" style={{ display: "block" }}>Instagram</span><span className={`fs-status is-${ig.status === "connected" ? "confirmed" : "problem"}`}>{igLine}</span></span>
            </Link>
            {minFollowers && (
              <div className="fs-row-link" style={{ minHeight: 56, borderTop: "1px solid var(--fs-divider)" }}>
                <span><span className="fs-t-label" style={{ display: "block" }}>Followers</span><span className={`fs-status is-${eligible ? "confirmed" : "problem"}`}>{minFollowers.toLocaleString()}+ needed{ig.followers != null ? ` · you have ${ig.followers.toLocaleString()}` : ""}</span></span>
              </div>
            )}
          </Section>

          <Section title="What to do" id="requirements">
            <PlainList items={requirements} />
            <p className="fs-t-meta" style={{ marginTop: 8 }}>{verification.mode === "manual" ? `Verified by ${o.business_name} from your screenshot and story link.` : verification.note}</p>
          </Section>
        </div>
      </div>
    </main>
  );
}
