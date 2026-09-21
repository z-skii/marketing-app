"use client";

import Link from "next/link";
import { CheckCircle, User, ArrowSquareOut, DownloadSimple, XCircle, Eye } from "@phosphor-icons/react";
import { reviewSubmission } from "@/app/(v2)/jobs/[id]/actions";
import type { SubmissionRow } from "@/lib/v2/campaigns";
import { Avatar, formatMoney } from "@/components/fs/parts";
import { Menu } from "@/ds/Menu";
import { useAction, ErrorLine } from "./Controls";
import { SUBMISSION_WORD, fmtDay } from "./parts";

/**
 * One submission on the campaign page: the file first, the creator, when
 * it arrived, then the decision. Approve pays now through the existing
 * action; Revise and Reject need a note, so they open the review screen
 * with that panel ready. Decided work shows its status only.
 */
const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
const TONE: Record<string, string> = { confirmed: "success", waiting: "warning", problem: "alert", neutral: "" };

export function SubmissionCard({ s, campaignId, payCents, canApprove, story }: { s: SubmissionRow; campaignId: string; payCents: number; canApprove: boolean; story: boolean }) {
  const { pending, error, run } = useAction();
  const media = s.media_urls[0] ?? null;
  const name = s.creator_name ?? s.creator_username;
  const word = SUBMISSION_WORD[s.status] ?? { label: s.status, tone: "neutral" as const };
  const open = ["submitted", "under_review"].includes(s.status);
  const href = `/business/campaigns/${campaignId}/submissions/${s.id}`;
  const tone = TONE[word.tone];
  return (
    <li className="dt-sub">
      <Link href={href} className="dt-sub-media" aria-label={`Open ${name}'s ${story ? "proof" : "video"}`}>
        {media ? (VIDEO.test(media) ? <video src={media} muted playsInline preload="metadata" aria-hidden /> : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media} alt="" loading="lazy" />
        )) : <span className="fs-video-fallback" style={{ fontSize: 12 }}>No file</span>}
        {media && VIDEO.test(media) && <span className="dt-play is-sm" aria-hidden><span>▶</span></span>}
        <span className={`badge is-glass${open ? "" : tone ? ` is-${tone}` : ""}`}>{open ? (story ? "Proof" : "Submitted") : word.label}</span>
      </Link>
      <div className="dt-sub-body">
        <div className="dt-sub-who">
          <Avatar src={s.creator_avatar} name={name} size={32} />
          <span style={{ minWidth: 0 }}><b>{name}</b><span>@{s.creator_username} · {fmtDay(s.created_at)}</span></span>
        </div>
        {open ? (
          <>
            <div className="dt-sub-actions">
              <button type="button" className="btn btn-signal btn-sm" disabled={pending || !canApprove} onClick={() => run(() => reviewSubmission(s.id, "approved", ""))} title={canApprove ? undefined : "Not enough credit or no spot left"}><CheckCircle size={16} weight="fill" aria-hidden />{pending ? "Working" : "Approve"}</button>
              <Link href={`${href}?panel=changes`} className="btn btn-sm">Revise</Link>
              <Menu size="sm" label="More" items={[
                { label: "Open review", href, icon: <Eye size={20} aria-hidden /> },
                { label: "View profile", href: `/business/people/${s.creator_username}`, icon: <User size={20} aria-hidden /> },
                ...(media ? [{ label: "Open original", href: media, external: true, icon: <ArrowSquareOut size={20} aria-hidden /> }, { label: "Download", href: media, external: true, icon: <DownloadSimple size={20} aria-hidden /> }] : []),
                { label: "Reject", href: `${href}?panel=reject`, icon: <XCircle size={20} aria-hidden />, danger: true },
              ]} />
            </div>
            <ErrorLine error={error} />
          </>
        ) : (
          <div className="dt-sub-actions" style={{ justifyContent: "space-between" }}>
            <span className="t-meta">{s.status === "paid" ? `${formatMoney(payCents)} paid` : word.label}</span>
            <Link href={href} className="btn btn-sm">Open</Link>
          </div>
        )}
      </div>
    </li>
  );
}
