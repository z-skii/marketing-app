"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyWithVehicle } from "@/app/(v2)/o/actions";
import { withdrawCarApplication } from "@/app/(v2)/o/[id]/actions";
import { addProof } from "@/app/(v2)/cars/actions";
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

/** Apply with one specific car. An application is not a booking. */
export function ApplyVehicleButton({ campaignId, vehicleId, first }: { campaignId: string; vehicleId: string; first?: boolean }) {
  const { pending, error, run } = useAction();
  return (
    <div id={first ? "apply" : undefined} style={{ marginTop: 8 }}>
      <button type="button" disabled={pending} className="fs-btn fs-btn-primary" onClick={() => run(() => applyWithVehicle(campaignId, vehicleId))}>
        {pending ? "Applying" : "Apply with this vehicle"}
      </button>
      {error && <p role="alert" className="fs-field-error">{error}</p>}
    </div>
  );
}

export function WithdrawCarButton({ campaignId }: { campaignId: string }) {
  const { pending, error, run } = useAction();
  return (
    <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
      <button type="button" disabled={pending} className="fs-btn fs-btn-secondary fs-btn-sm" onClick={() => run(() => withdrawCarApplication(campaignId))}>Withdraw application</button>
      {error && <span role="alert" className="fs-field-error">{error}</span>}
    </span>
  );
}

/** Driver: a photo of the car with the decal on it. The business sees it; it does not by itself pay a month. */
export function BookingProofForm({ bookingId }: { bookingId: string }) {
  const [url, setUrl] = useState("");
  const [sent, setSent] = useState(false);
  const { pending, error, run } = useAction();
  if (sent) return <p className="fs-t-body" style={{ marginTop: 12 }}><span className="fs-status is-confirmed">Photo sent</span> · The business sees it right away.</p>;
  return (
    <div style={{ marginTop: 12 }}>
      {url && (
        <span className="fs-media fs-contain fs-thumb" style={{ display: "block", width: 120, height: 80, marginBottom: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Your photo of the car" />
        </span>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <FsUploader folder="proofs" accept="image/*" label={url ? "Replace photo" : "Add the photo"} onUploaded={(u) => setUrl(u[0])} />
        <button type="button" disabled={pending || !url} className="fs-btn fs-btn-primary" onClick={() => run(async () => { const r = await addProof(bookingId, { kind: "periodic", mediaUrl: url }); if (r.ok) setSent(true); return r; })}>
          {pending ? "Sending" : "Send photo"}
        </button>
      </div>
      {error && <p role="alert" className="fs-field-error">{error}</p>}
    </div>
  );
}
