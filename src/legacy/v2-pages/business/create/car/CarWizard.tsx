"use client";

import { useState, useTransition } from "react";
import { Uploader } from "@/components/v2/Uploader";
import { Money } from "@/components/v2/ui";
import { createEarnCampaign } from "@/app/(v2)/business/create/actions";
import { markIdeaUsed } from "@/app/(v2)/business/create/ideas-actions";
import type { Prefill, WizardBusiness } from "@/app/(v2)/business/create/prefill";
import { PreviewCard, placementLabel } from "../PreviewCards";
import {
  ChipToggles, CountField, DollarField, LABEL, MoneyPreview, Presets, SummaryList, WizardFrame, fmtDay, todayPlus,
} from "../wizard-kit";

/**
 * Car advertising in eight questions: where, which cars, where on the car,
 * how long, pay and how many, artwork, a preview, and publish.
 */

const TOTAL = 8;
const COLORS = ["Black", "White", "Silver", "Gray", "Any"];
const BODIES = ["Sedan", "SUV", "Truck", "Coupe", "Hatchback", "Van", "Any"];
const PLACEMENTS = ["rear_window", "driver_door", "passenger_door", "full_side", "partial_wrap", "full_wrap"];
const DURATIONS = [30, 60, 90];

export function CarWizard({
  business, defaultCity, prefill,
}: { business: WizardBusiness; defaultCity: string; prefill: Prefill | null }) {
  const [step, setStep] = useState(0);
  const [city, setCity] = useState(defaultCity);
  const [colors, setColors] = useState<string[]>(["Any"]);
  const [bodies, setBodies] = useState<string[]>(["Any"]);
  const [placements, setPlacements] = useState<string[]>(["rear_window"]);
  const [durationDays, setDurationDays] = useState(30);
  const [startsOn, setStartsOn] = useState("");
  const [pay, setPay] = useState(prefill?.payDollars ? String(prefill.payDollars) : "250");
  const [slots, setSlots] = useState(prefill?.slots ? String(prefill.slots) : "3");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [title, setTitle] = useState(prefill?.title ?? `Drivers wanted in ${defaultCity || "your city"}`);
  const [briefEdited, setBriefEdited] = useState(Boolean(prefill?.brief));
  const [brief, setBrief] = useState(prefill?.brief ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const payCents = Math.round((Number(pay) || 0) * 100);
  const slotCount = Number(slots) || 0;
  const realColors = colors.filter((c) => c !== "Any");
  const realBodies = bodies.filter((b) => b !== "Any");
  const autoBrief = `Drive with ${business.name} artwork on your car around ${city || "the city"} for ${durationDays} days. We arrange printing and installation with you. Send one photo of the car each week.`;
  const finalBrief = briefEdited ? brief : autoBrief;

  const toggleWithAny = (list: string[], set: (v: string[]) => void, item: string) => {
    if (item === "Any") return set(["Any"]);
    const next = list.includes(item) ? list.filter((x) => x !== item) : [...list.filter((x) => x !== "Any"), item];
    set(next.length === 0 ? ["Any"] : next);
  };

  const submit = (publish: boolean) =>
    start(async () => {
      setError(null);
      if (prefill?.id) await markIdeaUsed(prefill.id, business.id);
      const result = await createEarnCampaign({
        businessId: business.id, kind: "car_ads", publish, title, brief: finalBrief,
        city, colors: realColors, bodyTypes: realBodies, placements, durationDays,
        monthlyDollars: Number(pay), slots: slotCount, artworkUrl: artworkUrl || undefined,
        startsOn: startsOn || undefined,
      });
      if (result && !result.ok) setError(result.error);
    });

  const valid = [
    city.trim().length > 0,
    true,
    placements.length > 0,
    true,
    payCents >= 2500 && slotCount >= 1,
    true,
    true,
    title.trim().length >= 4 && finalBrief.trim().length >= 20,
  ];
  const titles = [
    "Where should the cars drive?",
    "Which cars?",
    "Where on the car?",
    "How long?",
    "Pay per car per month",
    "Artwork",
    "Preview",
    "Publish",
  ];
  const hints = [
    "Drivers in this city see the campaign and apply with their car.",
    "Preferences, not rules. Any means you decide when you see the applications.",
    "Pick every placement you would accept. Drivers list which areas they offer.",
    "Drivers are paid monthly for as long as the campaign runs.",
    "Paid from your campaign credit each month the car is on the road.",
    "Optional now. You can add it after drivers are accepted.",
    "This is the card drivers see on Home.",
    undefined,
  ];

  return (
    <WizardFrame
      step={step} total={TOTAL} title={titles[step]} hint={hints[step]}
      canNext={valid[step]} pending={pending} error={error}
      onBack={() => setStep(step - 1)} onNext={() => setStep(step + 1)}
      onPublish={() => submit(true)} onDraft={() => submit(false)}
      publishNote={
        <p>
          Publishing needs campaign credit for at least one month, <Money cents={payCents} size="sm" />. Drivers in {city || "your city"} get notified.
        </p>
      }
    >
      {step === 0 && (
        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>City</span>
          <input className="field text-lg" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Raleigh, NC" />
        </label>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <p className={LABEL}>Colour</p>
            <div className="mt-2">
              <ChipToggles label="Colour" options={COLORS} selected={colors} onToggle={(c) => toggleWithAny(colors, setColors, c)} />
            </div>
          </div>
          <div>
            <p className={LABEL}>Body type</p>
            <div className="mt-2">
              <ChipToggles label="Body type" options={BODIES} selected={bodies} onToggle={(b) => toggleWithAny(bodies, setBodies, b)} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <ChipToggles
          label="Placement" options={PLACEMENTS} selected={placements} labelOf={placementLabel}
          onToggle={(p) => setPlacements(placements.includes(p) ? placements.filter((x) => x !== p) : [...placements, p])}
        />
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <Presets label="Duration" options={DURATIONS} value={durationDays} onPick={setDurationDays} format={(n) => `${n} days`} />
          <div className="card p-4">
            <p className="font-display text-[1.5rem] leading-none font-700 tracking-[-0.02em]">{durationDays} days</p>
            <p className="mt-2 text-sm text-ink-soft">About {Math.max(1, Math.round(durationDays / 30))} monthly payment{Math.round(durationDays / 30) > 1 ? "s" : ""} per car.</p>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Start date <span className="text-ink-faint">(optional)</span></span>
            <input type="date" className="field" value={startsOn} min={todayPlus(0)} onChange={(e) => setStartsOn(e.target.value)} />
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-5">
          <div>
            <Presets label="Pay presets" options={[150, 250, 350]} value={Number(pay) || null} onPick={(n) => setPay(String(n))} />
            <div className="mt-3">
              <DollarField label="Pay per car per month" value={pay} onChange={setPay} placeholder="250" />
            </div>
            {payCents > 0 && payCents < 2500 && <p className="mt-2 text-sm text-ink-faint">At least $25 a month.</p>}
          </div>
          <div>
            <p className={LABEL}>How many cars</p>
            <div className="mt-2">
              <Presets label="Car presets" options={[1, 3, 5, 10]} value={slotCount || null} onPick={(n) => setSlots(String(n))} format={(n) => `${n}`} />
            </div>
            <div className="mt-3">
              <CountField label="How many cars" value={slots} onChange={setSlots} placeholder="3" />
            </div>
          </div>
          <MoneyPreview cents={payCents * slotCount} suffix="per month if every car is on the road" sub={`${slotCount || 0} cars at $${Math.round(payCents / 100)} a month. You pay per car, per month, as it runs.`} />
        </div>
      )}

      {step === 5 && (
        <div className="card p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2 sm:w-56">
              {artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={artworkUrl} alt="Artwork" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm text-ink-faint">No artwork yet</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1.0625rem] font-700 tracking-[-0.02em]">Decal or wrap design</p>
              <p className="mt-1 text-sm text-ink-soft">PNG or JPG. You can add it after drivers are accepted.</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Uploader folder="campaigns" accept="image/*" label={artworkUrl ? "Replace" : "Upload artwork"} onUploaded={(u) => setArtworkUrl(u[0])} />
                {artworkUrl && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArtworkUrl("")}>Remove</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 6 && (
        <PreviewCard card={{
          kind: "car_ads", pay_cents: payCents, slots: slotCount, city, deadline: null, requirements: [],
          details: {
            placements, duration_days: durationDays, artwork_url: artworkUrl || null,
            vehicle_prefs: { colors: realColors, body_types: realBodies },
          },
          business: { name: business.name, logo: business.logo_url, cover: business.cover_url, verified: business.verified },
        }} />
      )}

      {step === 7 && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Title</span>
            <input className="field" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>What drivers read before they apply</span>
            <textarea className="field min-h-24" maxLength={4000} value={finalBrief} onChange={(e) => { setBriefEdited(true); setBrief(e.target.value); }} />
          </label>
          <SummaryList rows={[
            ["Pay", <Money key="pay" cents={payCents} size="sm" suffix="/ month" />],
            ["Cars", String(slotCount)],
            ["Monthly budget if full", <Money key="budget" cents={payCents * slotCount} size="sm" />],
            ["Duration", `${durationDays} days`],
            ["Placements", placements.map(placementLabel).join(", ")],
            ["Cars preferred", [realColors.join(" or ") || "Any colour", realBodies.join(" or ") || "Any body"].join(", ")],
            ["Starts", startsOn ? fmtDay(startsOn) : "When drivers are ready"],
            ["Artwork", artworkUrl ? "Uploaded" : "Later"],
            ["City", city],
          ]} />
        </div>
      )}
    </WizardFrame>
  );
}
