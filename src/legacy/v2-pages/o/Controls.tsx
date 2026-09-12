"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/v2/Uploader";
import { applyWithVehicle, participateInStory, submitStoryProof } from "@/app/(v2)/o/actions";
import { addProof } from "@/app/(v2)/cars/actions";
import { withdrawCarApplication } from "@/app/(v2)/o/[id]/actions";

/** The interactive pieces of the opportunity screen: one button or form per state. */

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

// ------------------------------------------------------------------- Story

export function ParticipateButton({ campaignId }: { campaignId: string }) {
  const { pending, error, run } = useAction();
  return (
    <div id="participate">
      <button
        type="button" disabled={pending} className="btn btn-signal btn-lg w-full"
        onClick={() => run(() => participateInStory(campaignId))}
      >
        {pending ? "One moment" : "Participate"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
    </div>
  );
}

export function StoryProofForm({ campaignId }: { campaignId: string }) {
  const [shots, setShots] = useState<string[]>([]);
  const [storyUrl, setStoryUrl] = useState("");
  const { pending, error, run } = useAction();
  return (
    <div id="proof" className="mt-3">
      <Uploader folder="proofs" accept="image/*" multiple label={shots.length ? `Screenshot added ${shots.length > 1 ? `(${shots.length})` : "✓"}` : "Add a screenshot"} onUploaded={(u) => setShots([...shots, ...u].slice(0, 4))} />
      {shots.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {shots.map((u, i) => (
            <li key={u} className="relative overflow-hidden rounded-[10px] bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`Screenshot ${i + 1}`} className="h-20 w-14 object-cover" />
              <button type="button" aria-label={`Remove screenshot ${i + 1}`} className="glass-tag absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs text-ink" onClick={() => setShots(shots.filter((x) => x !== u))}>✕</button>
            </li>
          ))}
        </ul>
      )}
      <label className="mt-3 block">
        <span className="text-sm text-ink-soft">Link to your story</span>
        <input
          className="field mt-1.5" inputMode="url" value={storyUrl} maxLength={500}
          onChange={(e) => setStoryUrl(e.target.value)} placeholder="https://instagram.com/stories/..."
        />
      </label>
      {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
      <button
        type="button" disabled={pending || shots.length === 0 || !storyUrl.trim()}
        className="btn btn-signal btn-lg mt-3 w-full"
        onClick={() => run(() => submitStoryProof(campaignId, { screenshotUrls: shots, storyUrl }))}
      >
        {pending ? "Sending" : "Send proof"}
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ Car ad

export function ApplyVehicleButton({ campaignId, vehicleId, first }: { campaignId: string; vehicleId: string; first?: boolean }) {
  const { pending, error, run } = useAction();
  return (
    <div id={first ? "apply" : undefined} className="mt-3">
      <button
        type="button" disabled={pending} className="btn btn-signal w-full md:w-auto"
        onClick={() => run(() => applyWithVehicle(campaignId, vehicleId))}
      >
        {pending ? "Applying" : "Apply with this vehicle"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
    </div>
  );
}

export function WithdrawCarButton({ campaignId }: { campaignId: string }) {
  const { pending, error, run } = useAction();
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        type="button" disabled={pending} className="btn btn-ghost btn-sm"
        onClick={() => run(() => withdrawCarApplication(campaignId))}
      >
        Withdraw
      </button>
      {error && <span role="alert" className="text-sm alert-text">{error}</span>}
    </span>
  );
}

/** Driver: a photo of the car with the decal on it (the booking's proof flow). */
export function BookingProofForm({ bookingId }: { bookingId: string }) {
  const [url, setUrl] = useState("");
  const [sent, setSent] = useState(false);
  const { pending, error, run } = useAction();
  if (sent) return <p className="mt-3 text-sm text-rise">Photo sent. The business sees it right away.</p>;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Uploader folder="proofs" accept="image/*" label={url ? "Photo added ✓" : "Add the photo"} onUploaded={(u) => setUrl(u[0])} />
      <button
        type="button" disabled={pending || !url} className="btn btn-signal btn-sm"
        onClick={() => run(async () => {
          const r = await addProof(bookingId, { kind: "periodic", mediaUrl: url });
          if (r.ok) setSent(true);
          return r;
        })}
      >
        {pending ? "Sending" : "Send photo"}
      </button>
      {error && <p role="alert" className="w-full text-sm alert-text">{error}</p>}
    </div>
  );
}
