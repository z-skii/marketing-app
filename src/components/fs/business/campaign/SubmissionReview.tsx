"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, User, ArrowSquareOut, DownloadSimple, Play, ArrowsOutSimple } from "@phosphor-icons/react";
import { reviewSubmission } from "@/app/(v2)/jobs/[id]/actions";
import type { SubmissionRow } from "@/lib/v2/campaigns";
import type { BusinessCampaign, CreatorProvenance } from "@/lib/fs/business-campaigns";
import { Avatar, formatMoney } from "@/components/fs/parts";
import { BackLink } from "@/components/fs/work/BackLink";
import { InspectButton } from "@/components/fs/SourceInspector";
import { Img } from "@/components/fs/Img";
import { Menu } from "@/ds/Menu";
import { SUBMISSION_WORD, fmtDay } from "./parts";
import { useAction, ErrorLine } from "./Controls";
import type { FundingFacts } from "@/components/fs/business/flows/FundingPlane";

/**
 * Reviewing one piece of work: the submitted file large on a stage, the
 * reference beside it; the creator, the campaign, the status, the money
 * and the three actions in a rail. Approve pays now. Revise and Reject
 * need a reason, so each opens a sheet after the choice.
 */
const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
const TONE: Record<string, string> = { confirmed: "success", waiting: "warning", problem: "alert", neutral: "" };

function whenWord(iso: string | undefined): string {
  if (!iso) return "Not recorded";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Not recorded";
  const hasTime = /T\d{2}:\d{2}/.test(iso);
  if (!hasTime) return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(d);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

export function SubmissionReview({ campaign, submission: s, provenance, funding, initialPanel = null }: { campaign: BusinessCampaign; submission: SubmissionRow; provenance: CreatorProvenance; funding: FundingFacts; initialPanel?: "changes" | "reject" | null }) {
  const story = campaign.kind === "instagram_story";
  const d = campaign.details;
  const word = SUBMISSION_WORD[s.status] ?? { label: s.status, tone: "neutral" as const };
  const reviewable = ["submitted", "under_review", "revision_requested"].includes(s.status);
  const [panel, setPanel] = useState<"changes" | "reject" | null>(reviewable ? initialPanel : null);
  const [note, setNote] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const { pending, error, run } = useAction();
  const fee = Math.floor((campaign.pay_cents * funding.feePct) / 100);
  const name = s.creator_name ?? s.creator_username;
  const primary = s.media_urls[0] ?? null;
  const reference = story ? d.creative_url ?? null : d.reference_media_url ?? null;
  const checklist = story
    ? [`Live ${d.live_hours ?? 24} hours`, ...(d.min_followers ? [`${d.min_followers.toLocaleString()}+ followers`] : []), "Creative as supplied"]
    : (d.guide?.checklist?.length ? d.guide.checklist : campaign.requirements);
  const spotsLeft = campaign.slots - campaign.approved;
  const covered = funding.walletCents >= campaign.pay_cents;
  const canApprove = reviewable && spotsLeft > 0 && covered;

  useEffect(() => {
    const el = dialog.current; if (!el) return;
    if (panel && !el.open) el.showModal();
    if (!panel && el.open) el.close();
  }, [panel]);

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-detail-top">
        <BackLink fallback={`/business/campaigns/${campaign.id}`} label="Campaign" />
        <span className={`badge${TONE[word.tone] ? ` is-${TONE[word.tone]}` : ""}`}>{word.label}</span>
      </div>

      <div className="dt-review">
        <div style={{ minWidth: 0 }}>
          <div className="dt-review-stage" aria-label={story ? "The submitted proof" : "The submitted video"}>
            {primary && !VIDEO.test(primary) && <div className="dt-hero-blur" aria-hidden style={{ backgroundImage: `url(${primary})` }} />}
            <div className="dt-hero-frame">
              {primary ? (
                VIDEO.test(primary)
                  ? <div><video src={primary} controls playsInline preload="metadata" aria-label={story ? "Submitted proof" : "Submitted video"} /></div>
                  : <div><Img src={primary} alt={story ? "Submitted screenshot" : "Submitted image"} loading="eager" /></div>
              ) : <div className="fs-video-fallback">Nothing attached</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {primary && !VIDEO.test(primary) && <InspectButton src={primary} alt={story ? "The submitted proof" : "The submitted image"} label="Zoom" className="btn btn-sm" icon={false}><ArrowsOutSimple size={16} aria-hidden /> Zoom</InspectButton>}
            {primary && <a href={primary} target="_blank" rel="noreferrer" className="btn btn-sm"><ArrowSquareOut size={16} aria-hidden /> Open original</a>}
            {s.media_urls.slice(1).map((u, i) => (
              <InspectButton key={u} src={u} alt={`Submitted file ${i + 2}`} label={`File ${i + 2}`} className="btn btn-sm" icon={false}>File {i + 2}</InspectButton>
            ))}
          </div>

          <div className="dt-section">
            <h2>{story ? "Supplied creative" : "Reference"}</h2>
            <div className="dt-ref">
              <span className="dt-ref-thumb">
                {reference ? (VIDEO.test(reference) ? <><video src={reference} muted playsInline preload="metadata" aria-label="Reference" /><span className="dt-play is-sm" aria-hidden><span><Play size={16} weight="fill" /></span></span></> : <Img src={reference} alt={story ? "The supplied creative" : "The reference"} loading="lazy" />)
                  : <span className="fs-video-fallback" style={{ fontSize: 12 }}>None</span>}
              </span>
              <div style={{ minWidth: 0, display: "grid", gap: 6, alignContent: "start" }}>
                <p className="t-body" style={{ fontWeight: 600 }}>{story ? "What they had to post" : "What they had to recreate"}</p>
                {reference && <InspectButton src={reference} alt={story ? "The supplied creative" : "The reference"} label={VIDEO.test(reference) ? "Play" : "Zoom"} className="btn btn-sm" icon={false}><Play size={16} weight="fill" aria-hidden /> {VIDEO.test(reference) ? "Play" : "Zoom"}</InspectButton>}
                {!reference && campaign.reference_url && <a href={campaign.reference_url} className="btn btn-sm" target="_blank" rel="noreferrer">Open the linked Reel <ArrowSquareOut size={16} aria-hidden /></a>}
              </div>
            </div>
            {checklist.length > 0 && (
              <ul className="dt-checks" style={{ marginTop: 12 }}>
                {checklist.map((c) => <li key={c}><div className="dt-check"><CheckCircle size={20} weight="fill" aria-hidden /><span>{c}</span></div></li>)}
              </ul>
            )}
          </div>
        </div>

        <aside className="dt-rail">
          <section className="dt-action" aria-label="Decision">
            <div className="dt-person">
              <Avatar src={s.creator_avatar} name={name} size={48} />
              <span style={{ minWidth: 0 }}>
                <b className="truncate">{name}</b>
                <span className="truncate">@{s.creator_username} · {[provenance.verified ? "Verified" : null, provenance.instagram_status === "connected" && provenance.instagram_followers != null ? `${provenance.instagram_followers.toLocaleString()} followers` : null, provenance.completed_jobs > 0 ? `${provenance.completed_jobs} completed` : null].filter(Boolean).join(" · ") || "New"}</span>
              </span>
            </div>
            <p className="t-meta" style={{ marginTop: 10 }}><Link href={`/business/campaigns/${campaign.id}`} className="link-accent">{campaign.title}</Link> · {story ? "Proof" : "Video"} sent {fmtDay(s.created_at)}</p>
            {s.note && <p className="t-body" style={{ marginTop: 10, padding: "10px 12px", borderRadius: 12, background: "var(--tm-surface2)" }}>“{s.note}”</p>}
            {s.review_note && <p className="t-meta" style={{ marginTop: 8 }}>Your note: {s.review_note}</p>}

            <dl className="dt-kv">
              <dt>Pays</dt><dd><b>{formatMoney(campaign.pay_cents)}</b> on approval</dd>
              <dt>To {name.split(" ")[0]}</dt><dd>{formatMoney(campaign.pay_cents - fee)}{funding.feePct > 0 ? ` after the ${funding.feePct}% fee` : ""}</dd>
              <dt>Credit</dt><dd style={{ color: covered ? undefined : "var(--tm-alert)" }}>{formatMoney(funding.walletCents)}{covered ? "" : " · not enough"}</dd>
              {story && <><dt>Story link</dt><dd>{s.meta?.story_url ? <a href={s.meta.story_url} className="link-accent" target="_blank" rel="noreferrer">Open</a> : "Not recorded"}</dd><dt>Posted</dt><dd>{whenWord(s.meta?.posted_at)}</dd></>}
              {spotsLeft <= 0 && <><dt>Spots</dt><dd>All approved</dd></>}
            </dl>

            {reviewable ? (
              <>
                <div className="ap-actions" style={{ marginTop: 14 }}>
                  <button type="button" className="btn btn-signal btn-md" style={{ flex: "1 1 auto" }} disabled={pending || !canApprove} onClick={() => run(() => reviewSubmission(s.id, "approved", ""))}><CheckCircle size={20} weight="fill" aria-hidden />{pending ? "Working" : "Approve"}</button>
                  <button type="button" className="btn btn-md" style={{ minHeight: 40 }} disabled={pending} onClick={() => setPanel("changes")}>Revise</button>
                  <Menu label="More" items={[
                    { label: "View profile", href: `/business/people/${s.creator_username}`, icon: <User size={20} aria-hidden /> },
                    ...(primary ? [{ label: "Open original", href: primary, external: true, icon: <ArrowSquareOut size={20} aria-hidden /> }, { label: "Download", href: primary, external: true, icon: <DownloadSimple size={20} aria-hidden /> }] : []),
                    { label: "Reject", onClick: () => setPanel("reject"), icon: <XCircle size={20} aria-hidden />, danger: true },
                  ]} />
                </div>
                {!covered && <p className="dt-action-note">Not enough credit for this payment. <Link href="/business/billing" className="link-accent">Add credit</Link></p>}
                {story && <p className="dt-action-note">Not checked on Instagram by TapMart. Your approval is the check.</p>}
                <ErrorLine error={error} />
              </>
            ) : (
              <p className="t-body" style={{ marginTop: 14, fontWeight: 600 }}>{s.status === "paid" ? `Approved · ${formatMoney(campaign.pay_cents - fee)} to ${name}` : s.status === "approved" ? "Approved" : s.status === "rejected" ? "Rejected · nothing paid" : word.label}</p>
            )}
          </section>
        </aside>
      </div>

      <dialog ref={dialog} className="dt-sheet" aria-labelledby="dt-review-sheet-h" onClose={() => setPanel(null)} onClick={(e) => { if (e.target === dialog.current) setPanel(null); }}>
        <div className="dt-sheet-body">
          <h2 id="dt-review-sheet-h">{panel === "reject" ? "Reject this work" : "Ask for changes"}</h2>
          <p className="t-meta" style={{ marginTop: 4 }}>{panel === "reject" ? `${name} sees this note. Nothing is paid.` : `${name} sees this note and can submit again. The original stays.`}</p>
          <label htmlFor="dt-review-note" className="fs-field-label" style={{ marginTop: 16 }}>{panel === "reject" ? "Why" : "What should change"}</label>
          <textarea id="dt-review-note" className="fs-textarea" rows={4} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={panel === "reject" ? "Tell them plainly." : "Keep the cup in frame the whole time."} />
          <ErrorLine error={error} />
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button type="button" className={`btn ${panel === "reject" ? "btn-dark" : "btn-signal"} btn-md`} style={{ flex: 1 }} disabled={pending || note.trim().length < 3} onClick={() => run(() => reviewSubmission(s.id, panel === "reject" ? "rejected" : "revision_requested", note.trim()), () => { setPanel(null); setNote(""); })}>{pending ? "Sending" : panel === "reject" ? "Reject" : "Send"}</button>
            <button type="button" className="btn btn-md" style={{ flex: 1 }} onClick={() => setPanel(null)}>Cancel</button>
          </div>
        </div>
      </dialog>
    </main>
  );
}
