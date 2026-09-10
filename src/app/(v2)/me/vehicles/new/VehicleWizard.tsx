"use client";

import { useState, useTransition } from "react";
import { Uploader } from "@/components/v2/Uploader";
import { ANGLE_STEPS, ZONE_LABELS } from "../../../cars/zones";
import { createVehicle, type VehicleInput } from "../../../cars/actions";

/**
 * Earn with your car, in four short steps: the car, four guided photos, the
 * placements the person would rent, then a look before saving. Businesses
 * set the pay on their campaigns, so there is no price haggling here. A
 * minimum price is optional and folded away.
 */

/** The placements a campaign can ask for. Same keys as campaigns.details.placements. */
const PLACEMENTS = ["rear_window", "driver_door", "passenger_door", "full_side", "partial_wrap", "full_wrap"] as const;
const BODY_TYPES = ["Sedan", "SUV", "Truck", "Coupe", "Hatchback", "Van", "Wagon"];
const STEP_TITLE = "font-display text-[1.5rem] leading-[1.05] font-700 tracking-[-0.02em]";
const LABEL = "text-sm text-ink-soft";
const STEPS = ["Your car", "Photos", "Placements", "Check"] as const;

export function VehicleWizard({ defaultCity, returnTo }: { defaultCity: string; returnTo: string | null }) {
  const [step, setStep] = useState(0);
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [miles, setMiles] = useState("");
  const [radius, setRadius] = useState("15");
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [placements, setPlacements] = useState<string[]>([]);
  const [showMinimum, setShowMinimum] = useState(false);
  const [minimum, setMinimum] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const detailsValid =
    Number(year) >= 1960 && Number(year) <= 2035 && make.trim() && model.trim() && city.trim();
  const photosDone = ANGLE_STEPS.every((a) => photos[a.key]);
  const photoCount = ANGLE_STEPS.filter((a) => photos[a.key]).length;

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const asking = minimum ? Number(minimum) : undefined;
      const input: VehicleInput = {
        year: Number(year), make, model, bodyType, color,
        monthlyMiles: miles ? Number(miles) : undefined,
        city, radiusMiles: radius ? Number(radius) : undefined,
        photos: Object.entries(photos).map(([angle, url]) => ({ angle, url })),
        zones: PLACEMENTS.map((zone) => ({
          zone, available: placements.includes(zone),
          askingDollars: placements.includes(zone) ? asking : undefined,
        })),
        publish: true,
        returnTo: returnTo ?? undefined,
      };
      const result = await createVehicle(input);
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });

  const toggle = (zone: string) =>
    setPlacements((p) => (p.includes(zone) ? p.filter((z) => z !== zone) : [...p, zone]));

  return (
    <div>
      <div className="flex items-center gap-1.5" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
        {STEPS.map((label, i) => (
          <span key={label} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-signal" : "bg-surface-2"}`} aria-hidden />
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-faint">Step {step + 1} of {STEPS.length}</p>

      {step === 0 && (
        <section className="mt-2">
          <h2 className={STEP_TITLE}>Your car</h2>
          <p className="mt-1.5 text-[0.9375rem] text-ink-soft">Businesses match campaigns to the car, the colour and the city.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Year</span>
              <input className="field" inputMode="numeric" maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} placeholder="2019" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Make</span>
              <input className="field" maxLength={40} value={make} onChange={(e) => setMake(e.target.value)} placeholder="BMW" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Model</span>
              <input className="field" maxLength={40} value={model} onChange={(e) => setModel(e.target.value)} placeholder="330i" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Colour</span>
              <input className="field" maxLength={30} value={color} onChange={(e) => setColor(e.target.value)} placeholder="Black" />
            </label>
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className={LABEL}>Vehicle type</span>
              <div className="pill-row" role="group" aria-label="Vehicle type">
                {BODY_TYPES.map((b) => (
                  <button key={b} type="button" className="pill" aria-pressed={bodyType === b} onClick={() => setBodyType(bodyType === b ? "" : b)}>
                    {b}
                  </button>
                ))}
              </div>
            </label>
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className={LABEL}>City you drive in</span>
              <input className="field" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Raleigh, NC" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Miles a month, roughly</span>
              <input className="field" inputMode="numeric" value={miles} onChange={(e) => setMiles(e.target.value.replace(/\D/g, ""))} placeholder="1200" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Normal driving area, miles</span>
              <input className="field" inputMode="numeric" value={radius} onChange={(e) => setRadius(e.target.value.replace(/\D/g, ""))} placeholder="15" />
            </label>
          </div>
          <button type="button" disabled={!detailsValid} className="btn btn-signal btn-lg mt-6 w-full" onClick={() => setStep(1)}>
            Next: photos
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="mt-2">
          <h2 className={STEP_TITLE}>Four photos</h2>
          <p className="mt-1.5 text-[0.9375rem] text-ink-soft">
            Daylight, whole car in frame. Businesses pick drivers from these, and TapMart uses them to verify the car.
          </p>
          <ul className="row-list mt-5">
            {ANGLE_STEPS.map((a, i) => (
              <li key={a.key} className="card p-4">
                <div className="flex items-center gap-4">
                  {photos[a.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[a.key]} alt={`${a.label} photo`} className="h-20 w-28 shrink-0 rounded-[10px] object-cover" />
                  ) : (
                    <span className="card-2 flex h-20 w-28 shrink-0 items-center justify-center font-display text-lg font-700 text-ink-faint">
                      {i + 1}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[1.125rem] font-700 tracking-[-0.02em]">
                      {a.label}
                      {photos[a.key] && <span className="ml-2 text-signal" aria-label="Added">✓</span>}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-faint">{a.hint}</p>
                    <div className="mt-2.5">
                      <Uploader
                        folder="vehicles" id={`upload-vehicle-${a.key}`} accept="image/*"
                        label={photos[a.key] ? "Retake" : "Add photo"}
                        onUploaded={(urls) => setPhotos((p) => ({ ...p, [a.key]: urls[0] }))}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
            <span className="ml-auto text-sm text-ink-faint">{photoCount} of 4</span>
            <button type="button" disabled={!photosDone} className="btn btn-signal" onClick={() => setStep(2)}>
              Next: placements
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-2">
          <h2 className={STEP_TITLE}>What would you rent?</h2>
          <p className="mt-1.5 text-[0.9375rem] text-ink-soft">
            Campaigns name the placement they need. Pick everything you are open to. Pay is set by the business, per campaign.
          </p>
          <ul className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label="Placements">
            {PLACEMENTS.map((zone) => {
              const on = placements.includes(zone);
              return (
                <li key={zone}>
                  <button
                    type="button" aria-pressed={on} onClick={() => toggle(zone)}
                    className={`card-2 flex min-h-14 w-full items-center justify-between gap-2 px-4 py-3 text-left font-display text-[0.9375rem] font-600 transition-colors ${on ? "bg-signal text-signal-ink" : "hover:bg-rule-strong"}`}
                  >
                    {(ZONE_LABELS[zone] ?? zone)}
                    {on && <span aria-hidden>✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-5">
            {showMinimum ? (
              <label className="card flex items-center justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span className="block font-display text-[0.9375rem] font-600">Minimum a month</span>
                  <span className="block text-sm text-ink-faint">Campaigns under this will not be suggested.</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 font-display font-600">
                  $
                  <input className="field w-24" inputMode="numeric" value={minimum} placeholder="90"
                    onChange={(e) => setMinimum(e.target.value.replace(/\D/g, ""))} aria-label="Minimum price a month" />
                </span>
              </label>
            ) : (
              <button type="button" className="font-display text-sm font-600 text-ink-soft hover:text-ink" onClick={() => setShowMinimum(true)}>
                Set a minimum price (optional)
              </button>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
            <button type="button" disabled={placements.length === 0} className="btn btn-signal ml-auto" onClick={() => setStep(3)}>
              Check and save
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-2">
          <h2 className={STEP_TITLE}>Looks right?</h2>
          <div className="card mt-5 overflow-hidden">
            {(photos[ANGLE_STEPS[1].key] || photos[ANGLE_STEPS[0].key]) && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photos[ANGLE_STEPS[1].key] ?? photos[ANGLE_STEPS[0].key]}
                  alt={`${year} ${make} ${model}`}
                  className="aspect-[4/3] w-full object-cover md:aspect-[16/9]"
                />
                <div className="media-scrim absolute inset-x-0 bottom-0 h-2/3" aria-hidden />
                <p className="absolute inset-x-4 bottom-3 font-display text-[1.375rem] font-700 tracking-[-0.02em]">{year} {make} {model}</p>
              </div>
            )}
            <div className="p-4 pt-3.5">
              <p className="text-sm text-ink-faint">
                {[color, bodyType, city, miles && `${Number(miles).toLocaleString()} miles a month`, radius && `${radius} mile area`].filter(Boolean).join("  ·  ")}
              </p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {ANGLE_STEPS.map((a) =>
                  photos[a.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={a.key} src={photos[a.key]} alt={a.label} className="h-16 w-24 shrink-0 rounded-[10px] object-cover" />
                  ) : null)}
              </div>
              <p className="mt-4 text-sm text-ink-soft">Open to</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {placements.map((z) => (
                  <span key={z} className="rounded-md bg-surface-2 px-2 py-0.5 font-display text-xs font-600">{(ZONE_LABELS[z] ?? z)}</span>
                ))}
              </div>
              {minimum && <p className="mt-3 text-sm text-ink-faint">Minimum ${minimum} a month</p>}
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-faint">
            Your car stays private. Only businesses whose campaign you apply to see it.
          </p>
          {error && <p role="alert" className="mt-3 text-sm alert-text">{error}</p>}
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
            <button type="button" disabled={pending} className="btn btn-signal btn-lg ml-auto" onClick={submit}>
              {pending ? "Saving…" : "Save my car"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
