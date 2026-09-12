"use client";

import { useMemo, useState, useTransition } from "react";
import { createEarnCampaign } from "@/app/(v2)/business/create/actions";
import { markIdeaUsed } from "@/app/(v2)/business/create/ideas-actions";
import { draftReelBrief } from "@/app/(v2)/business/people/actions";
import type { Prefill, WizardBusiness } from "@/app/(v2)/business/create/prefill";
import type { CampaignBrief, AiSource } from "@/lib/ai/types";
import { FsUploader } from "@/components/fs/work/Uploader";
import { formatMoney } from "@/components/fs/parts";
import { Facts } from "@/components/fs/work/DetailParts";
import { FlowShell, Field, DollarInput, type FlowStep } from "@/components/fs/business/Flow";
import { FundingPlane, fundingState, type FundingFacts } from "./FundingPlane";
import { ReferenceSource, todayPlus, dayWord, Presets, CustomChips } from "./shared";

/**
 * Recreate a Reel, one decision at a time: the reference, the brief the
 * creators follow, pay, spots, deadline, funding, publish. A brief that
 * came from Trends arrives written; otherwise the business writes it or
 * asks for a draft, and either way every line is editable before publish.
 */
export type StoredBriefProp = { id: string; trendId: string | null; brief: CampaignBrief; source: AiSource; referenceUrl: string | null; referenceMediaUrl: string | null };

const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export function RecreateFlow({ business, defaultCity, prefill, storedBrief, funding }: {
  business: WizardBusiness; defaultCity: string; prefill: Prefill | null; storedBrief: StoredBriefProp | null; funding: FundingFacts;
}) {
  const sb = storedBrief?.brief ?? null;
  const [index, setIndex] = useState(0);
  const [mediaUrl, setMediaUrl] = useState(storedBrief?.referenceMediaUrl ?? "");
  const [link, setLink] = useState(storedBrief?.referenceUrl ?? "");
  const [title, setTitle] = useState(sb?.title ?? prefill?.title ?? "");
  const [brief, setBrief] = useState(sb?.summary ?? prefill?.brief ?? "");
  const [steps, setSteps] = useState<string[]>(sb ? sb.steps.map((s) => s.text) : []);
  const suggestions = useMemo(() => ["15 to 25 seconds", "Vertical 9:16", `Say ${business.name} once`, "Show the product"], [business.name]);
  const [requirements, setRequirements] = useState<string[]>(sb ? Array.from(new Set([...sb.required_elements, ...sb.must_keep])).slice(0, 8) : prefill?.requirements ?? suggestions.slice(0, 2));
  const [durMin, setDurMin] = useState(String(sb?.duration_seconds[0] ?? 15));
  const [durMax, setDurMax] = useState(String(sb?.duration_seconds[1] ?? 25));
  const [pay, setPay] = useState(String(sb ? Math.round(sb.suggested_pay_cents / 100) : prefill?.payDollars ?? 50));
  const [slots, setSlots] = useState(String(sb?.suggested_slots ?? prefill?.slots ?? 10));
  const [deadline, setDeadline] = useState(todayPlus(sb?.deadline_days ?? 14));
  const [city, setCity] = useState(defaultCity);
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const payCents = Math.round(Number(pay || 0) * 100);
  const nSlots = Math.round(Number(slots || 0));
  const linkOk = !link || /^https?:\/\/\S+$/.test(link);
  const hasReference = Boolean(mediaUrl) || (Boolean(link) && linkOk);
  const fs = fundingState(payCents, nSlots, funding);

  const stepDefs: FlowStep[] = [
    { key: "reference", label: "Add the reference", summary: mediaUrl ? (VIDEO.test(mediaUrl) ? "Uploaded video" : "Uploaded image") : link ? "Linked Reel" : null },
    { key: "brief", label: "Your campaign brief", summary: title ? title : null },
    { key: "pay", label: "Pay per approved video", summary: payCents >= 500 ? formatMoney(payCents) : null },
    { key: "spots", label: "How many approved videos", summary: nSlots >= 1 ? `${nSlots} spot${nSlots === 1 ? "" : "s"}` : null },
    { key: "deadline", label: "Deadline and city", summary: deadline && city ? `${dayWord(deadline)} · ${city}` : null },
    { key: "funding", label: "Funding", summary: fs.canPublish ? "Covered for one payment" : "Needs credit" },
    { key: "publish", label: "Ready to publish", summary: null },
  ];
  const valid = [
    hasReference,
    title.trim().length >= 4 && brief.trim().length >= 20,
    payCents >= 500 && payCents <= 500_000,
    nSlots >= 1 && nSlots <= 500,
    Boolean(deadline) && city.trim().length > 0,
    true,
    true,
  ];

  const draft = () => start(async () => {
    setError(null);
    const r = await draftReelBrief({ referenceUrl: link || undefined, referenceMediaUrl: mediaUrl || undefined });
    if (!r.ok) { setError(r.error); return; }
    setBrief(r.text);
    if (!title) setTitle("Recreate our video");
    setDraftNote(r.source === "ai" ? "Drafted from your reference. Edit anything." : "Drafted from a template. Edit anything.");
  });

  const submit = (publish: boolean) => start(async () => {
    setError(null);
    if (prefill?.id) await markIdeaUsed(prefill.id, business.id);
    const dMin = Math.round(Number(durMin || 0)); const dMax = Math.round(Number(durMax || 0));
    const campaignBrief = sb ? { ...sb, title: title.trim() || sb.title, summary: brief.trim(), steps: steps.map((text, i) => ({ ...(sb.steps[i] ?? { n: i + 1 }), n: i + 1, text })), required_elements: requirements, suggested_pay_cents: payCents, suggested_slots: nSlots } : undefined;
    const r = await createEarnCampaign({
      businessId: business.id, title: title.trim(), publish, kind: "recreate_reel",
      referenceUrl: link || undefined, referenceMediaUrl: mediaUrl || undefined, brief: brief.trim(), requirements,
      durationSeconds: dMin > 0 && dMax >= dMin ? [dMin, dMax] : undefined, payDollars: Number(pay), slots: nSlots,
      deadline: deadline ? `${deadline}T23:59:00` : undefined, city: city.trim(),
      briefId: storedBrief?.id, campaignBrief, trendId: storedBrief?.trendId ?? undefined,
    });
    if (r && !r.ok) setError(r.error);
  });

  const last = index === stepDefs.length - 1;
  return (
    <FlowShell
      title="Recreate a Reel" kind={business.name} back={{ href: "/business/create", label: "Create" }}
      steps={stepDefs} index={index} onJump={setIndex} error={error} pending={pending} review={last}
      source={<ReferenceSource mediaUrl={mediaUrl} link={link} businessName={business.name} />}
      canContinue={valid[index]} continueLabel={last ? "Publish campaign" : index === stepDefs.length - 2 && !fs.canPublish ? "Continue without publishing" : "Continue"}
      onContinue={() => { if (last) submit(true); else setIndex(index + 1); }} onBack={() => setIndex(index - 1)}
    >
      {index === 0 && (
        <>
          <p className="fs-t-body">The video creators will recreate. Upload it, or paste the link to the Reel.</p>
          <div style={{ marginTop: 12 }}>
            <FsUploader folder="campaigns" accept="video/*,image/*" label={mediaUrl ? "Replace the reference" : "Upload the video"} onUploaded={(u) => setMediaUrl(u[0])} id="fs-ref-upload" primary={!mediaUrl} />
          </div>
          <Field id="fs-ref-link" label="Or the Reel link" hint="Starts with http" error={link && !linkOk ? "The link must start with http." : null}>
            <input id="fs-ref-link" className="fs-input" inputMode="url" value={link} onChange={(e) => setLink(e.target.value.trim().slice(0, 500))} placeholder="https://www.instagram.com/reel/..." />
          </Field>
        </>
      )}
      {index === 1 && (
        <>
          <Field id="fs-title" label="Name the campaign" hint="4 to 120 characters. Creators see it.">
            <input id="fs-title" className="fs-input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Recreate our latte pour" />
          </Field>
          <Field id="fs-brief" label="What creators should do" hint={draftNote ?? "A couple of sentences. What to show, what to say, what matters."}>
            <textarea id="fs-brief" className="fs-textarea" value={brief} maxLength={4000} rows={5} onChange={(e) => setBrief(e.target.value)} />
          </Field>
          {!sb && hasReference && <button type="button" className="fs-btn fs-btn-secondary" disabled={pending} onClick={draft}>Draft it for me</button>}
          {steps.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p className="fs-t-label">Shot by shot</p>
              <ol className="fs-flow-steps">
                {steps.map((s, i) => (
                  <li key={i}><span className="fs-t-meta fs-tnum">{i + 1}</span><input className="fs-input" value={s} maxLength={140} aria-label={`Step ${i + 1}`} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? e.target.value : x)))} /></li>
                ))}
              </ol>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <p className="fs-t-label">Must include</p>
            <CustomChips values={requirements} onChange={setRequirements} suggestions={suggestions} max={12} />
          </div>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 280 }}>
            <Field id="fs-dur-min" label="Shortest, seconds"><input id="fs-dur-min" className="fs-input fs-tnum" inputMode="numeric" value={durMin} onChange={(e) => setDurMin(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} /></Field>
            <Field id="fs-dur-max" label="Longest, seconds"><input id="fs-dur-max" className="fs-input fs-tnum" inputMode="numeric" value={durMax} onChange={(e) => setDurMax(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} /></Field>
          </div>
        </>
      )}
      {index === 2 && (
        <>
          <p className="fs-t-body">Paid from your campaign credit when you approve a video. Not before.</p>
          <Presets values={[25, 50, 75, 100]} current={pay} onPick={setPay} money />
          <Field id="fs-pay" label="Or another amount"><DollarInput id="fs-pay" value={pay} onChange={setPay} min={5} max={5000} /></Field>
        </>
      )}
      {index === 3 && (
        <>
          <p className="fs-t-body">How many videos you will approve at most. The campaign completes when they are all approved.</p>
          <Presets values={[5, 10, 20, 50]} current={slots} onPick={setSlots} />
          <Field id="fs-slots" label="Or another number" hint="1 to 500"><input id="fs-slots" className="fs-input fs-tnum" inputMode="numeric" value={slots} onChange={(e) => setSlots(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} style={{ maxWidth: 160 }} /></Field>
        </>
      )}
      {index === 4 && (
        <>
          <Field id="fs-deadline" label="Last day to submit"><input id="fs-deadline" type="date" className="fs-input" value={deadline} min={todayPlus(1)} onChange={(e) => setDeadline(e.target.value)} style={{ maxWidth: 220 }} /></Field>
          <Field id="fs-city" label="City" hint="People in this city are told about it."><input id="fs-city" className="fs-input" value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} style={{ maxWidth: 320 }} /></Field>
        </>
      )}
      {index === 5 && <FundingPlane payCents={payCents} spots={nSlots} unit="approved video" funding={funding} />}
      {index === 6 && (
        <>
          <Facts rows={[["Reference", mediaUrl ? (VIDEO.test(mediaUrl) ? "Uploaded video" : "Uploaded image") : "Linked Reel"], ["Pay", `${formatMoney(payCents)} per approved video`], ["Spots", String(nSlots)], ["If every spot is approved", formatMoney(fs.total)], ["Last day to submit", dayWord(deadline)], ["City", city]]} />
          <p className="fs-t-body" style={{ marginTop: 16 }}>{fs.canPublish ? `Publishing tells people in ${city}. Credit leaves only when you approve a video.` : `Your credit does not cover one payment yet. Save it as a draft and publish once credit is added.`}</p>
          <button type="button" className="fs-btn fs-btn-secondary" style={{ marginTop: 12 }} disabled={pending} onClick={() => submit(false)}>Save as draft</button>
        </>
      )}
    </FlowShell>
  );
}
