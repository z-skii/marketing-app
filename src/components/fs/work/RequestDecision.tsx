"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { respondToInviteAction } from "@/app/(v2)/o/[id]/actions";

/**
 * A direct request from one business to this person: two answers. Nothing
 * is secured until Accept succeeds; declining tells the business.
 */
export function RequestDecision({ inviteId, businessName, kind }: { inviteId: string; businessName: string; kind: string }) {
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

  if (done === "declined") return <p className="fs-t-body" style={{ marginTop: 12 }}>Declined. {businessName} has been told.</p>;
  if (done === "accepted") {
    return <p className="fs-t-body" style={{ marginTop: 12 }}><span className="fs-status is-confirmed">Accepted</span> · {kind === "car_ads" ? "The booking is set up below." : "Do the work below when you are ready."}</p>;
  }
  return (
    <div style={{ marginTop: 16 }}>
      {error && <p role="alert" className="fs-field-error" style={{ marginBottom: 8 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="fs-btn fs-btn-primary" style={{ flex: 1 }} disabled={pending} onClick={() => answer("accepted")}>{pending ? "Sending" : "Accept request"}</button>
        <button type="button" className="fs-btn fs-btn-secondary" style={{ flex: 1 }} disabled={pending} onClick={() => answer("declined")}>Decline</button>
      </div>
    </div>
  );
}
