"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { sendReelRequest, sendStoryRequest, draftReelBrief } from "@/app/(v2)/business/people/actions";
import type { Person } from "@/lib/v2/marketplace";
import { Avatar, formatMoney } from "@/components/fs/parts";
import { Img } from "@/components/fs/Img";
import { Facts } from "@/components/fs/work/DetailParts";
import { FsUploader } from "@/components/fs/work/Uploader";
import { FlowShell, Field, ChoiceRows, DollarInput, type FlowStep } from "@/components/fs/business/Flow";
import { FundingPlane, fundingState, type FundingFacts } from "@/components/fs/business/flows/FundingPlane";
import { todayPlus, dayWord, Presets } from "@/components/fs/business/flows/shared";

/**
 * Asking one specific person. The person and their work stay in view the
 * whole way; the business decides the creative or reference, the pay, the
 * requirements, the deadline and a note, sees the funding, and sends.
 * Nothing is agreed until the person accepts, and the screen says so.
 */
export type RequestKind = "story" | "reel";
export type PriorCreative = { id: string; title: string; url: string };

const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export function RequestFlow({ kind, person, sample, creatives, funding, businessName }: {
  kind: RequestKind; person: Person; sample: { url: string; title: string } | null; creatives: PriorCreative[]; funding: FundingFacts; businessName: string;
}) {
  const story = kind === "story";
  const name = person.display_name ?? person.username;
  const [index, setIndex] = useState(0);
  const [creativeUrl, setCreativeUrl] = useState("");
  const [liveHours, setLiveHours] = useState<"12" | "24" | "48">("24");
  const [link, setLink] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [brief, setBrief] = useState("");
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const [pay, setPay] = useState(story ? "40" : "75");
  const [deadline, setDeadline] = useState(todayPlus(7));
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const payCents = Math.round(Number(pay || 0) * 100);
  const fs = fundingState(payCents, 1, funding);
  const linkOk = !link || /^https?:\/\/\S+$/.test(link);

  const steps: FlowStep[] = story
    ? [
        { key: "creative", label: "The Story creative", summary: creativeUrl ? "Creative added" : null },
        { key: "live", label: "How long it stays live", summary: `${liveHours} hours` },
        { key: "pay", label: "Pay for the Story", summary: payCents >= 500 ? formatMoney(payCents) : null },
        { key: "message", label: "A note for them", summary: message ? "Note added" : "No note" },
        { key: "funding", label: "Funding", summary: fs.canPublish ? "Covered" : "Needs credit" },
        { key: "send", label: `Ready to ask ${name}`, summary: null },
      ]
    : [
        { key: "reference", label: "The reference", summary: mediaUrl ? "Uploaded" : link ? "Linked Reel" : "None" },
        { key: "brief", label: "What they should do", summary: brief.trim().length >= 20 ? "Written" : null },
        { key: "pay", label: "Pay for the approved video", summary: payCents >= 500 ? formatMoney(payCents) : null },
        { key: "deadline", label: "Deadline", summary: dayWord(deadline) },
        { key: "message", label: "A note for them", summary: message ? "Note added" : "No note" },
        { key: "funding", label: "Funding", summary: fs.canPublish ? "Covered" : "Needs credit" },
        { key: "send", label: `Ready to ask ${name}`, summary: null },
      ];
  const valid = story
    ? [Boolean(creativeUrl), true, payCents >= 500 && payCents <= 100_000, true, true, fs.canPublish]
    : [linkOk, brief.trim().length >= 20, payCents >= 500 && payCents <= 500_000, Boolean(deadline), true, true, fs.canPublish];

  const draft = () => start(async () => {
    setError(null);
    const r = await draftReelBrief({ referenceUrl: link || undefined, referenceMediaUrl: mediaUrl || undefined });
    if (!r.ok) { setError(r.error); return; }
    setBrief(r.text);
    setDraftNote(r.source === "ai" ? "Drafted from your reference. Edit anything." : "Drafted from a template. Edit anything.");
  });

  const send = () => start(async () => {
    setError(null);
    const r = story
      ? await sendStoryRequest({ profileId: person.id, payDollars: Number(pay), creativeUrl, liveHours: Number(liveHours), message: message || undefined })
      : await sendReelRequest({ profileId: person.id, payDollars: Number(pay), referenceUrl: link || undefined, referenceMediaUrl: mediaUrl || undefined, deadline, brief: brief.trim(), message: message || undefined });
    if (!r.ok) setError(r.error); else setSent(r.campaignId);
  });

  const source = (
    <div className="fs-request-source">
      <Avatar src={person.avatar_url ?? person.instagram?.avatar_url ?? null} name={name} size={64} square />
      <span style={{ minWidth: 0 }}>
        <span className="fs-t-task" style={{ display: "block" }}>{name}</span>
        <span className="fs-t-meta" style={{ display: "block" }}>@{person.username}{person.city ? ` · ${person.city}` : ""}</span>
        <span className="fs-t-meta" style={{ display: "block" }}>{[person.instagram?.status === "connected" ? `Instagram connected${person.instagram.followers != null ? ` · ${person.instagram.followers.toLocaleString()} followers` : ""}` : null, person.verification === "verified" ? "Verified creator" : "Creator not verified"].filter(Boolean).join(" · ")}</span>
      </span>
      {sample && (
        <span className="fs-request-sample">
          {VIDEO.test(sample.url) ? <video src={sample.url} muted playsInline preload="metadata" aria-label={sample.title} /> : <Img src={sample.url} alt={sample.title} />}
          <span className="fs-t-meta" style={{ display: "block", marginTop: 4 }}>{sample.title}</span>
        </span>
      )}
    </div>
  );

  if (sent) {
    return (
      <main className="fs-phone-main" id="main">
        <div className="fs-detail-top"><Link href={`/business/people/${person.username}`} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }}>Back to {name}</Link></div>
        <h1 className="fs-t-page" style={{ marginTop: 8 }}>Request sent</h1>
        <div className="fs-plane is-decision" style={{ marginTop: 16, maxWidth: 560 }}>
          <p className="fs-t-body">{name} has been told. <span className="fs-status is-waiting">Request sent</span> · Nothing is agreed until they accept. You are told when they answer, and {formatMoney(payCents)} leaves your credit only when you approve their work.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
            <Link href={`/business/campaigns/${sent}`} className="fs-btn fs-btn-primary">Open the request</Link>
            <Link href="/business" className="fs-btn fs-btn-quiet fs-link-ink">Find more people</Link>
          </div>
        </div>
      </main>
    );
  }

  const last = index === steps.length - 1;
  return (
    <FlowShell
      title={story ? "Request a Story" : "Request a Reel"} kind={businessName} back={{ href: `/business/people/${person.username}`, label: name }}
      steps={steps} index={index} onJump={setIndex} error={error} pending={pending} review={last} source={source}
      canContinue={valid[index]} continueLabel={last ? `Send the request` : "Continue"}
      onContinue={() => { if (last) send(); else setIndex(index + 1); }} onBack={() => setIndex(index - 1)}
    >
      {story && index === 0 && (
        <>
          <p className="fs-t-body">The finished 9:16 creative {name} posts as it is.</p>
          <div style={{ marginTop: 12 }}><FsUploader folder="campaigns" accept="image/*,video/*" label={creativeUrl ? "Replace the creative" : "Upload the creative"} onUploaded={(u) => setCreativeUrl(u[0])} id="fs-req-creative" primary={!creativeUrl} /></div>
          {creativeUrl && <div style={{ marginTop: 12 }}>{VIDEO.test(creativeUrl) ? <video className="fs-media fs-flow-story" src={creativeUrl} controls muted playsInline /> : <Img className="fs-media fs-flow-story" src={creativeUrl} alt="Your Story creative" />}</div>}
          {creatives.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p className="fs-t-label">Or a creative you used before</p>
              <ChoiceRows name="prior" value={creatives.find((c) => c.url === creativeUrl)?.id ?? null} onChange={(id) => { const c = creatives.find((x) => x.id === id); if (c) setCreativeUrl(c.url); }}
                options={creatives.map((c) => ({ value: c.id, label: c.title, media: <span className="fs-media fs-choice-story"><Img src={c.url} alt="" /></span> }))} />
            </div>
          )}
        </>
      )}
      {story && index === 1 && (
        <ChoiceRows name="live" value={liveHours} onChange={setLiveHours} options={[{ value: "12", label: "12 hours" }, { value: "24", label: "24 hours", detail: "A full Story" }, { value: "48", label: "48 hours" }]} />
      )}
      {story && index === 2 && (
        <>
          <p className="fs-t-body">Paid from your campaign credit when you approve the proof. Not before, and not if they decline.</p>
          <Presets values={[25, 40, 60]} current={pay} onPick={setPay} money />
          <Field id="fs-req-pay" label="Or another amount"><DollarInput id="fs-req-pay" value={pay} onChange={setPay} min={5} max={1000} /></Field>
        </>
      )}
      {!story && index === 0 && (
        <>
          <p className="fs-t-body">The video {name} should recreate. A link, an upload, or neither if your brief says it all.</p>
          <Field id="fs-req-link" label="Reel link" error={link && !linkOk ? "The link must start with http." : null}><input id="fs-req-link" className="fs-input" inputMode="url" value={link} onChange={(e) => setLink(e.target.value.trim().slice(0, 500))} placeholder="https://www.instagram.com/reel/..." /></Field>
          <div style={{ marginTop: 12 }}><FsUploader folder="campaigns" accept="video/*,image/*" label={mediaUrl ? "Replace the upload" : "Or upload the reference"} onUploaded={(u) => setMediaUrl(u[0])} id="fs-req-ref" /></div>
          {mediaUrl && <p className="fs-t-meta" style={{ marginTop: 8 }}>Uploaded. It is shown to {name} with the request.</p>}
        </>
      )}
      {!story && index === 1 && (
        <>
          <Field id="fs-req-brief" label="Your brief" hint={draftNote ?? "A couple of sentences: what to show, what to say, what matters."}>
            <textarea id="fs-req-brief" className="fs-textarea" rows={5} maxLength={2000} value={brief} onChange={(e) => setBrief(e.target.value)} />
          </Field>
          <button type="button" className="fs-btn fs-btn-secondary" disabled={pending} onClick={draft}>Draft it for me</button>
          <p className="fs-t-meta" style={{ marginTop: 8 }}>{name} gets numbered steps built from this brief.</p>
        </>
      )}
      {!story && index === 2 && (
        <>
          <p className="fs-t-body">Paid from your campaign credit when you approve the video. Not before, and not if they decline.</p>
          <Presets values={[50, 75, 100, 150]} current={pay} onPick={setPay} money />
          <Field id="fs-req-pay" label="Or another amount"><DollarInput id="fs-req-pay" value={pay} onChange={setPay} min={5} max={5000} /></Field>
        </>
      )}
      {!story && index === 3 && (
        <Field id="fs-req-deadline" label="Last day to submit"><input id="fs-req-deadline" type="date" className="fs-input" value={deadline} min={todayPlus(1)} onChange={(e) => setDeadline(e.target.value)} style={{ maxWidth: 220 }} /></Field>
      )}
      {((story && index === 3) || (!story && index === 4)) && (
        <Field id="fs-req-message" label="Optional. They see it with the request." hint={`${300 - message.length} characters left`}>
          <textarea id="fs-req-message" className="fs-textarea" rows={3} maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Hi ${name.split(" ")[0]}, we loved your ${sample ? "work" : "profile"}.`} />
        </Field>
      )}
      {((story && index === 4) || (!story && index === 5)) && (
        <FundingPlane payCents={payCents} spots={1} unit={story ? "Story" : "approved video"} funding={funding} extra={!fs.canPublish ? <p className="fs-t-meta" style={{ marginTop: 8 }}>A request needs credit for its one payment before it can be sent.</p> : undefined} />
      )}
      {last && (
        <>
          <Facts rows={story
            ? [["To", `${name} · @${person.username}`], ["Creative", creativeUrl ? "Added" : "Missing"], ["Stays live", `${liveHours} hours`], ["Pay", `${formatMoney(payCents)} for the Story`], ["Note", message || "None"]]
            : [["To", `${name} · @${person.username}`], ["Reference", mediaUrl ? "Uploaded" : link ? "Linked" : "Brief only"], ["Pay", `${formatMoney(payCents)} for the approved video`], ["Last day", dayWord(deadline)], ["Note", message || "None"]]} />
          <p className="fs-t-body" style={{ marginTop: 16 }}>{name} can accept or decline. Nothing is agreed until they accept, and credit leaves only when you approve their work.</p>
        </>
      )}
    </FlowShell>
  );
}
