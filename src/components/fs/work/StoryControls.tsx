"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "@phosphor-icons/react";
import { participateInStory, submitStoryProof } from "@/app/(v2)/o/actions";
import { FsUploader } from "./Uploader";

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

/** Take a spot: an accepted application. Nothing is posted or paid by this. */
export function ParticipateButton({ campaignId }: { campaignId: string }) {
  const { pending, error, run } = useAction();
  return (
    <div id="participate">
      <button type="button" disabled={pending} className="fs-btn fs-btn-primary" style={{ width: "100%" }} onClick={() => run(() => participateInStory(campaignId))}>
        {pending ? "One moment" : "Take a spot"}
      </button>
      {error && <p role="alert" className="fs-field-error">{error}</p>}
    </div>
  );
}

/** Proof the story went up: screenshots and the story link. */
export function StoryProofForm({ campaignId, label = "Send proof" }: { campaignId: string; label?: string }) {
  const [shots, setShots] = useState<string[]>([]);
  const [storyUrl, setStoryUrl] = useState("");
  const { pending, error, run } = useAction();
  return (
    <div id="proof" style={{ marginTop: 12 }}>
      <FsUploader folder="proofs" accept="image/*" multiple label={shots.length ? "Add another screenshot" : "Add a screenshot"} onUploaded={(u) => setShots([...shots, ...u].slice(0, 4))} />
      {shots.length > 0 && (
        <ul className="fs-plain-list" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {shots.map((u, i) => (
            <li key={u} style={{ position: "relative" }}>
              <span className="fs-media fs-contain fs-thumb" style={{ display: "block", width: 72, height: 96 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`Screenshot ${i + 1}`} />
              </span>
              <button type="button" aria-label={`Remove screenshot ${i + 1}`} className="fs-icon-btn" style={{ position: "absolute", top: -6, right: -6, width: 32, height: 32, background: "#101820", color: "#F6F8FB" }} onClick={() => setShots(shots.filter((x) => x !== u))}><X size={16} /></button>
            </li>
          ))}
        </ul>
      )}
      <label className="fs-field-label" htmlFor="fs-story-url" style={{ marginTop: 12 }}>Link to your story</label>
      <input id="fs-story-url" className="fs-input" inputMode="url" value={storyUrl} maxLength={500} onChange={(e) => setStoryUrl(e.target.value)} placeholder="https://instagram.com/stories/..." />
      {error && <p role="alert" className="fs-field-error">{error}</p>}
      <button type="button" disabled={pending || shots.length === 0 || !storyUrl.trim()} className="fs-btn fs-btn-primary" style={{ width: "100%", marginTop: 12 }} onClick={() => run(() => submitStoryProof(campaignId, { screenshotUrls: shots, storyUrl }))}>
        {pending ? "Sending" : label}
      </button>
    </div>
  );
}
