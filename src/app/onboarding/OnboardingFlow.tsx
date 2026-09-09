"use client";

import { useState, useTransition } from "react";
import { completeOnboarding, type OnboardingInput } from "./actions";

/**
 * Three screens, no more: welcome, how you want to use TapMart, and the few
 * details that path needs. Instagram and the car wait until a campaign
 * asks for them; they are added from Profile.
 */

const STEPS = 3;
const TITLE = "font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em]";

const PATHS = [
  ["earn", "Earn money", "Recreate Reels, post Stories, drive with a car ad."],
  ["business", "Grow my business", "Real people put your business in front of more people."],
  ["both", "Both", "One account. Switch between them any time."],
] as const;

export function OnboardingFlow({ initialName, initialCity }: { initialName: string; initialCity: string }) {
  const [step, setStep] = useState(0);
  const [path, setPath] = useState<OnboardingInput["path"] | null>(null);
  const [displayName, setDisplayName] = useState(initialName);
  const [city, setCity] = useState(initialCity);
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const wantsBusiness = path === "business" || path === "both";
  const wantsEarn = path === "earn" || path === "both";
  const ready = displayName.trim().length >= 2 && (!wantsBusiness || businessName.trim().length >= 2);

  const finish = () =>
    startTransition(async () => {
      setError(null);
      const result = await completeOnboarding({
        path: path!, displayName, city, businessName, businessCategory, businessCity,
      });
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });

  return (
    <div className="app-root mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center bg-paper px-5 py-10">
      <div className="flex gap-1.5" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
        {Array.from({ length: STEPS }).map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-signal" : "bg-surface-2"}`} aria-hidden />
        ))}
      </div>

      {step === 0 && (
        <section className="mt-8">
          <span className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-signal" aria-hidden />
            <span className="font-display text-lg font-800 tracking-[-0.03em]">TapMart</span>
          </span>
          <h1 className={`mt-6 ${TITLE}`}>Welcome to TapMart</h1>
          <p className="mt-2 text-[1.0625rem] leading-relaxed text-ink-soft">
            Get paid to promote businesses, or grow your own.
          </p>
          <button type="button" className="btn btn-signal btn-lg mt-8 w-full" onClick={() => setStep(1)}>
            Get started
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="mt-8">
          <h1 className={TITLE}>How do you want to use TapMart?</h1>
          <div className="mt-6 flex flex-col gap-3" role="radiogroup" aria-label="How do you want to use TapMart?">
            {PATHS.map(([key, title, sub]) => {
              const on = path === key;
              return (
                <button
                  key={key} type="button" role="radio" aria-checked={on}
                  onClick={() => setPath(key)}
                  className={`card-2 p-4 text-left transition-colors ${on ? "bg-signal text-signal-ink" : "hover:bg-rule-strong"}`}
                >
                  <span className="block font-display text-[1.125rem] font-800 tracking-[-0.02em]">{title}</span>
                  <span className={`mt-0.5 block text-sm ${on ? "text-signal-ink/80" : "text-ink-faint"}`}>{sub}</span>
                </button>
              );
            })}
          </div>
          <button type="button" disabled={!path} className="btn btn-signal btn-lg mt-6 w-full" onClick={() => setStep(2)}>
            Next
          </button>
          <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => setStep(0)}>← Back</button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-8">
          <h1 className={TITLE}>{wantsBusiness && !wantsEarn ? "You and your business" : "About you"}</h1>

          <div className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-ink-soft">Your name</span>
              <input
                className="field" value={displayName} maxLength={60} autoComplete="name"
                onChange={(e) => setDisplayName(e.target.value)} placeholder="Jordan Lee"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-ink-soft">Your city</span>
              <input
                className="field" value={city} maxLength={60} autoComplete="address-level2"
                onChange={(e) => setCity(e.target.value)} placeholder="Raleigh, NC"
              />
              <span className="text-xs text-ink-faint">Used to show nearby campaigns. Never your exact address.</span>
            </label>
          </div>

          {wantsBusiness && (
            <div className="mt-6 flex flex-col gap-4">
              <p className="font-display text-[1.125rem] font-800 tracking-[-0.02em]">Your business</p>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-ink-soft">Business name</span>
                <input
                  className="field" value={businessName} maxLength={80} autoComplete="organization"
                  onChange={(e) => setBusinessName(e.target.value)} placeholder="Cloud Coffee"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-ink-soft">Category <span className="text-ink-faint">(optional)</span></span>
                <input
                  className="field" value={businessCategory} maxLength={60}
                  onChange={(e) => setBusinessCategory(e.target.value)} placeholder="Coffee shop"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-ink-soft">Business city <span className="text-ink-faint">(if different)</span></span>
                <input
                  className="field" value={businessCity} maxLength={60}
                  onChange={(e) => setBusinessCity(e.target.value)} placeholder={city || "Raleigh, NC"}
                />
              </label>
            </div>
          )}

          {wantsEarn && (
            <p className="mt-5 text-sm leading-relaxed text-ink-faint">
              You can add Instagram and your car from Profile when a campaign needs them.
            </p>
          )}

          {error && <p role="alert" className="mt-3 text-sm text-signal">{error}</p>}

          <button type="button" disabled={pending || !ready} className="btn btn-signal btn-lg mt-6 w-full" onClick={finish}>
            {pending ? "Setting up…" : wantsBusiness && !wantsEarn ? "Open my business" : "Enter TapMart"}
          </button>
          <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => setStep(1)}>← Back</button>
        </section>
      )}
    </div>
  );
}
