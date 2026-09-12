"use client";

import { useState, useTransition } from "react";
import { createEarnCampaign } from "@/app/(v2)/business/create/actions";
import { markIdeaUsed } from "@/app/(v2)/business/create/ideas-actions";
import type { Prefill, WizardBusiness } from "@/app/(v2)/business/create/prefill";
import { FsUploader } from "@/components/fs/work/Uploader";
import { formatMoney } from "@/components/fs/parts";
import { Facts } from "@/components/fs/work/DetailParts";
import { FlowShell, Field, ChoiceRows, DollarInput, type FlowStep } from "@/components/fs/business/Flow";
import { FundingPlane, fundingState, type FundingFacts } from "./FundingPlane";
import { StorySource, todayPlus, dayWord, Presets } from "./shared";

/**
 * Instagram Story ads: the supplied creative first, then who may post it,
 * how long it stays live, pay, spots, deadline, funding, publish. An
 * approved creative from the library can be picked instead of uploading;
 * drafts cannot, because generation is never approval.
 */
export type ApprovedCreative = { id: string; url: string; label: string };

export function StoryFlow({ business, defaultCity, prefill, approved, funding }: {
  business: WizardBusiness; defaultCity: string; prefill: Prefill | null; approved: ApprovedCreative[]; funding: FundingFacts;
}) {
  const [index, setIndex] = useState(0);
  const [creativeUrl, setCreativeUrl] = useState("");
  const [minFollowers, setMinFollowers] = useState<"0" | "500" | "1000" | "5000">("500");
  const [city, setCity] = useState(defaultCity);
  const [liveHours, setLiveHours] = useState<"12" | "24" | "48">("24");
  const [pay, setPay] = useState(String(prefill?.payDollars ?? 25));
  const [slots, setSlots] = useState(String(prefill?.slots ?? 20));
  const [deadline, setDeadline] = useState(todayPlus(14));
  const [title, setTitle] = useState(prefill?.title ?? `Post our ${business.name} Story`);
  const [brief, setBrief] = useState(prefill?.brief ?? "");
  const [briefEdited, setBriefEdited] = useState(Boolean(prefill?.brief));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const payCents = Math.round(Number(pay || 0) * 100);
  const nSlots = Math.round(Number(slots || 0));
  const fs = fundingState(payCents, nSlots, funding);
  const autoBrief = `Post this Story to your Instagram exactly as it is and keep it live ${liveHours} hours. Send a screenshot and the link when it is up.`;
  const finalBrief = briefEdited ? brief : autoBrief;

  const stepDefs: FlowStep[] = [
    { key: "creative", label: "The Story creative", summary: creativeUrl ? "Creative added" : null },
    { key: "who", label: "Who can post it", summary: `${minFollowers === "0" ? "Any follower count" : `${Number(minFollowers).toLocaleString()}+ followers`} · ${city}` },
    { key: "live", label: "How long it stays live", summary: `${liveHours} hours` },
    { key: "pay", label: "Pay per Story", summary: payCents >= 500 ? formatMoney(payCents) : null },
    { key: "spots", label: "How many people", summary: nSlots >= 1 ? `${nSlots} spot${nSlots === 1 ? "" : "s"}` : null },
    { key: "deadline", label: "Last day to post", summary: deadline ? dayWord(deadline) : null },
    { key: "funding", label: "Funding", summary: fs.canPublish ? "Covered for one payment" : "Needs credit" },
    { key: "publish", label: "Ready to publish", summary: null },
  ];
  const valid = [Boolean(creativeUrl), city.trim().length > 0, true, payCents >= 500 && payCents <= 100_000, nSlots >= 1 && nSlots <= 500, Boolean(deadline), true, title.trim().length >= 4 && finalBrief.trim().length >= 20];

  const submit = (publish: boolean) => start(async () => {
    setError(null);
    if (prefill?.id) await markIdeaUsed(prefill.id, business.id);
    const r = await createEarnCampaign({
      businessId: business.id, title: title.trim(), publish, kind: "instagram_story",
      creativeUrl, brief: finalBrief.trim(), minFollowers: Number(minFollowers) || undefined, city: city.trim(),
      payDollars: Number(pay), liveHours: Number(liveHours), slots: nSlots, deadline: `${deadline}T23:59:00`,
    });
    if (r && !r.ok) setError(r.error);
  });

  const last = index === stepDefs.length - 1;
  return (
    <FlowShell
      title="Instagram Story ads" kind={business.name} back={{ href: "/business/create", label: "Create" }}
      steps={stepDefs} index={index} onJump={setIndex} error={error} pending={pending} review={last}
      source={<StorySource creativeUrl={creativeUrl} businessName={business.name} />}
      canContinue={valid[index]} continueLabel={last ? "Publish campaign" : index === stepDefs.length - 2 && !fs.canPublish ? "Continue without publishing" : "Continue"}
      onContinue={() => { if (last) submit(true); else setIndex(index + 1); }} onBack={() => setIndex(index - 1)}
    >
      {index === 0 && (
        <>
          <p className="fs-t-body">The finished 9:16 image or video people post as it is. Nothing is cropped or edited.</p>
          <div style={{ marginTop: 12 }}>
            <FsUploader folder="campaigns" accept="image/*,video/*" label={creativeUrl ? "Replace the creative" : "Upload the creative"} onUploaded={(u) => setCreativeUrl(u[0])} id="fs-story-upload" primary={!creativeUrl} />
          </div>
          {approved.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p className="fs-t-label">Or an approved creative from your library</p>
              <ChoiceRows name="approved" value={approved.find((a) => a.url === creativeUrl)?.id ?? null} onChange={(id) => { const a = approved.find((x) => x.id === id); if (a) setCreativeUrl(a.url); }}
                options={approved.map((a) => ({ value: a.id, label: a.label, detail: "Approved", media: <CreativeThumb url={a.url} /> }))} />
              <p className="fs-t-meta" style={{ marginTop: 8 }}>Drafts are not offered here. A creative has to be approved first.</p>
            </div>
          )}
        </>
      )}
      {index === 1 && (
        <>
          <p className="fs-t-label">Followers needed</p>
          <ChoiceRows name="followers" value={minFollowers} onChange={setMinFollowers} options={[
            { value: "0", label: "Any follower count", detail: "Most people can take part" },
            { value: "500", label: "500 or more" },
            { value: "1000", label: "1,000 or more" },
            { value: "5000", label: "5,000 or more", detail: "Fewer people qualify" },
          ]} />
          <Field id="fs-city" label="City" hint="People in this city are told about it."><input id="fs-city" className="fs-input" value={city} maxLength={60} onChange={(e) => setCity(e.target.value)} style={{ maxWidth: 320 }} /></Field>
        </>
      )}
      {index === 2 && (
        <>
          <p className="fs-t-body">The Story has to stay up this long. The requirement is written into the campaign.</p>
          <ChoiceRows name="live" value={liveHours} onChange={setLiveHours} options={[
            { value: "12", label: "12 hours" }, { value: "24", label: "24 hours", detail: "A full Story" }, { value: "48", label: "48 hours", detail: "Posted twice, or kept as a highlight" },
          ]} />
        </>
      )}
      {index === 3 && (
        <>
          <p className="fs-t-body">Paid from your campaign credit when you approve the proof. Not before.</p>
          <Presets values={[10, 25, 40]} current={pay} onPick={setPay} money />
          <Field id="fs-pay" label="Or another amount"><DollarInput id="fs-pay" value={pay} onChange={setPay} min={5} max={1000} /></Field>
        </>
      )}
      {index === 4 && (
        <>
          <p className="fs-t-body">How many Stories you will approve at most.</p>
          <Presets values={[10, 20, 50, 100]} current={slots} onPick={setSlots} />
          <Field id="fs-slots" label="Or another number" hint="1 to 500"><input id="fs-slots" className="fs-input fs-tnum" inputMode="numeric" value={slots} onChange={(e) => setSlots(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))} style={{ maxWidth: 160 }} /></Field>
        </>
      )}
      {index === 5 && (
        <Field id="fs-deadline" label="Last day to post"><input id="fs-deadline" type="date" className="fs-input" value={deadline} min={todayPlus(1)} onChange={(e) => setDeadline(e.target.value)} style={{ maxWidth: 220 }} /></Field>
      )}
      {index === 6 && <FundingPlane payCents={payCents} spots={nSlots} unit="Story" funding={funding} />}
      {index === 7 && (
        <>
          <Field id="fs-title" label="Name the campaign" hint="4 to 120 characters. People see it."><input id="fs-title" className="fs-input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field id="fs-brief" label="What people are told" hint={briefEdited ? undefined : "Written for you from your choices. Edit anything."}>
            <textarea id="fs-brief" className="fs-textarea" rows={4} maxLength={4000} value={finalBrief} onChange={(e) => { setBrief(e.target.value); setBriefEdited(true); }} />
          </Field>
          <div style={{ marginTop: 16 }}>
            <Facts rows={[["Pay", `${formatMoney(payCents)} per Story`], ["Stays live", `${liveHours} hours`], ["Followers", minFollowers === "0" ? "Any" : `${Number(minFollowers).toLocaleString()} or more`], ["Spots", String(nSlots)], ["If every spot is approved", formatMoney(fs.total)], ["Last day to post", dayWord(deadline)], ["City", city]]} />
          </div>
          <p className="fs-t-body" style={{ marginTop: 16 }}>{fs.canPublish ? `Publishing tells people in ${city}. Credit leaves only when you approve a Story.` : "Your credit does not cover one payment yet. Save it as a draft and publish once credit is added."}</p>
          <button type="button" className="fs-btn fs-btn-secondary" style={{ marginTop: 12 }} disabled={pending} onClick={() => submit(false)}>Save as draft</button>
        </>
      )}
    </FlowShell>
  );
}

function CreativeThumb({ url }: { url: string }) {
  return (
    <span className="fs-media fs-choice-story">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" />
    </span>
  );
}
