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
      className={`btn !min-h-0 !px-4 !py-2 !text-[0.6875rem] ${following ? "" : "btn-signal"}`}
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

  if (sent) return <p className="font-mono text-[0.625rem] text-rise">Reported — thanks.</p>;
  if (!open) {
    return (
      <button type="button" className="font-mono text-[0.625rem] text-ink-faint hover:text-signal" onClick={() => setOpen(true)}>
        Report
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <input
        className="field !min-h-0 !w-36 !px-2 !py-1 !text-[0.6875rem]" maxLength={120}
        value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What's wrong?"
        aria-label="Report reason"
      />
      <button
        type="button" disabled={!reason.trim()}
        className="btn !min-h-0 !px-2.5 !py-1 !text-[0.625rem]"
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
