"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CaretRight, CheckCircle, Cube } from "@phosphor-icons/react";
import { Uploader } from "@/components/v2/Uploader";
import { Money } from "@/components/v2/ui";
import { VehicleStage } from "@/components/v2/vehicle/VehicleStage";
import type { StageProps } from "@/lib/vehicles/stage";
import { zoneBox } from "@/lib/vehicles/zones-2d";
import { sendCarOffer } from "../actions";

type Zone = { zone: string; label: string; askingCents: number | null };
type Artwork = { id: string; title: string; artwork_url: string };

const MONTHS = [1, 3, 6, 12];
const LABEL = "text-sm text-ink-soft";

/**
 * The car on stage with the business's artwork placed on it. Photo stages
 * get an approximate 2D overlay from zones-2d; a 3D stage says plainly that
 * real placement waits for the reconstruction provider. Then the offer.
 */
export function AdPreview({
  vehicleId, name, meta, own, stage, zones, campaignArtwork, businessName,
}: {
  vehicleId: string; name: string; meta: string; own: boolean; stage: StageProps;
  zones: Zone[]; campaignArtwork: Artwork[]; businessName: string;
}) {
  const [angle, setAngle] = useState<string>("other");
  const [zone, setZone] = useState<string | null>(zones[0]?.zone ?? null);
  const [artwork, setArtwork] = useState<string>(campaignArtwork[0]?.artwork_url ?? "");
  const [monthly, setMonthly] = useState<string>(zones[0]?.askingCents ? String(Math.round(zones[0].askingCents / 100)) : "");
  const [months, setMonths] = useState(3);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  const picked = zones.find((z) => z.zone === zone) ?? null;
  const monthlyCents = Math.round((Number(monthly) || 0) * 100);
  const box = zone && artwork && !stage.glbUrl ? zoneBox(angle, zone) : null;
  const canSend = Boolean(zone) && monthlyCents >= 1000 && !pending && !own;

  const pickZone = (z: Zone) => {
    setZone(z.zone);
    if (!monthly && z.askingCents) setMonthly(String(Math.round(z.askingCents / 100)));
  };

  const submit = () =>
    start(async () => {
      setError(null);
      const result = await sendCarOffer(vehicleId, {
        zones: zone ? [zone] : [], monthlyDollars: Number(monthly), months, message, artworkUrl: artwork || null,
      });
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      else setSent(true);
    });

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10">
      {/* --------------------------------------------------------- stage */}
      <section className="min-w-0 lg:sticky lg:top-6">
        <VehicleStage glbUrl={stage.glbUrl} posterUrl={stage.posterUrl} photos={stage.photos} label={stage.label} onAngleChange={setAngle}>
          {stage.glbUrl && zone && artwork ? (
            <span className="glass-tag absolute top-3 right-3 flex max-w-[70%] items-center gap-1.5 px-2.5 py-1 text-xs text-ink-soft">
              <Cube size={14} aria-hidden />3D placement preview coming with the reconstruction provider
            </span>
          ) : box ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artwork} alt={`${businessName} artwork, approximate placement`}
                className="absolute rounded-[3px] object-cover shadow-[0_6px_18px_-8px_rgba(0,0,0,0.7)]"
                style={{
                  left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`,
                  transform: `perspective(600px) skewY(${box.skew ?? 0}deg)`, opacity: 0.92,
                }}
              />
              <span className="glass-tag absolute top-3 right-3 px-2.5 py-1 text-xs text-ink-soft">Approximate preview</span>
            </>
          ) : zone && artwork ? (
            <span className="glass-tag absolute top-3 right-3 px-2.5 py-1 text-xs text-ink-soft">Turn to see the {picked?.label.toLowerCase()}</span>
          ) : null}
        </VehicleStage>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] md:text-[2rem]">{name}</h1>
            <p className="mt-2 text-sm text-ink-faint">{meta}</p>
          </div>
          {picked?.askingCents != null && (
            <p className="shrink-0 text-right">
              <Money cents={picked.askingCents} size="md" suffix="/ mo" />
              <span className="block text-xs text-ink-faint">Owner asks</span>
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------ choices */}
      <section className="mt-8 min-w-0 lg:mt-0">
        <h2 className="eyebrow">Placement</h2>
        {zones.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">The owner has not opened any area on this car yet.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Placement">
            {zones.map((z) => {
              const on = z.zone === zone;
              return (
                <button key={z.zone} type="button" className="pill" aria-pressed={on} onClick={() => pickZone(z)}>
                  {z.label}
                  {z.askingCents != null && <span className={`tnum text-xs ${on ? "text-signal-ink/80" : "text-ink-faint"}`}>${Math.round(z.askingCents / 100)}</span>}
                </button>
              );
            })}
          </div>
        )}

        <h2 className="eyebrow mt-7">Artwork</h2>
        <div className="mt-2 flex items-start gap-3">
          <div className="relative aspect-[2/1] w-36 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
            {artwork ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={artwork} alt="Chosen artwork" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-ink-faint">No artwork yet</span>
            )}
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Uploader folder="campaigns" accept="image/*" label={artwork ? "Replace" : "Upload artwork"} onUploaded={(u) => setArtwork(u[0])} />
            {artwork && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArtwork("")}>Remove</button>}
          </div>
        </div>
        {campaignArtwork.length > 0 && (
          <div className="mt-3">
            <p className={LABEL}>Use campaign artwork</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {campaignArtwork.map((c) => {
                const on = c.artwork_url === artwork;
                return (
                  <button
                    key={c.id} type="button" aria-pressed={on} title={c.title}
                    className={`rounded-[8px] p-1 transition-shadow ${on ? "bg-signal" : "bg-surface-2"}`}
                    onClick={() => setArtwork(c.artwork_url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.artwork_url} alt={c.title} width={72} height={36} className="h-9 w-[4.5rem] rounded-[5px] object-cover" loading="lazy" decoding="async" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- offer */}
        <h2 className="eyebrow mt-7">Offer</h2>
        {own ? (
          <p className="mt-2 text-sm text-ink-soft">This is your own car. Offers go to other owners.</p>
        ) : sent ? (
          <div className="card mt-2 p-4">
            <p className="flex items-center gap-2 font-display text-[1.125rem] font-800 tracking-[-0.02em] text-signal">
              <CheckCircle size={22} weight="fill" aria-hidden />Offer sent
            </p>
            <p className="mt-1 text-sm text-ink-soft">The owner gets a notification and can accept, decline or counter.</p>
            <Link href="/business/cars" className="link-row mt-2">More cars near you<CaretRight size={16} aria-hidden /></Link>
          </div>
        ) : (
          <form className="card mt-2 flex flex-col gap-4 p-4" onSubmit={(e) => { e.preventDefault(); if (canSend) submit(); }}>
            <label className="flex items-center gap-3">
              <span className="font-display text-[1.75rem] font-800 tracking-[-0.03em] text-signal" aria-hidden>$</span>
              <input
                className="field flex-1 text-lg" inputMode="decimal" value={monthly} aria-label="Monthly amount"
                placeholder="Amount"
                onChange={(e) => setMonthly(e.target.value.replace(/[^0-9.]/g, ""))}
              />
              <span className="text-sm text-ink-soft">/ month</span>
            </label>
            <div>
              <p className={LABEL}>Months</p>
              <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-label="Months">
                {MONTHS.map((m) => (
                  <button key={m} type="button" className="pill" aria-pressed={months === m} onClick={() => setMonths(m)}>{m}</button>
                ))}
              </div>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Message to the owner <span className="text-ink-faint">(optional)</span></span>
              <textarea className="field min-h-20" maxLength={900} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Hi, ${businessName} would like to run an ad on your car.`} />
            </label>
            {monthlyCents >= 1000 && (
              <p className="text-sm text-ink-soft">
                <Money cents={monthlyCents * months} size="sm" /> over {months} month{months === 1 ? "" : "s"}, paid monthly from campaign credit.
              </p>
            )}
            {monthlyCents > 0 && monthlyCents < 1000 && <p className="text-sm text-ink-faint">At least $10 a month.</p>}
            {error && <p role="alert" className="text-sm alert-text">{error}</p>}
            <button type="submit" className="btn btn-signal btn-lg" disabled={!canSend}>
              {pending ? "Sending" : "Send offer"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
