"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";
import { respondToInviteAction } from "./actions";

/**
 * A direct request from one business to this person. Two answers. After
 * accepting, the normal flow below the banner takes over (upload the Reel,
 * post the Story, or the car booking that was just created).
 */
export function InviteBanner({ inviteId, businessName, verb, pay, message, kind }: {
  inviteId: string; businessName: string; verb: string; pay: string; message: string | null; kind: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);

  const answer = (a: "accepted" | "declined") => start(async () => {
    setError(null);
    const r = await respondToInviteAction(inviteId, a);
    if (!r.ok) { setError(r.error ?? "Could not send your answer."); return; }
    setDone(a);
    router.refresh();
  });

  if (done === "declined") {
    return <p className="pop rounded-[var(--radius-card)] bg-surface p-4 text-sm text-ink-soft">Declined. {businessName} has been told.</p>;
  }
  if (done === "accepted") {
    return (
      <p className="pop flex items-center gap-2 rounded-[var(--radius-card)] bg-surface p-4 text-sm">
        <CheckCircle size={20} weight="fill" className="text-signal" aria-hidden />
        Accepted. {kind === "car_ads" ? "The booking is set up below." : "Do the work below when you are ready."}
      </p>
    );
  }
  return (
    <section aria-label="Direct request" className="reveal rounded-[var(--radius-card)] bg-surface p-4 ring-1 ring-signal/40">
      <p className="text-sm font-500 text-signal">Request for you</p>
      <p className="mt-1.5 font-display text-[1.25rem] leading-[1.15] font-700 tracking-[-0.02em]">{businessName} {verb}</p>
      <p className="mt-1 font-display text-[1.5rem] leading-none font-700 tracking-[-0.02em] text-signal">{pay}</p>
      {message && <p className="mt-2 text-sm text-ink-soft">{message}</p>}
      {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="button" className="btn btn-signal flex-1" disabled={pending} onClick={() => answer("accepted")}>{pending ? "Sending" : "Accept"}</button>
        <button type="button" className="btn flex-1" disabled={pending} onClick={() => answer("declined")}>Decline</button>
      </div>
    </section>
  );
}
