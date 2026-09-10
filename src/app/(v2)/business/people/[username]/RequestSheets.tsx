"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretRight, CheckCircle, X } from "@phosphor-icons/react";
import { Uploader } from "@/components/v2/Uploader";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { draftReelBrief, sendReelRequest, sendStoryRequest } from "../actions";

/**
 * The two direct requests a business can send to one person. Buttons on the
 * profile open a bottom sheet (a centered panel on wide screens); sending
 * creates the campaign and the invite, then a small confirmation replaces
 * the button with "sent, waiting".
 */

export type RequestKind = "story" | "reel";
export type ExistingInvite = { kind: "instagram_story" | "recreate_reel" | "car_ads"; status: string; campaign_id: string };
export type Creative = { id: string; title: string; url: string };

const LABEL = "text-sm text-ink-soft";

function plusDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function RequestSheets({
  profileId, name, businessName, invites, storyCreatives, initial,
}: {
  profileId: string; name: string; businessName: string;
  invites: ExistingInvite[]; storyCreatives: Creative[]; initial: RequestKind | null;
}) {
  const router = useRouter();
  const latest = (kind: ExistingInvite["kind"]) => invites.find((i) => i.kind === kind) ?? null;
  const pending = (k: RequestKind) => {
    const inv = latest(k === "story" ? "instagram_story" : "recreate_reel");
    return inv && (inv.status === "sent" || inv.status === "accepted") ? inv : null;
  };
  // A link with ?request= only opens the sheet when nothing is already waiting.
  const [open, setOpen] = useState<RequestKind | null>(initial && !pending(initial) ? initial : null);
  const [sent, setSent] = useState<Partial<Record<RequestKind, string>>>({});
  const state = (k: RequestKind) => (sent[k] ? { status: "sent", campaign_id: sent[k]! } : pending(k));

  const close = () => {
    setOpen(null);
    // Drop ?request= so a refresh does not reopen the sheet.
    if (typeof window !== "undefined" && window.location.search.includes("request=")) router.replace(window.location.pathname);
  };
  const done = (kind: RequestKind, campaignId: string) => {
    setSent((s) => ({ ...s, [kind]: campaignId }));
    setOpen(null);
    router.refresh();
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <Action kind="story" label="Request Story" existing={state("story")} onOpen={() => setOpen("story")} justSent={Boolean(sent.story)} />
        <Action kind="reel" label="Request Reel" existing={state("reel")} onOpen={() => setOpen("reel")} justSent={Boolean(sent.reel)} />
      </div>
      {(sent.story || sent.reel) && (
        <p className="pop mt-3 flex items-center gap-2 text-sm">
          <CheckCircle size={20} weight="fill" className="text-signal" aria-hidden />
          <span>Request sent. {name} gets a notification.</span>
          <Link href={`/business/campaigns/${sent.story ?? sent.reel}`} className="link-row ml-auto !min-h-0 text-sm">Open<CaretRight size={14} aria-hidden /></Link>
        </p>
      )}

      {open === "story" && <StorySheet profileId={profileId} name={name} businessName={businessName} creatives={storyCreatives} onClose={close} onSent={(id) => done("story", id)} />}
      {open === "reel" && <ReelSheet profileId={profileId} name={name} onClose={close} onSent={(id) => done("reel", id)} />}
    </div>
  );
}

function Action({ kind, label, existing, onOpen, justSent }: { kind: RequestKind; label: string; existing: { status: string; campaign_id: string } | null; onOpen: () => void; justSent: boolean }) {
  if (existing) {
    const word = kind === "story" ? "Story" : "Reel";
    return (
      <Link href={`/business/campaigns/${existing.campaign_id}`} className={`btn justify-between !px-3 text-left ${justSent ? "pop" : ""}`} aria-label={`${word} request ${existing.status}, open campaign`}>
        <span className="min-w-0 truncate text-sm">
          {word} request {existing.status === "accepted" ? "accepted" : "sent"}
          <span className="block text-xs font-500 text-ink-faint">{existing.status === "accepted" ? "Open the campaign" : "Waiting for an answer"}</span>
        </span>
        <CaretRight size={16} aria-hidden />
      </Link>
    );
  }
  return <button type="button" className="btn" onClick={onOpen}>{label}</button>;
}

// -------------------------------------------------------------------- sheet

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-paper-deep/70" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="glass spot-in relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[var(--radius-sheet)] border px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:max-w-lg md:rounded-[var(--radius-sheet)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[1.375rem] font-800 tracking-[-0.02em]">{title}</h2>
          <button type="button" aria-label="Close" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink-soft can-hover:hover:text-ink" onClick={onClose}><X size={22} aria-hidden /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PayField({ value, onChange, min, hint }: { value: string; onChange: (v: string) => void; min: number; hint: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL}>Pay</span>
      <span className="flex items-center gap-3">
        <span className="font-display text-[1.75rem] font-800 tracking-[-0.03em] text-signal" aria-hidden>$</span>
        <input className="field flex-1 text-lg" inputMode="decimal" type="number" min={min} step="1" value={value} aria-label="Pay in dollars" onChange={(e) => onChange(e.target.value)} />
        <span className="text-sm whitespace-nowrap text-ink-soft">{hint}</span>
      </span>
    </label>
  );
}

// -------------------------------------------------------------------- story

function StorySheet({ profileId, name, businessName, creatives, onClose, onSent }: {
  profileId: string; name: string; businessName: string; creatives: Creative[]; onClose: () => void; onSent: (campaignId: string) => void;
}) {
  const [pay, setPay] = useState("40");
  const [creative, setCreative] = useState(creatives[0]?.url ?? "");
  const [hours, setHours] = useState(24);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const canSend = Number(pay) >= 5 && Boolean(creative) && !pending;

  const submit = () => start(async () => {
    setError(null);
    const r = await sendStoryRequest({ profileId, payDollars: Number(pay), creativeUrl: creative, liveHours: hours, message });
    if (!r.ok) { setError(r.error); return; }
    onSent(r.campaignId);
  });

  return (
    <Sheet title={`Story request to ${name}`} onClose={onClose}>
      <form className="mt-4 flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); if (canSend) submit(); }}>
        <PayField value={pay} onChange={setPay} min={5} hint="per Story" />

        <div>
          <p className={LABEL}>Story creative</p>
          <div className="mt-1.5 flex items-start gap-3">
            <div className="relative aspect-[9/16] w-20 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
              {creative ? (
                <MediaPreview src={creative} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-xs text-ink-faint">9:16</span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Uploader id="story-creative" folder="campaigns" accept="image/*,video/*" label={creative ? "Replace" : "Upload creative"} onUploaded={(u) => setCreative(u[0])} />
              {creatives.length > 0 && (
                <div>
                  <p className="text-xs text-ink-faint">From your campaigns</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {creatives.map((c) => (
                      <button key={c.id} type="button" title={c.title} aria-pressed={c.url === creative} className={`overflow-hidden rounded-[8px] p-0.5 ${c.url === creative ? "bg-signal" : "bg-surface-2"}`} onClick={() => setCreative(c.url)}>
                        <MediaPreview src={c.url} className="h-14 w-8 rounded-[5px] object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Live for</span>
          <select className="field" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
            <option value={12}>12 hours</option>
            <option value={24}>24 hours</option>
            <option value={48}>48 hours</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Message <span className="text-ink-faint">(optional)</span></span>
          <textarea className="field min-h-20" maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Hi ${name}, ${businessName} would love a Story from you.`} />
          <span className="tnum text-right text-xs text-ink-faint">{message.length} / 300</span>
        </label>

        {error && <p role="alert" className="text-sm alert-text">{error}</p>}
        <button type="submit" className="btn btn-signal btn-lg" disabled={!canSend}>{pending ? "Sending" : "Send request"}</button>
      </form>
    </Sheet>
  );
}

// --------------------------------------------------------------------- reel

function ReelSheet({ profileId, name, onClose, onSent }: {
  profileId: string; name: string; onClose: () => void; onSent: (campaignId: string) => void;
}) {
  const [referenceUrl, setReferenceUrl] = useState("");
  const [media, setMedia] = useState("");
  const [pay, setPay] = useState("75");
  const [deadline, setDeadline] = useState(() => plusDays(7));
  const [brief, setBrief] = useState("");
  const [briefSource, setBriefSource] = useState<"ai" | "template" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [drafting, startDraft] = useTransition();
  const canSend = Number(pay) >= 5 && brief.trim().length >= 20 && !pending;

  const draft = () => startDraft(async () => {
    setError(null);
    const r = await draftReelBrief({ referenceUrl, referenceMediaUrl: media });
    if (!r.ok) { setError(r.error); return; }
    setBrief(r.text);
    setBriefSource(r.source);
  });

  const submit = () => start(async () => {
    setError(null);
    const r = await sendReelRequest({ profileId, payDollars: Number(pay), referenceUrl, referenceMediaUrl: media, deadline, brief, message });
    if (!r.ok) { setError(r.error); return; }
    onSent(r.campaignId);
  });

  return (
    <Sheet title={`Reel request to ${name}`} onClose={onClose}>
      <form className="mt-4 flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); if (canSend) submit(); }}>
        <div>
          <p className={LABEL}>Reference Reel <span className="text-ink-faint">(optional)</span></p>
          <div className="mt-1.5 flex items-start gap-3">
            <div className="relative aspect-[9/16] w-20 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
              {media ? (
                <MediaPreview src={media} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-xs text-ink-faint">9:16</span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <input className="field" type="url" inputMode="url" placeholder="https://www.instagram.com/reel/..." value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} aria-label="Reference link" />
              <Uploader id="reel-reference" folder="campaigns" accept="video/*,image/*" label={media ? "Replace upload" : "Upload a video"} onUploaded={(u) => setMedia(u[0])} />
            </div>
          </div>
        </div>

        <PayField value={pay} onChange={setPay} min={5} hint="per approved video" />

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Deadline</span>
          <input className="field" type="date" value={deadline} min={plusDays(1)} suppressHydrationWarning onChange={(e) => setDeadline(e.target.value)} />
        </label>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="reel-brief" className={LABEL}>What you want</label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={draft} disabled={drafting}>{drafting ? "Writing" : "Draft it for me"}</button>
          </div>
          <textarea id="reel-brief" className="field min-h-28" maxLength={2000} value={brief} onChange={(e) => { setBrief(e.target.value); setBriefSource(null); }} placeholder="Two or three sentences: what to show, what to say, how long." />
          <span className="flex justify-between text-xs text-ink-faint">
            <span>{briefSource === "ai" ? "Draft written by AI. Edit anything." : briefSource === "template" ? "Template draft, no AI key set. Edit anything." : ""}</span>
            <span className="tnum">{brief.trim().length < 20 ? `${20 - brief.trim().length} more characters` : ""}</span>
          </span>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={LABEL}>Message <span className="text-ink-faint">(optional)</span></span>
          <textarea className="field min-h-16" maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Hi ${name}, we would love you to recreate this.`} />
        </label>

        {error && <p role="alert" className="text-sm alert-text">{error}</p>}
        <button type="submit" className="btn btn-signal btn-lg" disabled={!canSend}>{pending ? "Sending" : "Send request"}</button>
      </form>
    </Sheet>
  );
}
