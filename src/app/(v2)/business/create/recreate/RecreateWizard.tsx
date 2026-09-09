"use client";

import { useState, useTransition } from "react";
import { Uploader } from "@/components/v2/Uploader";
import { Money } from "@/components/v2/ui";
import { createEarnCampaign } from "../actions";
import { markIdeaUsed } from "../ideas-actions";
import type { Prefill, WizardBusiness } from "../prefill";
import { PreviewCard, isVideoUrl } from "../PreviewCards";
import {
  ChipToggles, CountField, DollarField, LABEL, MoneyPreview, Presets, SummaryList, WizardFrame, fmtDay, todayPlus,
} from "../wizard-kit";

/**
 * Recreate a Reel, in seven questions: the reference, what to do, the pay,
 * how many, when and where, a preview, and publish.
 */

const TOTAL = 7;

export function RecreateWizard({
  business, defaultCity, prefill,
}: { business: WizardBusiness; defaultCity: string; prefill: Prefill | null }) {
  const suggestions = ["15 to 25 seconds", "Vertical 9:16", `Say ${business.name} once`, "Show the product"];

  const [step, setStep] = useState(0);
  const [mediaUrl, setMediaUrl] = useState("");
  const [link, setLink] = useState("");
  const [title, setTitle] = useState(prefill?.title ?? "Recreate our video");
  const [brief, setBrief] = useState(prefill?.brief ?? "");
  const [requirements, setRequirements] = useState<string[]>(
    prefill?.requirements?.length ? prefill.requirements : [suggestions[0], suggestions[1]],
  );
  const [custom, setCustom] = useState("");
  const [durMin, setDurMin] = useState("15");
  const [durMax, setDurMax] = useState("25");
  const [pay, setPay] = useState(prefill?.payDollars ? String(prefill.payDollars) : "50");
  const [slots, setSlots] = useState(prefill?.slots ? String(prefill.slots) : "10");
  const [deadline, setDeadline] = useState(todayPlus(14));
  const [city, setCity] = useState(defaultCity);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const payCents = Math.round((Number(pay) || 0) * 100);
  const slotCount = Number(slots) || 0;
  const linkOk = /^https?:\/\/\S+$/.test(link.trim());
  const hasReference = Boolean(mediaUrl) || linkOk;
  const range: [number, number] | undefined =
    Number(durMin) > 0 && Number(durMax) >= Number(durMin) ? [Number(durMin), Number(durMax)] : undefined;

  const toggle = (r: string) =>
    setRequirements((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  const addCustom = () => {
    const v = custom.trim().slice(0, 200);
    if (!v) return;
    if (!requirements.includes(v)) setRequirements([...requirements, v]);
    setCustom("");
  };

  const submit = (publish: boolean) =>
    start(async () => {
      setError(null);
      if (prefill?.id) await markIdeaUsed(prefill.id, business.id);
      const result = await createEarnCampaign({
        businessId: business.id, kind: "recreate_reel", publish,
        title, brief, referenceUrl: linkOk ? link.trim() : undefined,
        referenceMediaUrl: mediaUrl || undefined, requirements, durationSeconds: range,
        payDollars: Number(pay), slots: slotCount, deadline: deadline || undefined, city,
      });
      if (result && !result.ok) setError(result.error);
    });

  const valid = [
    hasReference,
    title.trim().length >= 4 && brief.trim().length >= 20,
    payCents >= 500,
    slotCount >= 1,
    city.trim().length > 0,
    true,
    true,
  ];

  const titles = [
    "Add the reference",
    "What should creators do?",
    "How much are you paying?",
    "How many approved recreations do you want?",
    "Deadline and eligibility",
    "Preview",
    "Publish",
  ];
  const hints = [
    "Upload the video people should recreate, or paste the link to the Reel.",
    "Plain words. Creators read this before they film.",
    "Per approved video. You only pay when you approve.",
    "Each approval pays once. Spots close when they fill.",
    "Who can take part and until when.",
    "This is the card people see on Home.",
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
          Publishing needs campaign credit for at least one payment, <Money cents={payCents} size="sm" />. People in {city || "your city"} get notified.
        </p>
      }
    >
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div className="card p-4">
            <p className="font-display text-[1.0625rem] font-800 tracking-[-0.02em]">Upload a video</p>
            <p className="mt-1 text-sm text-ink-soft">MP4, WebM or MOV. This becomes the cover of your campaign.</p>
            <div className="mt-3">
              <Uploader folder="campaigns" accept="video/*,image/*" label={mediaUrl ? "Replace" : "Upload"} onUploaded={(u) => setMediaUrl(u[0])} />
            </div>
            {mediaUrl && (
              <div className="mt-3 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
                {isVideoUrl(mediaUrl) ? (
                  <video src={mediaUrl} controls playsInline className="aspect-[4/3] w-full object-cover md:aspect-[16/9]" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl} alt="Reference" className="aspect-[4/3] w-full object-cover md:aspect-[16/9]" />
                )}
              </div>
            )}
          </div>
          <div className="card p-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-display text-[1.0625rem] font-800 tracking-[-0.02em]">Or paste a Reel link</span>
              <input className="field mt-1" inputMode="url" maxLength={500} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.instagram.com/reel/..." />
            </label>
            {link && !linkOk && <p className="mt-2 text-sm text-ink-faint">Paste the full link, starting with https://</p>}
            {linkOk && (
              <a href={link.trim()} target="_blank" rel="noreferrer" className="mt-3 block truncate font-display text-sm font-600 text-signal">
                {link.trim()} →
              </a>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Title</span>
            <input className="field" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>What should they film?</span>
            <textarea
              className="field min-h-28" maxLength={4000} value={brief} onChange={(e) => setBrief(e.target.value)}
              placeholder={`Recreate this video at ${business.name}: same shots, same pace, your own take. Say our name once.`}
            />
            {brief.trim().length > 0 && brief.trim().length < 20 && <span className="text-sm text-ink-faint">A couple of sentences is enough.</span>}
          </label>
          <div>
            <p className={LABEL}>Requirements</p>
            <div className="mt-2">
              <ChipToggles
                label="Requirements"
                options={[...suggestions, ...requirements.filter((r) => !suggestions.includes(r))]}
                selected={requirements} onToggle={toggle}
              />
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className="field" maxLength={200} value={custom} onChange={(e) => setCustom(e.target.value)}
                placeholder="Add your own" aria-label="Add a requirement"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
              />
              <button type="button" className="btn shrink-0" onClick={addCustom} disabled={!custom.trim()}>Add</button>
            </div>
          </div>
          <div>
            <p className={LABEL}>Length in seconds</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <input className="field" inputMode="numeric" value={durMin} onChange={(e) => setDurMin(e.target.value.replace(/\D/g, ""))} aria-label="Minimum seconds" placeholder="15" />
              <input className="field" inputMode="numeric" value={durMax} onChange={(e) => setDurMax(e.target.value.replace(/\D/g, ""))} aria-label="Maximum seconds" placeholder="25" />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <Presets label="Pay presets" options={[25, 50, 75, 100]} value={Number(pay) || null} onPick={(n) => setPay(String(n))} />
          <div className="mt-3">
            <DollarField label="Pay per approved video" value={pay} onChange={setPay} placeholder="50" />
          </div>
          <MoneyPreview cents={payCents} suffix="per approved video" sub={payCents < 500 ? "At least $5." : "Paid from your campaign credit the moment you approve."} />
        </div>
      )}

      {step === 3 && (
        <div>
          <Presets label="Spot presets" options={[5, 10, 20, 50]} value={slotCount || null} onPick={(n) => setSlots(String(n))} format={(n) => `${n}`} />
          <div className="mt-3">
            <CountField label="Approved recreations" value={slots} onChange={setSlots} placeholder="10" />
          </div>
          <MoneyPreview cents={payCents * slotCount} suffix="if every spot fills" sub={`${slotCount || 0} approvals at ${dollars(payCents)} each. Unused spots cost nothing.`} />
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Submissions close <span className="text-ink-faint">(optional)</span></span>
            <input type="date" className="field" value={deadline} min={todayPlus(1)} onChange={(e) => setDeadline(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>City</span>
            <input className="field" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Raleigh, NC" />
            <span className="text-sm text-ink-faint">People in this city are notified when you publish.</span>
          </label>
        </div>
      )}

      {step === 5 && (
        <div>
          <PreviewCard card={{
            kind: "recreate_reel", pay_cents: payCents, slots: slotCount, city, deadline: deadline || null,
            requirements, details: { reference_media_url: mediaUrl || null, duration_seconds: range ?? null },
            business: { name: business.name, logo: business.logo_url, cover: business.cover_url, verified: business.verified },
          }} />
          {requirements.length > 0 && (
            <div className="card mt-4 p-4">
              <p className="font-display text-[1.0625rem] font-800 tracking-[-0.02em]">Requirements</p>
              <ul className="mt-2 flex flex-col gap-1 text-[0.9375rem] text-ink-soft">
                {requirements.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {step === 6 && (
        <SummaryList rows={[
          ["Title", title],
          ["Reference", mediaUrl ? "Uploaded video" : "Reel link"],
          ["Pay", <Money key="pay" cents={payCents} size="sm" suffix="each" />],
          ["Spots", String(slotCount)],
          ["Budget if full", <Money key="budget" cents={payCents * slotCount} size="sm" />],
          ["Closes", deadline ? fmtDay(deadline) : "No deadline"],
          ["City", city],
        ]} />
      )}
    </WizardFrame>
  );
}

function dollars(cents: number) {
  return `$${Math.round(cents / 100)}`;
}
