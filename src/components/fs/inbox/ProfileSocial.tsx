"use client";

import { useState, useTransition } from "react";
import { reportTarget, toggleFollow } from "@/app/(v2)/actions";

/** Follow is quiet and reversible; the label is the state. */
export function FollowButton({ profileId, initialFollowing }: { profileId: string; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [, start] = useTransition();
  return (
    <button type="button" aria-pressed={following} className={`fs-btn ${following ? "fs-btn-secondary" : "fs-btn-primary"}`}
      onClick={() => { setFollowing(!following); start(async () => { const r = await toggleFollow(profileId); if (r.ok && r.following !== undefined) setFollowing(r.following); }); }}>
      {following ? "Following" : "Follow"}
    </button>
  );
}

/** Report opens one short field; nothing is sent without a reason. */
export function ReportMenu({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState("");
  const [, start] = useTransition();
  if (sent) return <p className="fs-status is-confirmed">Reported. Thanks.</p>;
  if (!open) return <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" onClick={() => setOpen(true)}>Report</button>;
  return (
    <form style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: "1 1 240px" }} onSubmit={(e) => { e.preventDefault(); if (!reason.trim()) return; start(async () => { const r = await reportTarget(targetType, targetId, reason); if (r.ok) setSent(true); }); }}>
      <input className="fs-input" style={{ flex: "1 1 160px" }} maxLength={120} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What is wrong?" aria-label="Report reason" />
      <button type="submit" disabled={!reason.trim()} className="fs-btn fs-btn-secondary">Send report</button>
    </form>
  );
}
