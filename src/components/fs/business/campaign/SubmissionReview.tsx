"use client";

import Link from "next/link";
import { useState } from "react";
import { reviewSubmission } from "@/app/(v2)/jobs/[id]/actions";
import type { SubmissionRow } from "@/lib/v2/campaigns";
import type { BusinessCampaign, CreatorProvenance } from "@/lib/fs/business-campaigns";
import { Avatar, formatMoney } from "@/components/fs/parts";
import { BackLink } from "@/components/fs/work/BackLink";
import { Facts } from "@/components/fs/work/DetailParts";
import { InspectButton } from "@/components/fs/SourceInspector";
import { SUBMISSION_WORD, fmtDay } from "./parts";
import { useAction, ErrorLine } from "./Controls";
import type { FundingFacts } from "@/components/fs/business/flows/FundingPlane";
import { Img } from "@/components/fs/Img";

/**
 * Reviewing one piece of work. Recreate: the submitted video on the
 * stage, the reference beside it, the brief's checklist, the creator,
 * the literal status. Story: the supplied creative, the submitted proof,
 * the Story link when one was recorded, the required live time and the
 * eligibility as recorded. Approve pays now; the button says so with the
 * amount. Request changes keeps the original and records the note.
 */
const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export function SubmissionReview({ campaign, submission: s, provenance, funding }: { campaign: BusinessCampaign; submission: SubmissionRow; provenance: CreatorProvenance; funding: FundingFacts }) {
  const story = campaign.kind === "instagram_story";
  const d = campaign.details;
  const word = SUBMISSION_WORD[s.status] ?? { label: s.status, tone: "neutral" as const };
  const reviewable = ["submitted", "under_review", "revision_requested"].includes(s.status);
  const [panel, setPanel] = useState<"changes" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const { pending, error, run } = useAction();
  const fee = Math.floor((campaign.pay_cents * funding.feePct) / 100);
  const name = s.creator_name ?? s.creator_username;
  const primary = s.media_urls[0] ?? null;
  const reference = story ? d.creative_url ?? null : d.reference_media_url ?? null;
  const checklist = story
    ? [`Keep it live ${d.live_hours ?? 24} hours`, ...(d.min_followers ? [`${d.min_followers.toLocaleString()}+ followers`] : []), "Do not crop or edit the creative"]
    : (d.guide?.checklist?.length ? d.guide.checklist : campaign.requirements);
  const spotsLeft = campaign.slots - campaign.approved;

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-detail-top">
        <BackLink fallback={`/business/campaigns/${campaign.id}`} label={campaign.title} />
        <span className={`fs-status is-${word.tone}`}>{word.label}</span>
      </div>
      <h1 className="fs-t-page" style={{ marginTop: 8 }}>{story ? "Story proof" : "Submitted video"}</h1>
      <p className="fs-t-meta" style={{ marginTop: 4 }}>{name} · {fmtDay(s.created_at)}</p>

      <div className="fs-detail" style={{ marginTop: 12 }}>
        <div className="fs-detail-source">
          <div className="fs-stage fs-review-stage">
            {primary ? (
              VIDEO.test(primary) ? <video src={primary} controls playsInline preload="metadata" aria-label={story ? "Submitted proof" : "Submitted video"} />
              : <Img src={primary} alt={story ? "Submitted screenshot" : "Submitted image"} />
            ) : <span className="fs-video-fallback">Nothing attached</span>}
          </div>
          {s.media_urls.length > 1 && (
            <ul className="fs-filmstrip" aria-label="More files">
              {s.media_urls.slice(1).map((u) => (
                <li key={u}><InspectButton src={u} alt="Another submitted file" label="Inspect" className="fs-film-thumb" icon={false}>{!VIDEO.test(u) && <Img src={u} alt="" />}</InspectButton></li>
              ))}
            </ul>
          )}
          <div className="fs-review-pair">
            <div>
              <p className="fs-t-label">{story ? "Supplied creative" : "Reference"}</p>
              {reference ? (
                VIDEO.test(reference) ? <video className="fs-media fs-review-ref" src={reference} controls muted playsInline preload="metadata" aria-label="Reference" />
                : <InspectButton src={reference} alt={story ? "The supplied creative" : "The reference"} label="Inspect" className="fs-media fs-review-ref" icon={false}><Img src={reference} alt="" /></InspectButton>
              ) : <p className="fs-t-meta">{campaign.reference_url ? <a href={campaign.reference_url} className="fs-link-ink fs-link-ul" target="_blank" rel="noreferrer">Linked reference</a> : "No reference file"}</p>}
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="fs-t-label">{story ? "What was required" : "Brief checklist"}</p>
              <ul className="fs-plain-list" style={{ marginTop: 4 }}>{checklist.map((c) => <li key={c} className="fs-t-body">· {c}</li>)}</ul>
            </div>
          </div>
        </div>

        <div className="fs-joint">
          <div className="fs-person-line">
            <Avatar src={s.creator_avatar} name={name} size={48} />
            <span style={{ minWidth: 0 }}>
              <span className="fs-t-task" style={{ display: "block" }}>{name} <span className="fs-t-meta">@{s.creator_username}</span></span>
              <span className="fs-t-meta" style={{ display: "block" }}>{[provenance.verified ? "Verified creator" : "Creator not verified", provenance.instagram_status === "connected" ? `Instagram connected${provenance.instagram_handle ? ` · @${provenance.instagram_handle}` : ""}${provenance.instagram_followers != null ? ` · ${provenance.instagram_followers.toLocaleString()} followers` : ""}` : "Instagram not connected", provenance.completed_jobs > 0 ? `${provenance.completed_jobs} completed` : null].filter(Boolean).join(" · ")}</span>
              <Link href={`/business/people/${s.creator_username}`} className="fs-link-ink fs-link-ul fs-t-meta" style={{ display: "inline-block", marginTop: 4 }}>View person</Link>
            </span>
          </div>

          {story && (
            <div style={{ marginTop: 16 }}>
              <Facts rows={[
                ["Story link", s.meta?.story_url ? <a key="l" href={s.meta.story_url} className="fs-link-ink fs-link-ul" target="_blank" rel="noreferrer">{s.meta.story_url}</a> : "Not recorded"],
                ["Posted", s.meta?.posted_at ? fmtDay(s.meta.posted_at) ?? "Recorded" : "Not recorded"],
                ["Must stay live", `${d.live_hours ?? 24} hours`],
                ["Followers needed", d.min_followers ? `${d.min_followers.toLocaleString()} or more · ${provenance.instagram_followers != null ? `${provenance.instagram_followers.toLocaleString()} recorded` : "none recorded"}` : "Any"],
              ]} />
              <p className="fs-t-meta" style={{ marginTop: 8 }}>TapMart has not checked this Story on Instagram. Your approval is the check.</p>
            </div>
          )}
          {s.note && <p className="fs-t-body fs-note" style={{ marginTop: 16 }}>Their note · {s.note}</p>}
          {s.review_note && <p className="fs-t-meta fs-note" style={{ marginTop: 12 }}>Your note · {s.review_note}</p>}

          <div className="fs-plane is-decision" style={{ marginTop: 16 }} aria-label="Decision">
            {reviewable ? (
              <>
                <p className="fs-t-label">Your decision</p>
                <p className="fs-t-body" style={{ marginTop: 4 }}>Approving pays <b className="fs-tnum">{formatMoney(campaign.pay_cents)}</b> from your campaign credit now{funding.feePct > 0 ? `; ${name} receives ${formatMoney(campaign.pay_cents - fee)} after the ${funding.feePct}% fee` : ""}. Credit now: {formatMoney(funding.walletCents)}.</p>
                {spotsLeft <= 0 && <p className="fs-t-meta" style={{ marginTop: 4 }}>Every spot is already approved. Approving one more is not possible.</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  <button type="button" className="fs-btn fs-btn-primary" disabled={pending || spotsLeft <= 0 || funding.walletCents < campaign.pay_cents} onClick={() => run(() => reviewSubmission(s.id, "approved", ""))}>{pending ? "Working" : `Approve and pay ${formatMoney(campaign.pay_cents)}`}</button>
                  <button type="button" className="fs-btn fs-btn-secondary" disabled={pending} aria-expanded={panel === "changes"} onClick={() => setPanel(panel === "changes" ? null : "changes")}>Request changes</button>
                  <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" disabled={pending} aria-expanded={panel === "reject"} onClick={() => setPanel(panel === "reject" ? null : "reject")}>Reject</button>
                </div>
                {funding.walletCents < campaign.pay_cents && <p className="fs-t-meta" style={{ marginTop: 8 }}>Your credit does not cover this payment. <Link href="/business/billing" className="fs-link-ink fs-link-ul">Add credit</Link> first.</p>}
                {panel && (
                  <div style={{ marginTop: 12 }}>
                    <label htmlFor="fs-review-note" className="fs-field-label">{panel === "changes" ? "What should change" : "Why it is rejected"}</label>
                    <textarea id="fs-review-note" className="fs-textarea" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={panel === "changes" ? "Keep the cup in frame the whole time." : "Tell them plainly."} />
                    <p className="fs-t-meta" style={{ marginTop: 4 }}>{panel === "changes" ? "Their original stays. They see this note and can submit again." : "They see this note. Nothing is paid."}</p>
                    <button type="button" className="fs-btn fs-btn-secondary" style={{ marginTop: 8 }} disabled={pending || note.trim().length < 3} onClick={() => run(() => reviewSubmission(s.id, panel === "changes" ? "revision_requested" : "rejected", note.trim()), () => { setPanel(null); setNote(""); })}>{pending ? "Sending" : panel === "changes" ? "Send the request" : "Reject with this note"}</button>
                  </div>
                )}
                <ErrorLine error={error} />
              </>
            ) : (
              <>
                <p className="fs-t-label">Decided</p>
                <p className="fs-t-body" style={{ marginTop: 4 }}>{s.status === "paid" ? `Approved. ${formatMoney(campaign.pay_cents)} left your credit and ${formatMoney(campaign.pay_cents - fee)} went to ${name}.` : s.status === "approved" ? "Approved." : s.status === "rejected" ? "Rejected. Nothing was paid." : word.label}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
