"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeCampaign, decideApplication } from "@/app/(v2)/jobs/[id]/actions";
import { decideCarApplication } from "@/app/(v2)/o/actions";
import { publishDraft, withdrawInvite } from "@/app/(v2)/business/campaigns/[id]/actions";
import { formatMoney } from "@/components/fs/parts";

/**
 * The small decisions on a campaign. Each calls the existing server
 * action and refreshes; money only ever moves inside those actions.
 */
type Result = { ok: boolean; error?: string };

export function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<Result>, after?: () => void) => start(async () => {
    setError(null);
    const r = await fn();
    if (!r.ok) setError(r.error ?? "Something went wrong.");
    else { after?.(); router.refresh(); }
  });
  return { pending, error, run };
}

export function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null;
  return <p role="alert" className="fs-field-error" style={{ marginTop: 8 }}>{error}</p>;
}

export function PublishDraft({ campaignId, payCents, walletCents }: { campaignId: string; payCents: number; walletCents: number }) {
  const { pending, error, run } = useAction();
  const covered = walletCents >= payCents;
  return (
    <span style={{ display: "grid", gap: 4 }}>
      <button type="button" className="fs-btn fs-btn-primary" disabled={pending || !covered} onClick={() => run(() => publishDraft(campaignId))}>{pending ? "Publishing" : "Publish campaign"}</button>
      <span className="fs-t-meta">{covered ? `Needs ${formatMoney(payCents)} of credit for one payment. Covered.` : `Needs ${formatMoney(payCents)} of credit for one payment. You have ${formatMoney(walletCents)}. Add credit first.`}</span>
      <ErrorLine error={error} />
    </span>
  );
}

export function CloseCampaign({ campaignId }: { campaignId: string }) {
  const { pending, error, run } = useAction();
  const [confirm, setConfirm] = useState(false);
  if (!confirm) return <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" onClick={() => setConfirm(true)}>Close campaign</button>;
  return (
    <span style={{ display: "grid", gap: 4 }}>
      <span className="fs-t-meta">Closing stops new work. Nothing is refunded because nothing was held.</span>
      <span style={{ display: "flex", gap: 8 }}>
        <button type="button" className="fs-btn fs-btn-secondary" disabled={pending} onClick={() => run(() => closeCampaign(campaignId))}>{pending ? "Closing" : "Yes, close it"}</button>
        <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" onClick={() => setConfirm(false)}>Keep it open</button>
      </span>
      <ErrorLine error={error} />
    </span>
  );
}

export function WithdrawRequest({ inviteId, campaignId }: { inviteId: string; campaignId: string }) {
  const { pending, error, run } = useAction();
  return (
    <span>
      <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" disabled={pending} onClick={() => run(() => withdrawInvite(inviteId, campaignId))}>{pending ? "Withdrawing" : "Withdraw request"}</button>
      <ErrorLine error={error} />
    </span>
  );
}

/** Accept or decline a person's application. Accepting lets them submit; it pays nothing. */
export function ApplicantDecision({ applicationId, car }: { applicationId: string; car: boolean }) {
  const { pending, error, run } = useAction();
  const decide = (d: "accepted" | "declined") => run(() => (car ? decideCarApplication(applicationId, d) : decideApplication(applicationId, d)));
  return (
    <span>
      <span style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <button type="button" className="fs-btn fs-btn-primary" disabled={pending} onClick={() => decide("accepted")}>Accept</button>
        <button type="button" className="fs-btn fs-btn-secondary" disabled={pending} onClick={() => decide("declined")}>Decline</button>
      </span>
      <ErrorLine error={error} />
    </span>
  );
}

/** Accept or decline a driver. Accepting books the car; the first payment happens at installation. */
export function DriverDecision({ applicationId }: { applicationId: string }) {
  return <ApplicantDecision applicationId={applicationId} car />;
}
