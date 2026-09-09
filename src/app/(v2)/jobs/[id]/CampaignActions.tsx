"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/v2/Uploader";
import { leaveReview } from "../../actions";
import {
  applyToCampaign, decideApplication, reviewSubmission, submitWork, withdrawApplication,
} from "./actions";

/** Client-side interactive pieces of a campaign page. */

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

export function ApplyForm({ campaignId }: { campaignId: string }) {
  const [message, setMessage] = useState("");
  const { pending, error, run } = useAction();
  return (
    <div id="apply" className="card mt-3 p-4">
      <label className="block text-sm text-ink-soft" htmlFor="apply-message">Why you, in a few lines</label>
      <textarea
        id="apply-message"
        className="field mt-2 min-h-24 w-full" maxLength={1000} value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="A short pitch and links to relevant work"
      />
      {error && <p role="alert" className="mt-2 text-sm text-signal">{error}</p>}
      <button
        type="button" disabled={pending} className="btn btn-signal btn-lg mt-3 w-full"
        onClick={() => run(() => applyToCampaign(campaignId, message))}
      >
        {pending ? "Sending…" : "Send application"}
      </button>
    </div>
  );
}

export function WithdrawButton({ campaignId }: { campaignId: string }) {
  const { pending, run } = useAction();
  return (
    <button
      type="button" disabled={pending} className="btn btn-ghost btn-sm"
      onClick={() => run(() => withdrawApplication(campaignId))}
    >
      Withdraw
    </button>
  );
}

export function SubmitForm({ campaignId, rightsNote }: { campaignId: string; rightsNote: string }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [ack, setAck] = useState(false);
  const { pending, error, run } = useAction();

  return (
    <div id="submit" className="card mt-3 p-4">
      <p className="font-display text-lg font-800 tracking-[-0.02em]">Submit your work</p>
      <div className="mt-3">
        <Uploader folder="submissions" multiple label="Upload photos or video" onUploaded={(u) => setUrls([...urls, ...u])} />
        {urls.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {urls.map((u, i) => (
              <li key={i} className="card-2 flex items-center gap-2 px-3 py-1.5 text-sm">
                File {i + 1}
                <button type="button" aria-label={`Remove file ${i + 1}`} className="text-ink-faint hover:text-ink" onClick={() => setUrls(urls.filter((x) => x !== u))}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <textarea
        className="field mt-3 min-h-20 w-full" maxLength={2000} value={note}
        onChange={(e) => setNote(e.target.value)} placeholder="Notes for the business (optional)"
        aria-label="Submission notes"
      />
      <label className="mt-3 flex items-start gap-2.5 text-sm">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1 h-4 w-4 accent-signal" />
        <span className="text-ink-soft">{rightsNote}</span>
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-signal">{error}</p>}
      <button
        type="button" disabled={pending || urls.length === 0 || !ack}
        className="btn btn-signal btn-lg mt-3 w-full"
        onClick={() => run(() => submitWork(campaignId, { mediaUrls: urls, note, rightsAck: ack }))}
      >
        {pending ? "Submitting…" : "Submit"}
      </button>
    </div>
  );
}

export function ReviewControls({ submissionId }: { submissionId: string }) {
  const [note, setNote] = useState("");
  const { pending, error, run } = useAction();
  return (
    <div className="mt-3">
      <input
        className="field w-full" maxLength={1000} value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note to the creator (needed to ask for changes or reject)"
        aria-label="Review note"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button" disabled={pending} className="btn btn-signal btn-sm"
          onClick={() => run(() => reviewSubmission(submissionId, "approved", note))}
        >
          Approve and pay
        </button>
        <button
          type="button" disabled={pending} className="btn btn-sm"
          onClick={() => run(() => reviewSubmission(submissionId, "revision_requested", note))}
        >
          Ask for changes
        </button>
        <button
          type="button" disabled={pending} className="btn btn-ghost btn-sm"
          onClick={() => run(() => reviewSubmission(submissionId, "rejected", note))}
        >
          Reject
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-signal">{error}</p>}
    </div>
  );
}

export function DecideApplication({ applicationId }: { applicationId: string }) {
  const { pending, error, run } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button" disabled={pending} className="btn btn-signal btn-sm"
        onClick={() => run(() => decideApplication(applicationId, "accepted"))}
      >
        Accept
      </button>
      <button
        type="button" disabled={pending} className="btn btn-ghost btn-sm"
        onClick={() => run(() => decideApplication(applicationId, "declined"))}
      >
        Decline
      </button>
      {error && <p role="alert" className="text-sm text-signal">{error}</p>}
    </div>
  );
}

export function ReviewStars({
  contextType, contextId,
}: { contextType: "submission" | "booking"; contextId: string }) {
  const [rating, setRating] = useState(0);
  const [done, setDone] = useState(false);
  const { pending, error, run } = useAction();
  if (done) return <p className="text-sm text-rise">Thanks, review saved.</p>;
  return (
    <div className="flex items-center gap-2">
      <span role="radiogroup" aria-label="Rating" className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className={`px-0.5 text-xl ${n <= rating ? "text-signal" : "text-rule-strong"}`}
          >
            ★
          </button>
        ))}
      </span>
      <button
        type="button" disabled={pending || rating === 0} className="btn btn-sm"
        onClick={() =>
          run(async () => {
            const r = await leaveReview({ contextType, contextId, rating });
            if (r.ok) setDone(true);
            return r;
          })}
      >
        Rate
      </button>
      {error && <p role="alert" className="text-sm text-signal">{error}</p>}
    </div>
  );
}
