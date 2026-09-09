"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/v2/Uploader";
import { addProof, requestVehicleVerification, setVehicleListed } from "../../../cars/actions";
import { setVehicleAvailable } from "../actions";

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

/** One switch that reads as a switch: label, state, a button that flips it. */
function Toggle({
  title, sub, on, onLabel, offLabel, pending, onToggle,
}: { title: string; sub: string; on: boolean; onLabel: string; offLabel: string; pending: boolean; onToggle: () => void }) {
  return (
    <div className="card flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="min-w-0">
        <span className="block font-display text-[0.9375rem] font-700">{title}</span>
        <span className="block text-sm text-ink-faint">{sub}</span>
      </span>
      <button
        type="button" role="switch" aria-checked={on} disabled={pending}
        className={`btn btn-sm shrink-0 ${on ? "btn-signal" : ""}`}
        onClick={onToggle}
      >
        {on ? onLabel : offLabel}
      </button>
    </div>
  );
}

export function OwnerSwitches({
  vehicleId, status, available,
}: { vehicleId: string; status: string; available: boolean }) {
  const { pending, error, run } = useAction();
  const listed = status === "listed";
  return (
    <div className="row-list">
      <Toggle
        title="Available for ads"
        sub={available ? "Campaigns can match this car." : "Paused. Campaigns will not match this car."}
        on={available} onLabel="On" offLabel="Off" pending={pending}
        onToggle={() => run(() => setVehicleAvailable(vehicleId, !available))}
      />
      <Toggle
        title="Listed"
        sub={listed ? "Businesses you apply to can see it." : "Unlisted. You cannot apply to car campaigns."}
        on={listed} onLabel="Listed" offLabel="Unlisted" pending={pending}
        onToggle={() => run(() => setVehicleListed(vehicleId, !listed))}
      />
      {error && <p role="alert" className="text-sm text-signal">{error}</p>}
    </div>
  );
}

/** Honest verification states. Nothing here happens automatically. */
export function VerificationCard({
  vehicleId, verification, note,
}: { vehicleId: string; verification: string; note: string | null }) {
  const { pending, error, run } = useAction();
  const copy =
    verification === "verified"
      ? { title: "Verified ✓", sub: "TapMart checked the photos. Businesses see the mark when you apply." }
      : verification === "pending"
        ? { title: "Checking", sub: "TapMart is checking your photos. A person does this, usually within a day." }
        : verification === "rejected"
          ? { title: "Not verified", sub: note ?? "The photos did not pass. Retake them in daylight and try again." }
          : { title: "Not verified yet", sub: "A verified car gets picked more often. TapMart checks the four photos by hand." };
  return (
    <div className="card flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="min-w-0">
        <span className={`block font-display text-[0.9375rem] font-700 ${verification === "verified" ? "text-signal" : ""}`}>{copy.title}</span>
        <span className="block text-sm text-ink-faint">{copy.sub}</span>
        {error && <span role="alert" className="mt-1 block text-sm text-signal">{error}</span>}
      </span>
      {["unverified", "rejected"].includes(verification) && (
        <button type="button" disabled={pending} className="btn btn-sm shrink-0" onClick={() => run(() => requestVehicleVerification(vehicleId))}>
          {verification === "rejected" ? "Try again" : "Request verification"}
        </button>
      )}
    </div>
  );
}

/** A driver uploads proof the ad is on the car: a photo, or an odometer reading. */
export function ProofForm({ bookingId }: { bookingId: string }) {
  const [kind, setKind] = useState("periodic");
  const [url, setUrl] = useState("");
  const [odometer, setOdometer] = useState("");
  const [done, setDone] = useState(false);
  const { pending, error, run } = useAction();
  return (
    <div className="card-2 mt-3 p-3">
      <p className="font-display text-sm font-700">Upload proof</p>
      <p className="mt-0.5 text-sm text-ink-faint">A photo of the ad on your car keeps the monthly payments coming.</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <select className="field w-auto" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Proof type">
          <option value="installation">Installation photo</option>
          <option value="periodic">Car photo</option>
          <option value="odometer">Odometer</option>
        </select>
        {kind === "odometer" && (
          <input className="field w-32" inputMode="numeric" value={odometer}
            onChange={(e) => setOdometer(e.target.value.replace(/\D/g, ""))} placeholder="Miles" aria-label="Odometer miles" />
        )}
        <Uploader folder="proofs" id={`proof-${bookingId}`} accept="image/*" label={url ? "Photo added ✓" : "Photo"} onUploaded={(u) => setUrl(u[0])} />
        <button type="button" disabled={pending || (!url && !odometer)} className="btn btn-signal btn-sm"
          onClick={() => run(async () => {
            const r = await addProof(bookingId, { kind, mediaUrl: url || undefined, odometerMiles: odometer ? Number(odometer) : undefined });
            if (r.ok) { setUrl(""); setOdometer(""); setDone(true); }
            return r;
          })}>
          Send proof
        </button>
      </div>
      {done && !error && <p className="mt-2 text-sm text-rise">Proof sent. The business will see it.</p>}
      {error && <p role="alert" className="mt-2 text-sm text-signal">{error}</p>}
    </div>
  );
}
