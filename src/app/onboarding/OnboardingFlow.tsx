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

const STEPS = 3;

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
    <div className="app-root mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center bg-paper px-4 py-10">
      <div className="flex gap-1.5" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
        {Array.from({ length: STEPS }).map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-signal" : "bg-surface-2"}`} aria-hidden />
        ))}
      </div>

      {step === 0 && (
        <section className="mt-8">
          <span className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" aria-hidden />
            <span className="font-display text-lg font-800 tracking-[-0.03em]">TAPMART</span>
          </span>
          <h1 className="mt-6 font-display text-[1.75rem] font-800 tracking-[-0.03em]">
            Welcome to TapMart
          </h1>
          <p className="mt-2 text-[0.9375rem] text-ink-soft">
            Grow a business. Earn from your skills, content, or car.
          </p>
          <button type="button" className="btn btn-signal btn-lg mt-8 w-full" onClick={() => setStep(1)}>
            Get started
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="mt-8">
          <h1 className="font-display text-[1.75rem] font-800 tracking-[-0.03em]">
            What brings you here?
          </h1>
          <div className="mt-6 flex flex-col gap-3" role="radiogroup" aria-label="What brings you here?">
            {(
              [
                ["earn", "Earn money", "Content, photos, video, or your car"],
                ["business", "Grow my business", "Real people execute your marketing"],
                ["both", "Both", "One account does everything"],
              ] as const
            ).map(([key, title, sub]) => {
              const on = path === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setPath(key)}
                  className={`card-2 p-4 text-left transition-colors ${
                    on ? "bg-signal text-signal-ink" : "hover:bg-rule-strong"
                  }`}
                >
                  <span className="block font-display text-[1.125rem] font-800 tracking-[-0.02em]">{title}</span>
                  <span className={`mt-0.5 block text-sm ${on ? "text-signal-ink/80" : "text-ink-faint"}`}>{sub}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button" disabled={!path} className="btn btn-signal btn-lg mt-6 w-full"
            onClick={() => setStep(2)}
          >
            Next
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-8">
          <h1 className="font-display text-[1.75rem] font-800 tracking-[-0.03em]">
            {wantsBusiness && !wantsEarn ? "Your business" : "Almost done"}
          </h1>

          {wantsEarn && (
            <fieldset className="mt-5">
              <legend className="text-sm text-ink-soft">What interests you?</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTERESTS.map((i) => {
                  const on = interests.includes(i.key);
                  return (
                    <button
                      key={i.key} type="button" aria-pressed={on}
                      onClick={() =>
                        setInterests(on ? interests.filter((x) => x !== i.key) : [...interests, i.key])}
                      className="pill"
                    >
                      {i.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {wantsBusiness && (
            <div className="mt-5 flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-ink-soft">Business name</span>
                <input
                  className="field" value={businessName} maxLength={80}
                  onChange={(e) => setBusinessName(e.target.value)} placeholder="Cloud Coffee"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-ink-soft">Category <span className="text-ink-faint">(optional)</span></span>
                <input
                  className="field" value={businessCategory} maxLength={60}
                  onChange={(e) => setBusinessCategory(e.target.value)} placeholder="Coffee shop"
                />
              </label>
            </div>
          )}

          <label className="mt-5 flex flex-col gap-2">
            <span className="text-sm text-ink-soft">Your city</span>
            <input
              className="field" value={city} maxLength={60}
              onChange={(e) => setCity(e.target.value)} placeholder="Raleigh, NC"
            />
            <span className="text-xs text-ink-faint">
              Used to show nearby opportunities. Never your exact address.
            </span>
          </label>

          {error && <p role="alert" className="mt-3 text-sm text-signal">{error}</p>}

          <button
            type="button" disabled={pending} className="btn btn-signal btn-lg mt-6 w-full"
            onClick={finish}
          >
            {pending ? "Setting up…" : "Enter TapMart"}
          </button>
          <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => setStep(1)}>
            ← Back
          </button>
        </section>
      )}
    </div>
  );
}
