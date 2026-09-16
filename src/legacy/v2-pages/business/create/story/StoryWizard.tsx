"use client";

import { useState, useTransition } from "react";
import { Uploader } from "@/components/v2/Uploader";
import { Money } from "@/components/v2/ui";
import { createEarnCampaign } from "@/app/(v2)/business/create/actions";
import { markIdeaUsed } from "@/app/(v2)/business/create/ideas-actions";
import type { Prefill, WizardBusiness } from "@/app/(v2)/business/create/prefill";
import { PreviewCard } from "../PreviewCards";
import {
  CountField, DollarField, LABEL, MoneyPreview, Presets, SummaryList, WizardFrame, fmtDay, todayPlus,
} from "../wizard-kit";

/**
 * Instagram Story ads in seven questions: the creative, who can post it,
 * the pay, how long it stays up, how many, a preview, and publish.
 */

const TOTAL = 7;
const FOLLOWER_OPTIONS = [0, 500, 1000, 5000];
const HOUR_OPTIONS = [12, 24, 48];

export function StoryWizard({
  business, defaultCity, prefill,
}: { business: WizardBusiness; defaultCity: string; prefill: Prefill | null }) {
  const [step, setStep] = useState(0);
  const [creativeUrl, setCreativeUrl] = useState("");
  const [minFollowers, setMinFollowers] = useState(500);
  const [city, setCity] = useState(defaultCity);
  const [pay, setPay] = useState(prefill?.payDollars ? String(prefill.payDollars) : "25");
  const [liveHours, setLiveHours] = useState(24);
  const [slots, setSlots] = useState(prefill?.slots ? String(prefill.slots) : "20");
  const [deadline, setDeadline] = useState(todayPlus(14));
  const [title, setTitle] = useState(prefill?.title ?? `Post our ${business.name} Story`);
  const [briefEdited, setBriefEdited] = useState(Boolean(prefill?.brief));
  const [brief, setBrief] = useState(prefill?.brief ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const payCents = Math.round((Number(pay) || 0) * 100);
  const slotCount = Number(slots) || 0;
  const autoBrief = `Post this Story to your Instagram exactly as it is and keep it live ${liveHours} hours. Send a screenshot and the link when it is up.`;
  const finalBrief = briefEdited ? brief : autoBrief;

  const submit = (publish: boolean) =>
    start(async () => {
      setError(null);
      if (prefill?.id) await markIdeaUsed(prefill.id, business.id);
      const result = await createEarnCampaign({
        businessId: business.id, kind: "instagram_story", publish,
        title, brief: finalBrief, creativeUrl, minFollowers: minFollowers || undefined, city,
        payDollars: Number(pay), liveHours, slots: slotCount, deadline: deadline || undefined,
      });
      if (result && !result.ok) setError(result.error);
    });

  const valid = [
    Boolean(creativeUrl),
    city.trim().length > 0,
    payCents >= 500,
    true,
    slotCount >= 1,
    true,
    title.trim().length >= 4 && finalBrief.trim().length >= 20,
  ];
  const titles = [
    "Upload the Story creative",
    "Who can post it?",
    "Payment per story",
    "How long should it stay up?",
    "Participants and budget",
    "Preview",
    "Publish",
  ];
  const hints = [
    "A 9:16 image. People post it as is, no cropping, no edits.",
    "A follower minimum keeps it to accounts with a real audience.",
    "Per story that stays up for the full time. You approve, then it pays.",
    "People send a screenshot and the story link. You check it and approve.",
    "Each approved story pays once.",
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
        <div className="card p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative aspect-[9/16] w-40 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
              {creativeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={creativeUrl} alt="Story creative" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center px-3 text-center text-sm text-ink-faint">9:16 preview</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1.0625rem] font-700 tracking-[-0.02em]">Your creative</p>
              <p className="mt-1 text-sm text-ink-soft">PNG or JPG, 1080 by 1920 works best. Text stays readable when it is large.</p>
              <div className="mt-3">
                <Uploader folder="campaigns" accept="image/*" label={creativeUrl ? "Replace" : "Upload image"} onUploaded={(u) => setCreativeUrl(u[0])} />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <p className={LABEL}>Minimum followers</p>
            <div className="mt-2">
              <Presets
                label="Minimum followers" options={FOLLOWER_OPTIONS} value={minFollowers} onPick={setMinFollowers}
                format={(n) => (n === 0 ? "No minimum" : `${n.toLocaleString()}+`)}
              />
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>City</span>
            <input className="field" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Raleigh, NC" />
            <span className="text-sm text-ink-faint">People in this city are notified when you publish.</span>
          </label>
        </div>
      )}

      {step === 2 && (
        <div>
          <Presets label="Pay presets" options={[10, 25, 40]} value={Number(pay) || null} onPick={(n) => setPay(String(n))} />
          <div className="mt-3">
            <DollarField label="Pay per story" value={pay} onChange={setPay} placeholder="25" />
          </div>
          <MoneyPreview cents={payCents} suffix="per story" sub={payCents < 500 ? "At least $5." : "Paid from your campaign credit when you approve the proof."} />
        </div>
      )}

      {step === 3 && (
        <div>
          <Presets label="Live duration" options={HOUR_OPTIONS} value={liveHours} onPick={setLiveHours} format={(n) => `${n} hours`} />
          <div className="card mt-4 p-4">
            <p className="font-display text-[1.5rem] leading-none font-700 tracking-[-0.02em]">{liveHours} hours</p>
            <p className="mt-2 text-sm text-ink-soft">
              Instagram Stories disappear after 24 hours. Choosing 48 asks people to post it twice.
              Checking is manual today: you look at the screenshot and the link, then approve.
            </p>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          <div>
            <Presets label="Participant presets" options={[10, 20, 50, 100]} value={slotCount || null} onPick={(n) => setSlots(String(n))} format={(n) => `${n}`} />
            <div className="mt-3">
              <CountField label="How many stories" value={slots} onChange={setSlots} placeholder="20" />
            </div>
          </div>
          <MoneyPreview cents={payCents * slotCount} suffix="if every spot fills" sub={`${slotCount || 0} stories at $${Math.round(payCents / 100)} each. Unused spots cost nothing.`} />
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Ends on <span className="text-ink-faint">(optional)</span></span>
            <input type="date" className="field" value={deadline} min={todayPlus(1)} onChange={(e) => setDeadline(e.target.value)} />
          </label>
        </div>
      )}

      {step === 5 && (
        <PreviewCard card={{
          kind: "instagram_story", pay_cents: payCents, slots: slotCount, city, deadline: deadline || null,
          requirements: [], details: { creative_url: creativeUrl || null, min_followers: minFollowers || null, live_hours: liveHours },
          business: { name: business.name, logo: business.logo_url, cover: business.cover_url, verified: business.verified },
        }} />
      )}

      {step === 6 && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Title</span>
            <input className="field" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>What people read before they post</span>
            <textarea className="field min-h-24" maxLength={4000} value={finalBrief} onChange={(e) => { setBriefEdited(true); setBrief(e.target.value); }} />
          </label>
          <SummaryList rows={[
            ["Pay", <Money key="pay" cents={payCents} size="sm" suffix="per story" />],
            ["Stays up", `${liveHours} hours`],
            ["Followers", minFollowers ? `${minFollowers.toLocaleString()}+` : "No minimum"],
            ["Spots", String(slotCount)],
            ["Budget if full", <Money key="budget" cents={payCents * slotCount} size="sm" />],
            ["Ends", deadline ? fmtDay(deadline) : "No end date"],
            ["City", city],
          ]} />
        </div>
      )}
    </WizardFrame>
  );
}
