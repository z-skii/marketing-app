"use client";

import Link from "next/link";
import { useState } from "react";
import { reviewSubmission } from "@/app/(v2)/jobs/[id]/actions";
import type { SubmissionRow } from "@/lib/v2/campaigns";
import type { BusinessCampaign, CreatorProvenance } from "@/lib/fs/business-campaigns";
import { Avatar, Money, formatMoney } from "@/components/fs/parts";
import { BackLink } from "@/components/fs/work/BackLink";
import { Facts } from "@/components/fs/work/DetailParts";
import { InspectButton } from "@/components/fs/SourceInspector";
import { Img } from "@/components/fs/Img";
import { Menu } from "@/ds/Menu";
import { CheckCircleIcon, XCircleIcon, UserIcon, LinkIcon, DownloadIcon } from "@/ds/icons";
import { SUBMISSION_WORD, fmtDay } from "./parts";
import { useAction, ErrorLine } from "./Controls";
import type { FundingFacts } from "@/components/fs/business/flows/FundingPlane";

/**
 * Reviewing one piece of work. The source assembly is wide: the submitted
 * file on a graphite stage with the reference or supplied creative beside
 * it and the checklist under them. The decision plane is narrow and starts
 * one shift lower: the creator with recorded provenance, the recorded
 * facts, their note, then the money as the anchor and the actions. Approve
 * pays now and the button says the amount. Request changes keeps the
 * original and records the note.
 */
const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

function whenWord(iso: string | undefined): string {
  if (!iso) return "Not recorded";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Not recorded";
  const hasTime = /T\d{2}:\d{2}/.test(iso);
  if (!hasTime) return `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(d)} · Time not recorded`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(d);
}

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
  const covered = funding.walletCents >= campaign.pay_cents;

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-detail-top">
        <BackLink fallback={`/business/campaigns/${campaign.id}`} label="Campaign" />
        <span className={`fs-status is-${word.tone}`}>{word.label}</span>
      </div>
      <h1 className="fs-t-page" style={{ marginTop: 8 }}>{story ? "Story proof" : "Submitted video"}</h1>
      <p className="fs-t-meta" style={{ marginTop: 4 }}>{name} · {campaign.title} · {fmtDay(s.created_at)}</p>

      <div className="fs-review">
        <div>
          <div className="fs-review-source">
            <div>
              <p className="fs-t-label">{story ? "Submitted proof" : "Submitted video"}</p>
              <div className="fs-stage fs-review-stage" style={{ marginTop: 4 }}>
                {primary ? (
                  VIDEO.test(primary) ? <video src={primary} controls playsInline preload="metadata" aria-label={story ? "Submitted proof" : "Submitted video"} />
                  : <Img src={primary} alt={story ? "Submitted screenshot" : "Submitted image"} />
                ) : <span className="fs-video-fallback">Nothing attached</span>}
              </div>
              <div className="fs-source-actions">
                {primary && !VIDEO.test(primary) && <InspectButton src={primary} alt={story ? "The submitted proof" : "The submitted image"} label="Zoom" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }} />}
              </div>
              {s.media_urls.length > 1 && (
                <ul className="fs-filmstrip" aria-label="More files">
                  {s.media_urls.slice(1).map((u) => (
                    <li key={u}><InspectButton src={u} alt="Another submitted file" label="Inspect" className="fs-film-thumb" icon={false}>{!VIDEO.test(u) && <Img src={u} alt="" />}</InspectButton></li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="fs-t-label">{story ? "Supplied creative" : "Reference"}</p>
              {reference ? (
                <div style={{ marginTop: 4 }}>
                  {VIDEO.test(reference) ? <video className={`fs-media fs-review-ref${story ? " fs-sheet-source" : ""}`} src={reference} controls muted playsInline preload="metadata" aria-label="Reference" />
                  : <Img className={`fs-media fs-review-ref${story ? " fs-sheet-source" : ""}`} src={reference} alt={story ? "The supplied creative" : "The reference"} />}
                  {!VIDEO.test(reference) && <InspectButton src={reference} alt={story ? "The supplied creative" : "The reference"} label={story ? "Open supplied creative" : "Open reference"} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }} />}
                </div>
              ) : <p className="fs-t-meta" style={{ marginTop: 4 }}>{campaign.reference_url ? <a href={campaign.reference_url} className="fs-link-ink fs-link-ul" target="_blank" rel="noreferrer">Open the linked Reel</a> : "No reference file"}</p>}
              <p className="fs-t-label" style={{ marginTop: 16 }}>{story ? "What was required" : "Brief checklist"}</p>
              <ul className="fs-plain-list" style={{ marginTop: 4 }}>{checklist.map((c) => <li key={c} className="fs-t-body">· {c}</li>)}</ul>
            </div>
          </div>
        </div>

        <div className="fs-review-decision">
          <div className="fs-person-line">
            <Avatar src={s.creator_avatar} name={name} size={48} />
            <span style={{ minWidth: 0 }}>
              <span className="fs-t-task" style={{ display: "block" }}>{name} <span className="fs-t-meta">@{s.creator_username}</span></span>
              <span className="fs-t-meta" style={{ display: "block" }}>{[provenance.verified ? "Verified" : "Not verified", provenance.instagram_status === "connected" ? `${provenance.instagram_handle ? `@${provenance.instagram_handle}` : "Instagram"}${provenance.instagram_followers != null ? ` · ${provenance.instagram_followers.toLocaleString()} followers` : ""}` : "No Instagram", provenance.completed_jobs > 0 ? `${provenance.completed_jobs} completed` : null].filter(Boolean).join(" · ")}</span>
            </span>
          </div>

          {story && (
            <div style={{ marginTop: 16 }}>
              <Facts rows={[
                ["Story link", s.meta?.story_url ? <a key="l" href={s.meta.story_url} className="fs-link-ink fs-link-ul" target="_blank" rel="noreferrer">{s.meta.story_url}</a> : "Not recorded"],
                ["Posted", whenWord(s.meta?.posted_at)],
                ["Must stay live", `${d.live_hours ?? 24} hours`],
                ["Followers needed", d.min_followers ? `${d.min_followers.toLocaleString()} or more · ${provenance.instagram_followers != null ? `${provenance.instagram_followers.toLocaleString()} recorded` : "none recorded"}` : "Any"],
              ]} />
              <p className="fs-t-meta" style={{ marginTop: 8 }}>Not checked by TapMart. Your approval is the check.</p>
            </div>
          )}
          {s.note && <p className="fs-t-body fs-note" style={{ marginTop: 16 }}>Their note · {s.note}</p>}
          {s.review_note && <p className="fs-t-meta fs-note" style={{ marginTop: 12 }}>Your note · {s.review_note}</p>}

          <div className="fs-plane is-decision" style={{ marginTop: 16 }} aria-label="Decision">
            {reviewable ? (
              <>
                <p className="fs-t-label">Paid on approval</p>
                <div className="fs-review-money"><Money cents={campaign.pay_cents} per={story ? "for this Story" : "for this video"} className="fs-money-detail" /></div>
                <p className="fs-t-meta" style={{ marginTop: 8 }}>{funding.feePct > 0 ? `${formatMoney(campaign.pay_cents - fee)} to ${name} after the ${funding.feePct}% fee` : `${formatMoney(campaign.pay_cents)} to ${name}`} · Credit {formatMoney(funding.walletCents)}</p>
                {spotsLeft <= 0 && <p className="fs-t-meta" style={{ marginTop: 4 }}>All spots approved.</p>}
                <div className="ap-actions" style={{ marginTop: 12 }}>
                  <button type="button" className="fs-btn fs-btn-primary" disabled={pending || spotsLeft <= 0 || !covered} onClick={() => run(() => reviewSubmission(s.id, "approved", ""))}><CheckCircleIcon size={20} weight="fill" aria-hidden />{pending ? "Working" : "Approve"}</button>
                  <button type="button" className="fs-btn fs-btn-secondary" disabled={pending} aria-expanded={panel === "changes"} onClick={() => setPanel(panel === "changes" ? null : "changes")}>Revise</button>
                  <Menu label="More" items={[
                    { label: "View profile", href: `/business/people/${s.creator_username}`, icon: <UserIcon size={20} aria-hidden /> },
                    ...(primary ? [{ label: "Open original", href: primary, external: true, icon: <LinkIcon size={20} aria-hidden /> }, { label: "Download", href: primary, external: true, icon: <DownloadIcon size={20} aria-hidden /> }] : []),
                    { label: "Reject", onClick: () => setPanel(panel === "reject" ? null : "reject"), icon: <XCircleIcon size={20} aria-hidden />, danger: true },
                  ]} />
                </div>
                {!covered && <p className="fs-t-meta" style={{ marginTop: 8 }}>Not enough credit. <Link href="/business/billing" className="fs-link-ink fs-link-ul">Add credit</Link></p>}
                {panel && (
                  <div style={{ marginTop: 12 }}>
                    <label htmlFor="fs-review-note" className="fs-field-label">{panel === "changes" ? "What should change" : "Why"}</label>
                    <textarea id="fs-review-note" className="fs-textarea" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={panel === "changes" ? "Keep the cup in frame the whole time." : "Tell them plainly."} />
                    <p className="fs-t-meta" style={{ marginTop: 4 }}>{panel === "changes" ? "They can submit again." : "Nothing is paid."}</p>
                    <button type="button" className={`fs-btn ${panel === "changes" ? "fs-btn-secondary" : "fs-btn-secondary"}`} style={panel === "reject" ? { marginTop: 8, color: "var(--fs-problem)" } : { marginTop: 8 }} disabled={pending || note.trim().length < 3} onClick={() => run(() => reviewSubmission(s.id, panel === "changes" ? "revision_requested" : "rejected", note.trim()), () => { setPanel(null); setNote(""); })}>{pending ? "Sending" : panel === "changes" ? "Send" : "Reject"}</button>
                  </div>
                )}
                <ErrorLine error={error} />
              </>
            ) : (
              <>
                <p className="fs-t-label">Decided</p>
                <p className="fs-t-body" style={{ marginTop: 4 }}>{s.status === "paid" ? `Approved · ${formatMoney(campaign.pay_cents - fee)} to ${name}` : s.status === "approved" ? "Approved" : s.status === "rejected" ? "Rejected · nothing paid" : word.label}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
