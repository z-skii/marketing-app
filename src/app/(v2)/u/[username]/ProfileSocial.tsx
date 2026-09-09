"use client";

import { useState, useTransition } from "react";
import { reportTarget, toggleFollow } from "../../actions";

export function FollowButton({
  profileId, initialFollowing,
}: { profileId: string; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={following}
      className={`btn ${following ? "" : "btn-signal"}`}
      onClick={() => {
        setFollowing(!following);
        start(async () => {
          const result = await toggleFollow(profileId);
          if (result.ok && result.following !== undefined) setFollowing(result.following);
        });
      }}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}

export function ReportMenu({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [reason, setReason] = useState("");
  const [, start] = useTransition();

  if (sent) return <p className="text-sm text-rise">Reported. Thanks.</p>;
  if (!open) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)}>
        Report
      </button>
    );
  }
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <input
        className="field min-w-0 flex-1" maxLength={120}
        value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What's wrong?"
        aria-label="Report reason"
      />
      <button
        type="button" disabled={!reason.trim()}
        className="btn shrink-0"
        onClick={() => start(async () => {
          const result = await reportTarget(targetType, targetId, reason);
          if (result.ok) setSent(true);
        })}
      >
        Send
      </button>
    </div>
  );
}
