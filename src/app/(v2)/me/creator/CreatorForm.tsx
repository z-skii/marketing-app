"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestCreatorVerification, updateCreatorProfile } from "../actions";

const CATEGORIES = [
  ["content", "Content"], ["ugc", "UGC"], ["photography", "Photography"],
  ["videography", "Videography"], ["drone", "Drone"], ["editing", "Editing"],
  ["social", "Social media"], ["car_ads", "Car ads"],
] as const;

export function CreatorForm({
  initial,
}: {
  initial: {
    categories: string[]; serviceRadius: number | null; portfolioUrl: string;
    equipment: string; pricingNote: string; verification: string;
  };
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>(initial.categories);
  const [radius, setRadius] = useState(initial.serviceRadius ? String(initial.serviceRadius) : "");
  const [portfolioUrl, setPortfolioUrl] = useState(initial.portfolioUrl);
  const [equipment, setEquipment] = useState(initial.equipment);
  const [pricingNote, setPricingNote] = useState(initial.pricingNote);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-5 flex flex-col gap-4">
      <fieldset>
        <legend className="eyebrow">What do you do?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map(([key, label]) => {
            const on = categories.includes(key);
            return (
              <button
                key={key} type="button" aria-pressed={on}
                onClick={() => setCategories(on ? categories.filter((c) => c !== key) : [...categories, key])}
                className={`border px-3 py-2 font-mono text-xs font-600 uppercase tracking-wide ${
                  on ? "border-signal text-signal" : "border-rule hover:border-ink"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="eyebrow">Service radius (miles)</span>
        <input className="field" inputMode="numeric" value={radius}
          onChange={(e) => setRadius(e.target.value.replace(/\D/g, ""))} placeholder="25" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Portfolio link <span className="text-ink-faint">(optional)</span></span>
        <input className="field" type="url" maxLength={300} value={portfolioUrl}
          onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://…" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Equipment <span className="text-ink-faint">(optional)</span></span>
        <input className="field" maxLength={500} value={equipment}
          onChange={(e) => setEquipment(e.target.value)} placeholder="Sony A7IV, DJI Mini 4…" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Pricing note <span className="text-ink-faint">(optional)</span></span>
        <input className="field" maxLength={500} value={pricingNote}
          onChange={(e) => setPricingNote(e.target.value)} placeholder="Shoots from $150…" />
      </label>

      {message && <p role="alert" className={`font-mono text-xs ${message.ok ? "text-rise" : "text-signal"}`}>{message.text}</p>}

      <div className="flex flex-col gap-2">
        <button
          type="button" disabled={pending || categories.length === 0} className="btn btn-signal !py-3"
          onClick={() =>
            startTransition(async () => {
              const result = await updateCreatorProfile({
                categories, serviceRadius: radius ? Number(radius) : undefined,
                portfolioUrl, equipment, pricingNote,
              });
              setMessage(result.ok ? { ok: true, text: "Saved." } : { ok: false, text: result.error ?? "Failed." });
              if (result.ok) router.refresh();
            })}
        >
          {pending ? "Saving…" : "Save creator profile"}
        </button>
        {["unverified", "rejected"].includes(initial.verification) && (
          <button
            type="button" disabled={pending} className="btn !py-3"
            onClick={() =>
              startTransition(async () => {
                const result = await requestCreatorVerification();
                setMessage(result.ok
                  ? { ok: true, text: "Verification requested — an admin reviews your profile and portfolio." }
                  : { ok: false, text: result.error ?? "Failed." });
                if (result.ok) router.refresh();
              })}
          >
            Request verification
          </button>
        )}
      </div>
    </div>
  );
}
