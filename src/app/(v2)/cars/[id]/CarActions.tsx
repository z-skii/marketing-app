"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Uploader } from "@/components/v2/Uploader";
import { ZONE_LABELS } from "../zones";
import {
  acceptCounter, addProof, advanceBooking, makeCarOffer, payBookingMonth,
  requestVehicleVerification, respondToOffer, setVehicleListed,
} from "../actions";

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

/** Business: pick placements, offer a monthly price. */
export function OfferForm({
  vehicleId, businesses, availableZones,
}: {
  vehicleId: string;
  businesses: { id: string; name: string }[];
  availableZones: { zone: string; asking_cents_monthly: number | null }[];
}) {
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [zones, setZones] = useState<string[]>([]);
  const [dollars, setDollars] = useState("");
  const [months, setMonths] = useState("3");
  const [message, setMessage] = useState("");
  const { pending, error, run } = useAction();

  const suggested = availableZones
    .filter((z) => zones.includes(z.zone) && z.asking_cents_monthly)
    .reduce((sum, z) => sum + (z.asking_cents_monthly ?? 0), 0);

  return (
    <div className="card card-signal p-4 md:p-5">
      <h2 className="font-display text-[1.25rem] leading-tight font-800 tracking-[-0.02em]">Advertise on this car</h2>
      <p className="mt-1 text-sm text-ink-soft">Pick the areas you want, name a monthly price, and the driver answers.</p>
      {businesses.length > 1 && (
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm text-ink-soft">Business</span>
          <select className="field" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
            {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      )}
      <p className="mt-4 text-sm text-ink-soft">Areas</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Ad areas">
        {availableZones.map((z) => {
          const on = zones.includes(z.zone);
          return (
            <button
              key={z.zone} type="button" aria-pressed={on}
              onClick={() => setZones(on ? zones.filter((x) => x !== z.zone) : [...zones, z.zone])}
              className="pill"
            >
              {ZONE_LABELS[z.zone] ?? z.zone}
              {z.asking_cents_monthly ? ` · $${Math.round(z.asking_cents_monthly / 100)}` : ""}
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-soft">Your offer, $ a month</span>
          <input className="field" inputMode="numeric" value={dollars}
            onChange={(e) => setDollars(e.target.value.replace(/\D/g, ""))}
            placeholder={suggested ? String(Math.round(suggested / 100)) : "300"} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-ink-soft">Months</span>
          <input className="field" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value.replace(/\D/g, ""))} />
        </label>
      </div>
      <textarea className="field mt-3 min-h-20 w-full" maxLength={1000} value={message}
        onChange={(e) => setMessage(e.target.value)} placeholder="Anything the driver should know (optional)" aria-label="Message to driver" />
      {error && <p role="alert" className="mt-3 text-sm text-signal">{error}</p>}
      <button
        type="button" disabled={pending || zones.length === 0 || !dollars}
        className="btn btn-signal btn-lg mt-4 w-full"
        onClick={() => run(() => makeCarOffer({
          vehicleId, businessId, zones, monthlyDollars: Number(dollars), months: Number(months) || 1, message,
        }))}
      >
        {pending ? "Sending…" : "Send offer"}
      </button>
    </div>
  );
}

/** Driver: accept / counter / decline an incoming offer. */
export function OfferResponse({ offerId }: { offerId: string }) {
  const [counter, setCounter] = useState("");
  const { pending, error, run } = useAction();
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} className="btn btn-signal btn-sm"
          onClick={() => run(() => respondToOffer(offerId, "accepted"))}>
          Accept
        </button>
        <button type="button" disabled={pending} className="btn btn-ghost btn-sm"
          onClick={() => run(() => respondToOffer(offerId, "declined"))}>
          Decline
        </button>
        <span className="flex items-center gap-1.5 text-sm text-ink-soft">
          $<input className="field w-24" inputMode="numeric" value={counter}
            onChange={(e) => setCounter(e.target.value.replace(/\D/g, ""))} aria-label="Counter offer per month" placeholder="Counter" />
          <button type="button" disabled={pending || !counter} className="btn btn-sm"
            onClick={() => run(() => respondToOffer(offerId, "countered", Number(counter)))}>
            Counter
          </button>
        </span>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-signal">{error}</p>}
    </div>
  );
}

export function AcceptCounterButton({ offerId }: { offerId: string }) {
  const { pending, error, run } = useAction();
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} className="btn btn-signal btn-sm"
        onClick={() => run(() => acceptCounter(offerId))}>
        Accept counter
      </button>
      {error && <span role="alert" className="text-sm text-signal">{error}</span>}
    </span>
  );
}

const NEXT_LABEL: Record<string, string> = {
  creative_pending: "Artwork ready → installation",
  installation_pending: "Installed, go live (pays first month)",
  active: "Mark completed",
};

export function BookingControls({
  bookingId, status, isBusiness, isDriver,
}: { bookingId: string; status: string; isBusiness: boolean; isDriver: boolean }) {
  const [artwork, setArtwork] = useState("");
  const { pending, error, run } = useAction();
  const canAdvance = isBusiness && NEXT_LABEL[status];

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        {canAdvance && (
          <button type="button" disabled={pending} className="btn btn-signal btn-sm"
            onClick={() => run(() => advanceBooking(bookingId, artwork || undefined))}>
            {NEXT_LABEL[status]}
          </button>
        )}
        {isBusiness && status === "active" && (
          <button type="button" disabled={pending} className="btn btn-sm"
            onClick={() => run(() => payBookingMonth(bookingId))}>
            Pay next month
          </button>
        )}
      </div>
      {isBusiness && status === "creative_pending" && (
        <div className="mt-3">
          <Uploader folder="campaigns" accept="image/*" label="Upload artwork"
            onUploaded={(urls) => setArtwork(urls[0])} />
          {artwork && <p className="mt-2 text-sm text-rise">Artwork attached. Advance when ready.</p>}
        </div>
      )}
      {isDriver && ["active", "proof_required", "installation_pending"].includes(status) && (
        <ProofForm bookingId={bookingId} />
      )}
      {error && <p role="alert" className="mt-2 text-sm text-signal">{error}</p>}
    </div>
  );
}

function ProofForm({ bookingId }: { bookingId: string }) {
  const [kind, setKind] = useState("periodic");
  const [url, setUrl] = useState("");
  const [odometer, setOdometer] = useState("");
  const { pending, error, run } = useAction();
  return (
    <div className="card-2 mt-3 p-3">
      <p className="font-display text-sm font-600">Add proof</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select className="field w-auto" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Proof type">
          <option value="installation">Installation photo</option>
          <option value="periodic">Vehicle photo</option>
          <option value="odometer">Odometer</option>
        </select>
        {kind === "odometer" && (
          <input className="field w-32" inputMode="numeric" value={odometer}
            onChange={(e) => setOdometer(e.target.value.replace(/\D/g, ""))} placeholder="Miles" aria-label="Odometer miles" />
        )}
        <Uploader folder="proofs" accept="image/*" label={url ? "Photo added ✓" : "Photo"} onUploaded={(u) => setUrl(u[0])} />
        <button type="button" disabled={pending || (!url && !odometer)} className="btn btn-sm"
          onClick={() => run(async () => {
            const r = await addProof(bookingId, { kind, mediaUrl: url || undefined, odometerMiles: odometer ? Number(odometer) : undefined });
            if (r.ok) { setUrl(""); setOdometer(""); }
            return r;
          })}>
          Submit proof
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-signal">{error}</p>}
    </div>
  );
}

export function OwnerControls({
  vehicleId, status, verification,
}: { vehicleId: string; status: string; verification: string }) {
  const { pending, error, run } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} className="btn btn-sm"
        onClick={() => run(() => setVehicleListed(vehicleId, status !== "listed"))}>
        {status === "listed" ? "Unlist" : "List publicly"}
      </button>
      {["unverified", "rejected"].includes(verification) && (
        <button type="button" disabled={pending} className="btn btn-ghost btn-sm"
          onClick={() => run(() => requestVehicleVerification(vehicleId))}>
          Request verification
        </button>
      )}
      {error && <p role="alert" className="text-sm text-signal">{error}</p>}
    </div>
  );
}
