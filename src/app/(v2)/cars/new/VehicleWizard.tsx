"use client";

import { useState, useTransition } from "react";
import { Uploader } from "@/components/v2/Uploader";
import { ANGLE_STEPS, ZONE_LABELS } from "../zones";
import { createVehicle, type VehicleInput } from "../actions";

/**
 * Guided vehicle setup: the car, four photos with clear instructions, then
 * the advertising areas with optional asking prices. Asking prices are the
 * driver's; businesses can still offer differently.
 */

type ZoneState = { available: boolean; asking: string };

const STEP_TITLE = "font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em]";
const LABEL = "text-sm text-ink-soft";

export function VehicleWizard({ defaultCity }: { defaultCity: string }) {
  const [step, setStep] = useState(0);
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [color, setColor] = useState("");
  const [miles, setMiles] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [radius, setRadius] = useState("15");
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [zones, setZones] = useState<Record<string, ZoneState>>(
    Object.fromEntries(Object.keys(ZONE_LABELS).map((z) => [z, { available: false, asking: "" }])),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const detailsValid =
    Number(year) >= 1960 && Number(year) <= 2035 && make.trim() && model.trim() && city.trim();
  const photosDone = ANGLE_STEPS.every((a) => photos[a.key]);
  const anyZone = Object.values(zones).some((z) => z.available);

  const submit = (publish: boolean) =>
    startTransition(async () => {
      setError(null);
      const input: VehicleInput = {
        year: Number(year), make, model, trim, bodyType, color,
        monthlyMiles: miles ? Number(miles) : undefined,
        city, radiusMiles: radius ? Number(radius) : undefined,
        photos: Object.entries(photos).map(([angle, url]) => ({ angle, url })),
        zones: Object.entries(zones).map(([zone, z]) => ({
          zone, available: z.available,
          askingDollars: z.asking ? Number(z.asking) : undefined,
        })),
        publish,
      };
      const result = await createVehicle(input);
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });

  return (
    <div>
      <div className="flex items-center gap-1.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-signal" : "bg-surface-2"}`} />
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-faint">Step {step + 1} of 4</p>

      {step === 0 && (
        <section className="mt-2">
          <h2 className={STEP_TITLE}>Your car</h2>
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
              <span className={LABEL}>Trim <span className="text-ink-faint">(optional)</span></span>
              <input className="field" maxLength={40} value={trim} onChange={(e) => setTrim(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Body type</span>
              <select className="field" value={bodyType} onChange={(e) => setBodyType(e.target.value)}>
                <option value="">Pick one</option>
                {["Sedan", "SUV", "Truck", "Coupe", "Hatchback", "Van", "Wagon"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Color</span>
              <input className="field" maxLength={30} value={color} onChange={(e) => setColor(e.target.value)} placeholder="Black" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Miles a month</span>
              <input className="field" inputMode="numeric" value={miles} onChange={(e) => setMiles(e.target.value.replace(/\D/g, ""))} placeholder="1200" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Radius in miles</span>
              <input className="field" inputMode="numeric" value={radius} onChange={(e) => setRadius(e.target.value.replace(/\D/g, ""))} />
            </label>
            <label className="col-span-2 flex flex-col gap-1.5">
              <span className={LABEL}>City you drive in</span>
              <input className="field" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Raleigh, NC" />
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
            Good light, whole car in frame. You can retake any of them.
          </p>
          <ul className="row-list mt-5">
            {ANGLE_STEPS.map((a) => (
              <li key={a.key} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-[1.125rem] font-800 tracking-[-0.02em]">{a.label}</p>
                    <p className="mt-0.5 text-sm text-ink-faint">{a.hint}</p>
                  </div>
                  {photos[a.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[a.key]} alt={`${a.label} photo`} className="h-16 w-24 shrink-0 rounded-[10px] object-cover" />
                  ) : (
                    <span className="card-2 flex h-16 w-24 shrink-0 items-center justify-center text-xs text-ink-faint">
                      No photo
                    </span>
                  )}
                </div>
                <div className="mt-3">
                  <Uploader
                    folder="vehicles" accept="image/*"
                    label={photos[a.key] ? "Retake" : "Add photo"}
                    onUploaded={(urls) => setPhotos((p) => ({ ...p, [a.key]: urls[0] }))}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>← Back</button>
            <button type="button" disabled={!photosDone} className="btn btn-signal ml-auto" onClick={() => setStep(2)}>
              Next: ad areas
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-2">
          <h2 className={STEP_TITLE}>Advertising areas</h2>
          <p className="mt-1.5 text-[0.9375rem] text-ink-soft">
            Turn on the areas you would rent out. Asking prices are optional. Businesses can offer their own number.
          </p>
          <ul className="row-list mt-5">
            {Object.entries(ZONE_LABELS).map(([key, label]) => {
              const z = zones[key];
              return (
                <li key={key} className={`card-2 flex items-center gap-3 px-4 py-3 ${z.available ? "bg-signal text-signal-ink" : ""}`}>
                  <label className="flex flex-1 items-center gap-3 font-display text-[0.9375rem] font-600">
                    <input
                      type="checkbox" checked={z.available}
                      className={`h-4 w-4 ${z.available ? "accent-signal-ink" : "accent-signal"}`}
                      onChange={(e) => setZones({ ...zones, [key]: { ...z, available: e.target.checked } })}
                    />
                    {label}
                  </label>
                  {z.available && (
                    <span className="flex items-center gap-1.5 text-sm font-600">
                      $
                      <input
                        className="field w-24" inputMode="numeric"
                        value={z.asking} placeholder="90"
                        onChange={(e) => setZones({ ...zones, [key]: { ...z, asking: e.target.value.replace(/\D/g, "") } })}
                        aria-label={`${label} asking price per month`}
                      />
                      a month
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
            <button type="button" disabled={!anyZone} className="btn btn-signal ml-auto" onClick={() => setStep(3)}>
              Review
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-2">
          <h2 className={STEP_TITLE}>Ready to list</h2>
          <div className="card mt-5 overflow-hidden">
            {photos[ANGLE_STEPS[1].key] || photos[ANGLE_STEPS[0].key] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[ANGLE_STEPS[1].key] ?? photos[ANGLE_STEPS[0].key]}
                alt={`${year} ${make} ${model}`}
                className="aspect-[4/3] w-full object-cover md:aspect-[16/9]"
              />
            ) : null}
            <div className="p-4 pt-3.5">
              <p className="font-display text-[1.25rem] leading-[1.15] font-800 tracking-[-0.02em]">{year} {make} {model}</p>
              <p className="mt-1.5 text-sm text-ink-faint">
                {[color, bodyType, miles && `${miles} miles a month`, city].filter(Boolean).join("  ·  ")}
              </p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {ANGLE_STEPS.map((a) =>
                  photos[a.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={a.key} src={photos[a.key]} alt={a.label} className="h-16 w-24 shrink-0 rounded-[10px] object-cover" />
                  ) : null)}
              </div>
              <ul className="row-list mt-4">
                {Object.entries(zones).filter(([, z]) => z.available).map(([k, z]) => (
                  <li key={k} className="card-2 flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <span className="font-display font-600">{ZONE_LABELS[k]}</span>
                    <span className={z.asking ? "tnum font-display font-800 text-signal" : "text-ink-faint"}>
                      {z.asking ? `$${z.asking} a month` : "Open to offers"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-signal">{error}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
            <span className="ml-auto flex gap-2">
              <button type="button" disabled={pending} className="btn" onClick={() => submit(false)}>
                Save draft
              </button>
              <button type="button" disabled={pending} className="btn btn-signal" onClick={() => submit(true)}>
                {pending ? "Listing…" : "List my car"}
              </button>
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
