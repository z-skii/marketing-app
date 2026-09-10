"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretRight, CheckCircle, Cube, Star, X } from "@phosphor-icons/react";
import { Uploader } from "@/components/v2/Uploader";
import { Avatar, Money } from "@/components/v2/ui";
import { VehicleStage } from "@/components/v2/vehicle/VehicleStage";
import type { StageProps } from "@/lib/vehicles/stage";
import { zoneBox } from "@/lib/vehicles/zones-2d";
import { sendCarOffer } from "../actions";

type Zone = { zone: string; label: string; askingCents: number | null };
type Artwork = { id: string; title: string; artwork_url: string };
type Driver = { username: string; name: string; avatar: string | null; ratingAvg: number | null; ratingCount: number };
type Existing = { campaign_id: string; status: string } | null;

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const LABEL = "text-sm text-ink-soft";

/**
 * The car on stage, the facts, one action. "Make ad offer" opens a sheet:
 * placements, months, pay per month, artwork, a message. Sending creates a
 * direct car campaign and the invite. "Preview my ad" stays below as a
 * second section: pick a placement and artwork to see it on the car.
 */
export function AdPreview({
  vehicleId, name, meta, own, available, stage, zones, campaignArtwork, businessName, driver, existing,
}: {
  vehicleId: string; name: string; meta: string; own: boolean; available: boolean; stage: StageProps;
  zones: Zone[]; campaignArtwork: Artwork[]; businessName: string; driver: Driver; existing: Existing;
}) {
  const router = useRouter();
  const [angle, setAngle] = useState<string>("other");
  const [picked, setPicked] = useState<string[]>(zones[0] ? [zones[0].zone] : []);
  const [artwork, setArtwork] = useState<string>(campaignArtwork[0]?.artwork_url ?? "");
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<string | null>(existing?.status === "sent" ? existing.campaign_id : null);
  const [justSent, setJustSent] = useState(false);

  const previewZone = picked[0] ?? null;
  const box = previewZone && artwork && !stage.glbUrl ? zoneBox(angle, previewZone) : null;
  const zoneOf = (z: string) => zones.find((x) => x.zone === z);
  const toggle = (z: string) => setPicked((p) => (p.includes(z) ? p.filter((x) => x !== z) : [...p, z]));
  const hasMedia = Boolean(stage.glbUrl || stage.photos.length > 0 || stage.posterUrl);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10">
      {/* --------------------------------------------------------- stage */}
      <section className="min-w-0 lg:sticky lg:top-6">
        <VehicleStage glbUrl={stage.glbUrl} posterUrl={stage.posterUrl} photos={stage.photos} label={stage.label} onAngleChange={setAngle}>
          {stage.glbUrl && previewZone && artwork ? (
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
          ) : previewZone && artwork && stage.photos.length > 1 ? (
            <span className="glass-tag absolute top-3 right-3 px-2.5 py-1 text-xs text-ink-soft">Turn to see the {zoneOf(previewZone)?.label.toLowerCase()}</span>
          ) : null}
        </VehicleStage>
        {!stage.glbUrl && hasMedia && <p className="mt-2 text-sm text-ink-faint">Photos only, no 3D scan yet.</p>}
        {!hasMedia && <p className="mt-2 text-sm text-ink-faint">The owner has not added photos yet.</p>}

        <div className="mt-4">
          <h1 className="font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] md:text-[2rem]">{name}</h1>
          <p className="mt-2 text-sm text-ink-faint">{meta}</p>
        </div>
      </section>

      {/* --------------------------------------------------------- facts */}
      <section className="mt-6 min-w-0 lg:mt-0">
        <h2 className="eyebrow">Open placements</h2>
        {zones.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">The owner has not opened any area on this car yet.</p>
        ) : (
          <ul className="mt-1 divide-y divide-rule">
            {zones.map((z) => (
              <li key={z.zone} className="flex min-h-11 items-center justify-between gap-3 py-2 text-[0.9375rem]">
                <span>{z.label}</span>
                {z.askingCents != null ? <Money cents={z.askingCents} size="sm" suffix="/ mo" /> : <span className="text-sm text-ink-faint">Open to offers</span>}
              </li>
            ))}
          </ul>
        )}

        <h2 className="eyebrow mt-6">Driver</h2>
        <div className="mt-2 flex items-center gap-3">
          <Avatar src={driver.avatar} name={driver.name} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[1rem] font-700">{driver.name}</p>
            <p className="tnum truncate text-sm text-ink-faint">
              {driver.ratingCount > 0 && driver.ratingAvg != null ? (
                <><Star size={13} weight="fill" className="mr-1 inline-block align-[-1px] text-signal" aria-hidden />{driver.ratingAvg.toFixed(1)} ({driver.ratingCount} {driver.ratingCount === 1 ? "review" : "reviews"})</>
              ) : "No reviews yet"}
              <span className="mx-1.5">·</span>{available ? <span className="text-signal">Available</span> : "Paused"}
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------- action */}
        <div className="mt-6">
          {own ? (
            <p className="text-sm text-ink-soft">This is your own car. Offers go to other owners.</p>
          ) : sent ? (
            <div className={justSent ? "pop" : ""}>
              <p className="flex items-center gap-2 font-display text-[1.125rem] font-800 tracking-[-0.02em] text-signal">
                <CheckCircle size={22} weight="fill" aria-hidden />{justSent ? "Offer sent" : "Offer sent, waiting for an answer"}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{driver.name} gets a notification and can accept or decline.</p>
              <Link href={`/business/campaigns/${sent}`} className="link-row mt-1">Open the campaign<CaretRight size={16} aria-hidden /></Link>
            </div>
          ) : existing?.status === "accepted" ? (
            <div>
              <p className="flex items-center gap-2 font-display text-[1.125rem] font-800 tracking-[-0.02em] text-signal">
                <CheckCircle size={22} weight="fill" aria-hidden />Offer accepted
              </p>
              <Link href={`/business/campaigns/${existing.campaign_id}`} className="link-row mt-1">Open the campaign<CaretRight size={16} aria-hidden /></Link>
            </div>
          ) : (
            <button type="button" className="btn btn-signal btn-lg w-full" disabled={zones.length === 0 || !available} onClick={() => setOpen(true)}>Make ad offer</button>
          )}
        </div>

        {/* ------------------------------------------------------- preview */}
        <h2 className="eyebrow mt-8">Preview my ad</h2>
        <p className="mt-1 text-sm text-ink-soft">Pick a placement and artwork to see it on the car.</p>
        {zones.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Placement">
            {zones.map((z) => (
              <button key={z.zone} type="button" className="pill" aria-pressed={picked.includes(z.zone)} onClick={() => toggle(z.zone)}>{z.label}</button>
            ))}
          </div>
        )}
        <ArtworkPicker artwork={artwork} setArtwork={setArtwork} campaignArtwork={campaignArtwork} />
      </section>

      {open && !own && !sent && (
        <OfferSheet
          vehicleId={vehicleId} name={name} zones={zones} picked={picked} toggle={toggle}
          artwork={artwork} setArtwork={setArtwork} campaignArtwork={campaignArtwork} businessName={businessName}
          onClose={() => setOpen(false)}
          onSent={(id) => { setSent(id); setJustSent(true); setOpen(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

function ArtworkPicker({ artwork, setArtwork, campaignArtwork, compact = false }: { artwork: string; setArtwork: (u: string) => void; campaignArtwork: Artwork[]; compact?: boolean }) {
  return (
    <div className={compact ? "" : "mt-3"}>
      <div className="flex items-start gap-3">
        <div className="relative aspect-[2/1] w-32 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
          {artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artwork} alt="Chosen artwork" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-xs text-ink-faint">No artwork yet</span>
          )}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Uploader id={compact ? "offer-artwork" : "preview-artwork"} folder="campaigns" accept="image/*" label={artwork ? "Replace" : "Upload artwork"} onUploaded={(u) => setArtwork(u[0])} />
          {artwork && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArtwork("")}>Remove</button>}
        </div>
      </div>
      {campaignArtwork.length > 0 && (
        <div className="mt-2.5">
          <p className="text-xs text-ink-faint">From your campaigns</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {campaignArtwork.map((c) => {
              const on = c.artwork_url === artwork;
              return (
                <button key={c.id} type="button" aria-pressed={on} title={c.title} className={`rounded-[8px] p-1 ${on ? "bg-signal" : "bg-surface-2"}`} onClick={() => setArtwork(c.artwork_url)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.artwork_url} alt={c.title} width={72} height={36} className="h-9 w-[4.5rem] rounded-[5px] object-cover" loading="lazy" decoding="async" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function OfferSheet({
  vehicleId, name, zones, picked, toggle, artwork, setArtwork, campaignArtwork, businessName, onClose, onSent,
}: {
  vehicleId: string; name: string; zones: Zone[]; picked: string[]; toggle: (z: string) => void;
  artwork: string; setArtwork: (u: string) => void; campaignArtwork: Artwork[]; businessName: string;
  onClose: () => void; onSent: (campaignId: string) => void;
}) {
  const asking = picked.reduce((sum, z) => sum + (zones.find((x) => x.zone === z)?.askingCents ?? 0), 0);
  const [monthly, setMonthly] = useState<string>(asking > 0 ? String(Math.round(asking / 100)) : "");
  const [months, setMonths] = useState(3);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const monthlyCents = Math.round((Number(monthly) || 0) * 100);
  const canSend = picked.length > 0 && monthlyCents >= 2500 && !pending;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const submit = () => start(async () => {
    setError(null);
    const r = await sendCarOffer(vehicleId, { zones: picked, monthlyDollars: Number(monthly), months, message, artworkUrl: artwork || null });
    if (!r.ok) { setError(r.error); return; }
    onSent(r.campaignId);
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-paper-deep/70" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={`Ad offer for ${name}`} className="glass spot-in relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[var(--radius-sheet)] border px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:max-w-lg md:rounded-[var(--radius-sheet)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[1.375rem] font-800 tracking-[-0.02em]">Ad offer</h2>
          <button type="button" aria-label="Close" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-soft can-hover:hover:text-ink" onClick={onClose}><X size={22} aria-hidden /></button>
        </div>
        <p className="mt-0.5 text-sm text-ink-soft">{name}</p>

        <form className="mt-4 flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); if (canSend) submit(); }}>
          <div>
            <p className={LABEL}>Placement</p>
            <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-label="Placement">
              {zones.map((z) => {
                const on = picked.includes(z.zone);
                return (
                  <button key={z.zone} type="button" className="pill" aria-pressed={on} onClick={() => toggle(z.zone)}>
                    {z.label}
                    {z.askingCents != null && <span className={`tnum text-xs ${on ? "text-signal-ink/80" : "text-ink-faint"}`}>${Math.round(z.askingCents / 100)}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Duration</span>
            <select className="field" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
              {MONTHS.map((m) => <option key={m} value={m}>{m} {m === 1 ? "month" : "months"}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Pay per month</span>
            <span className="flex items-center gap-3">
              <span className="font-display text-[1.75rem] font-800 tracking-[-0.03em] text-signal" aria-hidden>$</span>
              <input className="field flex-1 text-lg" inputMode="decimal" type="number" min={25} step="1" value={monthly} aria-label="Monthly amount" placeholder="Amount" onChange={(e) => setMonthly(e.target.value)} />
              <span className="text-sm whitespace-nowrap text-ink-soft">/ month</span>
            </span>
            {asking > 0 && <span className="tnum text-xs text-ink-faint">Owner asks ${Math.round(asking / 100)} a month for {picked.length === 1 ? "this placement" : "these placements"}.</span>}
          </label>

          <div>
            <p className={LABEL}>Campaign artwork</p>
            <div className="mt-1.5">
              <ArtworkPicker artwork={artwork} setArtwork={setArtwork} campaignArtwork={campaignArtwork} compact />
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Message <span className="text-ink-faint">(optional)</span></span>
            <textarea className="field min-h-20" maxLength={900} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Hi, ${businessName} would like to run an ad on your car.`} />
          </label>

          {monthlyCents >= 2500 && (
            <p className="text-sm text-ink-soft">
              <Money cents={monthlyCents * months} size="sm" /> over {months} {months === 1 ? "month" : "months"}, paid monthly from campaign credit.
            </p>
          )}
          {monthlyCents > 0 && monthlyCents < 2500 && <p className="text-sm text-ink-faint">At least $25 a month.</p>}
          {error && <p role="alert" className="text-sm alert-text">{error}</p>}
          <button type="submit" className="btn btn-signal btn-lg" disabled={!canSend}>{pending ? "Sending" : "Send offer"}</button>
        </form>
      </div>
    </div>
  );
}
