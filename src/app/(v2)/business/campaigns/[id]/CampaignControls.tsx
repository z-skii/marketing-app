"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/v2/Uploader";
import { closeCampaign, reviewSubmission } from "@/app/(v2)/jobs/[id]/actions";
import { decideCarApplication } from "@/app/(v2)/o/actions";
import { advanceBooking, payBookingMonth } from "@/app/(v2)/cars/actions";
import { publishDraft } from "./actions";

/**
 * The buttons on a campaign's management screen. Every one calls an
 * existing server action and refreshes; money moves only inside those
 * actions, through the ledger. A credit shortfall points at billing.
 */

type Result = { ok: boolean; error?: string };

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<Result>) =>
    start(async () => {
      setError(null);
      const result = await fn();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      else router.refresh();
    });
  return { pending, error, run };
}

function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null;
  const credit = /credit/i.test(error);
  return (
    <p role="alert" className="mt-2 text-sm alert-text">
      {error}
      {credit && <> <Link href="/business/billing" className="font-display font-700 underline underline-offset-2">Add credit</Link></>}
    </p>
  );
}

export function PublishDraftButton({ campaignId }: { campaignId: string }) {
  const { pending, error, run } = useAction();
  return (
    <div>
      <button type="button" disabled={pending} className="btn btn-signal" onClick={() => run(() => publishDraft(campaignId))}>
        {pending ? "Publishing…" : "Publish"}
      </button>
      <ErrorLine error={error} />
    </div>
  );
}

export function CloseCampaignButton({ campaignId }: { campaignId: string }) {
  const [confirm, setConfirm] = useState(false);
  const { pending, error, run } = useAction();
  if (!confirm) {
    return (
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(true)}>Close campaign</button>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-ink-soft">Close it? Nobody new can take part.</span>
      <button type="button" disabled={pending} className="btn btn-sm" onClick={() => run(() => closeCampaign(campaignId))}>
        {pending ? "Closing…" : "Yes, close"}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>Keep it open</button>
      {error && <span role="alert" className="text-sm alert-text">{error}</span>}
    </span>
  );
}

/** Story proofs use the same review action with story words. */
export function StoryReviewControls({ submissionId }: { submissionId: string }) {
  const [note, setNote] = useState("");
  const { pending, error, run } = useAction();
  return (
    <div className="mt-3">
      <input
        className="field w-full" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="Note to the person (needed to ask again or reject)" aria-label="Review note"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={pending} className="btn btn-signal btn-sm" onClick={() => run(() => reviewSubmission(submissionId, "approved", note))}>
          Approve and pay
        </button>
        <button type="button" disabled={pending} className="btn btn-sm" onClick={() => run(() => reviewSubmission(submissionId, "revision_requested", note))}>
          Ask again
        </button>
        <button type="button" disabled={pending} className="btn btn-ghost btn-sm" onClick={() => run(() => reviewSubmission(submissionId, "rejected", note))}>
          Reject
        </button>
      </div>
      <ErrorLine error={error} />
    </div>
  );
}

export function DecideDriver({ applicationId }: { applicationId: string }) {
  const { pending, error, run } = useAction();
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} className="btn btn-signal btn-sm" onClick={() => run(() => decideCarApplication(applicationId, "accepted"))}>
          Accept
        </button>
        <button type="button" disabled={pending} className="btn btn-ghost btn-sm" onClick={() => run(() => decideCarApplication(applicationId, "declined"))}>
          Decline
        </button>
      </div>
      <ErrorLine error={error} />
    </div>
  );
}

/**
 * The business's next step for one booked car. Artwork goes up first, then
 * installation (which pays the first month), then monthly payments until
 * the campaign is marked complete.
 */
export function BookingSteps({
  bookingId, status, campaignArtworkUrl,
}: { bookingId: string; status: string; campaignArtworkUrl: string | null }) {
  const [artwork, setArtwork] = useState("");
  const [paid, setPaid] = useState(false);
  const { pending, error, run } = useAction();

  if (status === "creative_pending") {
    return (
      <div className="mt-3">
        <p className="text-sm text-ink-soft">Send the artwork so printing can start.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Uploader id={`artwork-${bookingId}`} folder="campaigns" accept="image/*" label={artwork ? "Replace artwork" : "Upload artwork"} onUploaded={(u) => setArtwork(u[0])} />
          {campaignArtworkUrl && !artwork && (
            <button type="button" className="btn btn-sm" onClick={() => setArtwork(campaignArtworkUrl)}>Use campaign artwork</button>
          )}
        </div>
        {artwork && (
          <div className="mt-3 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={artwork} alt="Artwork" className="h-12 w-24 rounded-[6px] object-cover" />
            <button type="button" disabled={pending} className="btn btn-signal btn-sm" onClick={() => run(() => advanceBooking(bookingId, artwork))}>
              {pending ? "Sending…" : "Send artwork"}
            </button>
          </div>
        )}
        <ErrorLine error={error} />
      </div>
    );
  }
  if (status === "installation_pending") {
    return (
      <div className="mt-3">
        <p className="text-sm text-ink-soft">Arrange the installation with the driver. Once it is on the car, mark it and the first month is paid from your credit.</p>
        <button type="button" disabled={pending} className="btn btn-signal btn-sm mt-2" onClick={() => run(() => advanceBooking(bookingId))}>
          {pending ? "Paying…" : "Mark installed and pay first month"}
        </button>
        <ErrorLine error={error} />
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button" disabled={pending} className="btn btn-signal btn-sm"
            onClick={() => run(async () => { const r = await payBookingMonth(bookingId); if (r.ok) setPaid(true); return r; })}
          >
            {pending ? "Paying…" : "Pay this month"}
          </button>
          {paid && <span className="text-sm text-rise">Paid. It is in the driver&apos;s earnings.</span>}
          <button type="button" disabled={pending} className="btn btn-ghost btn-sm" onClick={() => run(() => advanceBooking(bookingId))}>
            Mark completed
          </button>
        </div>
        <ErrorLine error={error} />
      </div>
    );
  }
  return null;
}
