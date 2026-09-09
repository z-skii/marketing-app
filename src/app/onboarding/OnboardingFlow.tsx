"use client";

import { useState, useTransition } from "react";
import { completeOnboarding, type OnboardingInput } from "./actions";

/**
 * Three short screens: welcome → what brings you here → the one detail we
 * need for that path. Everything else is finished later inside the product.
 */

const INTERESTS = [
  { key: "content", label: "Create content" },
  { key: "photography", label: "Photography" },
  { key: "videography", label: "Videography" },
  { key: "car_ads", label: "Car advertising" },
  { key: "ugc", label: "UGC" },
];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<OnboardingInput["path"] | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const finish = () =>
    startTransition(async () => {
      const result = await completeOnboarding({
        path: path!, city, interests, businessName, businessCategory,
      });
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });

  const wantsEarn = path === "earn" || path === "both";
  const wantsBusiness = path === "business" || path === "both";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      {step === 0 && (
        <section>
          <span className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" aria-hidden />
            <span className="font-display text-xl font-900 tracking-[-0.03em]">TAPMART</span>
          </span>
          <h1 className="mt-6 font-display text-4xl leading-[0.95] font-900 tracking-[-0.04em]">
            Welcome to TapMart
          </h1>
          <p className="mt-3 text-base text-ink-faint">
            Grow a business. Earn from your skills, content, or car.
          </p>
          <button type="button" className="btn btn-signal mt-8 w-full !py-3.5" onClick={() => setStep(1)}>
            Get started
          </button>
        </section>
      )}

      {step === 1 && (
        <section>
          <h1 className="font-display text-3xl leading-[0.95] font-900 tracking-[-0.04em]">
            What brings you here?
          </h1>
          <div className="mt-6 flex flex-col gap-3" role="radiogroup" aria-label="What brings you here?">
            {(
              [
                ["earn", "Earn money", "Content, photos, video, or your car"],
                ["business", "Grow my business", "Real people execute your marketing"],
                ["both", "Both", "One account does everything"],
              ] as const
            ).map(([key, title, sub]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={path === key}
                onClick={() => setPath(key)}
                className={`border px-4 py-4 text-left transition-colors ${
                  path === key ? "border-signal bg-signal/5" : "border-rule hover:border-ink"
                }`}
              >
                <span className="font-display text-lg font-800">{title}</span>
                <span className="block text-xs text-ink-faint">{sub}</span>
              </button>
            ))}
          </div>
          <button
            type="button" disabled={!path} className="btn btn-signal mt-6 w-full !py-3.5"
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 className="font-display text-3xl leading-[0.95] font-900 tracking-[-0.04em]">
            {wantsBusiness && !wantsEarn ? "Your business" : "Almost done"}
          </h1>

          {wantsEarn && (
            <fieldset className="mt-5">
              <legend className="eyebrow">What interests you?</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTERESTS.map((i) => {
                  const on = interests.includes(i.key);
                  return (
                    <button
                      key={i.key} type="button" aria-pressed={on}
                      onClick={() =>
                        setInterests(on ? interests.filter((x) => x !== i.key) : [...interests, i.key])}
                      className={`border px-3 py-2 font-mono text-xs font-600 uppercase tracking-wide ${
                        on ? "border-signal text-signal" : "border-rule text-ink hover:border-ink"
                      }`}
                    >
                      {i.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {wantsBusiness && (
            <div className="mt-5 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="eyebrow">Business name</span>
                <input
                  className="field" value={businessName} maxLength={80}
                  onChange={(e) => setBusinessName(e.target.value)} placeholder="Cloud Coffee"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="eyebrow">Category <span className="text-ink-faint">(optional)</span></span>
                <input
                  className="field" value={businessCategory} maxLength={60}
                  onChange={(e) => setBusinessCategory(e.target.value)} placeholder="Coffee shop"
                />
              </label>
            </div>
          )}

          <label className="mt-4 flex flex-col gap-1">
            <span className="eyebrow">Your city</span>
            <input
              className="field" value={city} maxLength={60}
              onChange={(e) => setCity(e.target.value)} placeholder="Raleigh, NC"
            />
            <span className="font-mono text-[0.625rem] text-ink-faint">
              Used to show nearby opportunities. Never your exact address.
            </span>
          </label>

          {error && <p role="alert" className="mt-3 font-mono text-xs text-signal">{error}</p>}

          <button
            type="button" disabled={pending} className="btn btn-signal mt-6 w-full !py-3.5"
            onClick={finish}
          >
            {pending ? "Setting up…" : "Enter TapMart"}
          </button>
          <button type="button" className="mt-3 w-full py-2 font-mono text-xs text-ink-faint hover:text-ink" onClick={() => setStep(1)}>
            ← Back
          </button>
        </section>
      )}
    </div>
  );
}
