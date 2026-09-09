"use client";

import { useState, useTransition } from "react";
import { Uploader } from "@/components/v2/Uploader";
import { ANGLE_STEPS, ZONE_LABELS } from "../zones";
import { createVehicle, type VehicleInput } from "../actions";

/**
 * Guided vehicle setup: the car, four photos with clear instructions, then
 * the advertising areas with optional asking prices. Asking prices are the
 * driver's — businesses can still offer differently.
 */

type ZoneState = { available: boolean; asking: string };

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
          <span key={i} className={`h-1 flex-1 ${i <= step ? "bg-signal" : "bg-rule"}`} />
        ))}
      </div>

      {step === 0 && (
        <section className="mt-4">
          <h2 className="font-display text-2xl font-900 tracking-[-0.03em]">Your car</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Year</span>
              <input className="field" inputMode="numeric" maxLength={4} value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} placeholder="2019" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Make</span>
              <input className="field" maxLength={40} value={make} onChange={(e) => setMake(e.target.value)} placeholder="BMW" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Model</span>
              <input className="field" maxLength={40} value={model} onChange={(e) => setModel(e.target.value)} placeholder="330i" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Trim <span className="text-ink-faint">(opt.)</span></span>
              <input className="field" maxLength={40} value={trim} onChange={(e) => setTrim(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Body type</span>
              <select className="field" value={bodyType} onChange={(e) => setBodyType(e.target.value)}>
                <option value="">—</option>
                {["Sedan", "SUV", "Truck", "Coupe", "Hatchback", "Van", "Wagon"].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Color</span>
              <input className="field" maxLength={30} value={color} onChange={(e) => setColor(e.target.value)} placeholder="Black" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Miles / month</span>
              <input className="field" inputMode="numeric" value={miles} onChange={(e) => setMiles(e.target.value.replace(/\D/g, ""))} placeholder="1200" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="eyebrow">Radius (mi)</span>
              <input className="field" inputMode="numeric" value={radius} onChange={(e) => setRadius(e.target.value.replace(/\D/g, ""))} />
            </label>
            <label className="col-span-2 flex flex-col gap-1">
              <span className="eyebrow">City you drive in</span>
              <input className="field" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Raleigh, NC" />
            </label>
          </div>
          <button type="button" disabled={!detailsValid} className="btn btn-signal mt-5 w-full !py-3" onClick={() => setStep(1)}>
            Next: photos
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="mt-4">
          <h2 className="font-display text-2xl font-900 tracking-[-0.03em]">Four photos</h2>
          <p className="mt-1 text-sm text-ink-faint">
            Good light, whole car in frame. You can retake any of them.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {ANGLE_STEPS.map((a) => (
              <li key={a.key} className="border border-rule p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-800">{a.label}</p>
                    <p className="text-xs text-ink-faint">{a.hint}</p>
                  </div>
                  {photos[a.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[a.key]} alt={`${a.label} photo`} className="h-16 w-24 border border-ink object-cover" />
                  ) : (
                    <span className="flex h-16 w-24 items-center justify-center border border-dashed border-rule font-mono text-[0.625rem] text-ink-faint">
                      none yet
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <Uploader
                    folder="vehicles" accept="image/*"
                    label={photos[a.key] ? "Retake" : "Add photo"}
                    onUploaded={(urls) => setPhotos((p) => ({ ...p, [a.key]: urls[0] }))}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-3">
            <button type="button" className="btn btn-ghost !px-4 !py-2.5" onClick={() => setStep(0)}>← Back</button>
            <button type="button" disabled={!photosDone} className="btn btn-signal ml-auto !px-6 !py-2.5" onClick={() => setStep(2)}>
              Next: ad areas
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="mt-4">
          <h2 className="font-display text-2xl font-900 tracking-[-0.03em]">Advertising areas</h2>
          <p className="mt-1 text-sm text-ink-faint">
            Turn on the areas you&apos;d rent out. Asking prices are optional — businesses can offer their own number.
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {Object.entries(ZONE_LABELS).map(([key, label]) => {
              const z = zones[key];
              return (
                <li key={key} className={`flex items-center gap-3 border px-3 py-2.5 ${z.available ? "border-signal" : "border-rule"}`}>
                  <label className="flex flex-1 items-center gap-2.5 text-sm">
                    <input
                      type="checkbox" checked={z.available}
                      onChange={(e) => setZones({ ...zones, [key]: { ...z, available: e.target.checked } })}
                    />
                    {label}
                  </label>
                  {z.available && (
                    <span className="flex items-center gap-1 font-mono text-xs">
                      $
                      <input
                        className="field !min-h-0 !w-20 !px-2 !py-1 !text-xs" inputMode="numeric"
                        value={z.asking} placeholder="90"
                        onChange={(e) => setZones({ ...zones, [key]: { ...z, asking: e.target.value.replace(/\D/g, "") } })}
                        aria-label={`${label} asking price per month`}
                      />
                      /mo
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex gap-3">
            <button type="button" className="btn btn-ghost !px-4 !py-2.5" onClick={() => setStep(1)}>← Back</button>
            <button type="button" disabled={!anyZone} className="btn btn-signal ml-auto !px-6 !py-2.5" onClick={() => setStep(3)}>
              Review
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-4">
          <h2 className="font-display text-2xl font-900 tracking-[-0.03em]">Ready to list</h2>
          <div className="mt-4 border border-rule p-4">
            <p className="font-display text-lg font-800">{year} {make} {model}</p>
            <p className="mt-1 font-mono text-[0.6875rem] text-ink-faint">
              {[color, bodyType, miles && `${miles} mi/mo`, city].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {ANGLE_STEPS.map((a) =>
                photos[a.key] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={a.key} src={photos[a.key]} alt={a.label} className="h-20 w-28 shrink-0 border border-ink object-cover" />
                ) : null)}
            </div>
            <p className="mt-3 font-mono text-[0.625rem] text-ink-faint">
              {Object.entries(zones).filter(([, z]) => z.available).map(([k, z]) =>
                `${ZONE_LABELS[k]}${z.asking ? ` $${z.asking}/mo` : ""}`).join(" · ")}
            </p>
          </div>
          {error && <p role="alert" className="mt-3 font-mono text-xs text-signal">{error}</p>}
          <div className="mt-5 flex gap-3">
            <button type="button" className="btn btn-ghost !px-4 !py-2.5" onClick={() => setStep(2)}>← Back</button>
            <span className="ml-auto flex gap-2">
              <button type="button" disabled={pending} className="btn !px-4 !py-2.5" onClick={() => submit(false)}>
                Save draft
              </button>
              <button type="button" disabled={pending} className="btn btn-signal !px-6 !py-2.5" onClick={() => submit(true)}>
                {pending ? "Listing…" : "List my car"}
              </button>
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
