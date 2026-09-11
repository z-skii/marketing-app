"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Play, X } from "@phosphor-icons/react";
import { Chip } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import type { Deliverable, DeliverableFormat } from "@/lib/business/deliverables";
import {
  approveDeliverableAction, rejectDeliverableAction, requestEditAction, scheduleDeliverableAction,
} from "./schedule-actions";
import { dayLabel } from "./dates";
import { deliverableStatusLabel, deliverableStatusTone } from "./types";

/**
 * Made for you: the files a verified creator delivered that still need a
 * decision. Each is a card (media, state, headline, one action) that opens
 * the review sheet, where the business approves, schedules, asks for an
 * edit, or skips the file. Designed by OpenAI in
 * docs/design-specs/business-content.md.
 */

const FORMATS: { key: DeliverableFormat; label: string }[] = [
  { key: "reel", label: "Reel" }, { key: "photo", label: "Photo" }, { key: "story", label: "Story" },
];

type Result = { ok: boolean; error?: string };
type Slot = { date: string; time: string };

function headline(d: Deliverable): string {
  if (d.caption) return d.caption;
  const kind = d.kind === "video" ? "Video" : "Photo";
  return d.shoot_date ? `${kind} from the ${dayLabel(d.shoot_date, { weekday: false })} shoot` : `${kind} from your shoot`;
}

export function MadeForYou({
  items, uploader, defaultSlot, timeZoneLabel,
}: {
  items: Deliverable[];
  uploader: { name: string; verified: boolean } | null;
  defaultSlot: Slot;
  timeZoneLabel: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState<string | null>(null);
  const open = items.find((d) => d.id === openId) ?? null;

  return (
    <div>
      <ul className="flex flex-col gap-3.5 rail:grid rail:grid-cols-2" aria-label="Files to review">
        {items.map((d, i) => {
          const isNew = d.status === "new";
          const state = deliverableStatusLabel(d.status, d.edit_note);
          const tone = isNew && !d.edit_note ? "is-review" : d.edit_note ? "is-error" : "";
          return (
            <li key={d.id} className="reveal" style={{ animationDelay: `${Math.min(i, 4) * 35}ms` }}>
              <article className={`card overflow-hidden ${justApproved === d.id ? "pop" : ""}`}>
                <button type="button" onClick={() => setOpenId(d.id)} aria-label={`Open ${d.kind === "video" ? "video" : "photo"}, ${state}`} className="relative block h-[224px] w-full bg-surface-2 text-left rail:h-[243px]">
                  <MediaPreview src={d.url} poster={d.thumbnail_url} alt="" className="h-full w-full object-cover" sizes="(min-width: 768px) 389px, 100vw" />
                  <span className="absolute inset-x-0 top-0 h-[72px]" style={{ background: "var(--tm-scrim-top)" }} aria-hidden />
                  <span className={`status-text absolute top-3.5 left-3.5 h-6 rounded-full bg-black/35 px-2.5 ${tone}`}><span aria-hidden className="status-dot" />{isNew ? "Review" : "Ready"}</span>
                  {d.kind === "video" && (
                    <span className="glass absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-ink" aria-hidden>
                      <Play size={20} weight="fill" />
                    </span>
                  )}
                </button>
                <div className="p-3.5">
                  <p className="line-clamp-2 font-display text-[15px] leading-[19px] font-[740] tracking-[-0.15px]">{headline(d)}</p>
                  <p className="mt-1.5 text-[12px] leading-4 text-ink-soft">{state}{uploader ? ` · ${uploader.name}` : ""}</p>
                  <button type="button" onClick={() => setOpenId(d.id)} className="btn btn-signal shadow-none mt-3.5 w-full">
                    {isNew ? "Review file" : "Schedule"}
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      {uploader?.verified && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[12px] leading-4 text-ink-soft">
          <CheckCircle size={16} weight="fill" className="text-signal" aria-hidden />
          {uploader.name} is a verified TapMart creator
        </p>
      )}

      {open && (
        <PreviewSheet
          item={open}
          defaultSlot={defaultSlot}
          timeZoneLabel={timeZoneLabel}
          onClose={() => setOpenId(null)}
          onApproved={(id) => { setJustApproved(id); setOpenId(null); }}
        />
      )}
    </div>
  );
}

/**
 * Delivered files from the latest shoot as bare media tiles: the media is
 * the content, so there is no card chrome. A tile opens the same preview.
 */
export function DeliveredGrid({ items, defaultSlot, timeZoneLabel }: { items: Deliverable[]; defaultSlot: Slot; timeZoneLabel: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = items.find((d) => d.id === openId) ?? null;
  const single = items.length === 1;

  return (
    <div>
      <ul className={single ? "grid grid-cols-1 rail:max-w-[520px]" : "grid grid-cols-2 gap-x-3.5 gap-y-4 rail:grid-cols-3 rail:gap-x-[15px] rail:gap-y-[18px]"} aria-label="Delivered files">
        {items.map((d, i) => {
          const kind = d.kind === "video" ? "Video" : "Photo";
          const date = d.shoot_date ? dayLabel(d.shoot_date, { weekday: false }) : null;
          return (
            <li key={d.id} className="reveal" style={{ animationDelay: `${Math.min(i, 4) * 35}ms` }}>
              <button type="button" onClick={() => setOpenId(d.id)} aria-label={`Open ${kind.toLowerCase()}${date ? ` from the ${date} shoot` : ""}`} className="block w-full text-left">
                <span className={`relative block w-full overflow-hidden bg-surface-2 ${single ? "aspect-[358/224] rounded-[20px]" : "aspect-[172/108] rounded-[16px]"}`}>
                  <MediaPreview src={d.url} poster={d.thumbnail_url} alt="" className="h-full w-full object-cover" sizes={single ? "(min-width: 768px) 520px, 100vw" : "(min-width: 768px) 254px, 50vw"} />
                  <span className="glass-tag is-glass absolute top-2 left-2">{kind}</span>
                  {d.kind === "video" && (
                    <span className="glass absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-ink" aria-hidden>
                      <Play size={20} weight="fill" />
                    </span>
                  )}
                  {single && (
                    <>
                      <span className="media-scrim absolute inset-0" aria-hidden />
                      <span className="absolute inset-x-3.5 bottom-3.5 line-clamp-2 font-display text-[15px] leading-[19px] font-[740]">{headline(d)}</span>
                    </>
                  )}
                </span>
                {!single && (
                  <>
                    <span className={`mt-2 line-clamp-2 block text-[13px] leading-[17px] font-600 ${d.caption ? "" : "text-ink-2"}`}>{d.caption ?? `${kind}${date ? ` · ${date} shoot` : ""}`}</span>
                    {d.caption && date && <span className="mt-1 block text-[11px] leading-[14px] font-[550] text-ink-faint">{date} shoot</span>}
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {open && <PreviewSheet item={open} defaultSlot={defaultSlot} timeZoneLabel={timeZoneLabel} onClose={() => setOpenId(null)} onApproved={() => setOpenId(null)} />}
    </div>
  );
}

/** One file, full size, with what the business can do with it. */
export function PreviewSheet({
  item, defaultSlot, timeZoneLabel, onClose, onApproved,
}: {
  item: Deliverable;
  defaultSlot: { date: string; time: string };
  timeZoneLabel: string;
  onClose: () => void;
  onApproved: (id: string) => void;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<"schedule" | "edit" | null>(null);
  const [date, setDate] = useState(defaultSlot.date);
  const [time, setTime] = useState(defaultSlot.time);
  const [format, setFormat] = useState<DeliverableFormat>(item.kind === "video" ? "reel" : "photo");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  const run = (work: () => Promise<Result>, after?: () => void) => {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) { setError(result.error ?? "Something went wrong."); return; }
      router.refresh();
      (after ?? onClose)();
    });
  };

  const isNew = item.status === "new";
  const fromShoot = item.shoot_date ? `From the ${dayLabel(item.shoot_date, { weekday: false })} shoot` : "From your shoot";

  return (
    <div role="dialog" aria-modal="true" aria-label={`${item.kind === "video" ? "Video" : "Photo"} preview`} className="glass fixed inset-0 z-50 flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-display text-[1.0625rem] font-600">{fromShoot}</p>
          <Chip tone={deliverableStatusTone(item.status, item.edit_note)}>{deliverableStatusLabel(item.status, item.edit_note)}</Chip>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink">
          <X size={22} aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto w-full max-w-lg">
          <div className="overflow-hidden rounded-[14px] bg-paper-deep">
            {item.kind === "video" ? (
              <video src={item.url} poster={item.thumbnail_url ?? undefined} controls muted autoPlay playsInline loop className="mx-auto max-h-[60vh] w-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt="" className="mx-auto max-h-[60vh] w-full object-contain" />
            )}
          </div>
          {item.caption && <p className="mt-3 text-sm whitespace-pre-wrap text-ink-soft">{item.caption}</p>}
          {item.edit_note && (
            <p className="mt-3 text-sm text-ink-soft"><span className="font-600 text-ink">Edit requested:</span> {item.edit_note}</p>
          )}

          {error && <p role="alert" className="mt-3 text-sm alert-text">{error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isNew && (
              <button
                type="button" disabled={pending} className="btn btn-signal"
                onClick={() => run(() => approveDeliverableAction(item.id), () => onApproved(item.id))}
              >
                <CheckCircle size={18} weight="fill" aria-hidden />Approve
              </button>
            )}
            <button
              type="button" disabled={pending} className={`btn ${isNew ? "" : "btn-signal"}`}
              aria-expanded={panel === "schedule"} onClick={() => setPanel(panel === "schedule" ? null : "schedule")}
            >
              Schedule
            </button>
            {isNew && (
              <button type="button" disabled={pending} className="btn btn-ghost" aria-expanded={panel === "edit"} onClick={() => setPanel(panel === "edit" ? null : "edit")}>
                Request edit
              </button>
            )}
            {isNew && (
              <button type="button" disabled={pending} className="btn btn-ghost ml-auto" onClick={() => run(() => rejectDeliverableAction(item.id))}>
                Skip this one
              </button>
            )}
          </div>

          {panel === "schedule" && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="label block">Date</span>
                  <input type="date" className="field mt-1" value={date} min={defaultSlot.date} onChange={(e) => setDate(e.target.value)} />
                </label>
                <label className="block">
                  <span className="label block">Time</span>
                  <input type="time" className="field mt-1" value={time} onChange={(e) => setTime(e.target.value)} />
                </label>
              </div>
              <p className="mt-1.5 text-xs text-ink-faint">Instagram · {timeZoneLabel}</p>
              <div className="pill-row mt-3" role="radiogroup" aria-label="Format">
                {FORMATS.map((f) => (
                  <button key={f.key} type="button" role="radio" aria-checked={format === f.key} aria-pressed={format === f.key} className="pill" onClick={() => setFormat(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button" disabled={pending || !date || !time} className="btn"
                  onClick={() => run(() => scheduleDeliverableAction(item.id, `${date}T${time}`, "instagram", format))}
                >
                  {pending ? "Scheduling" : "Put it on the calendar"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setPanel(null)}>Cancel</button>
              </div>
            </div>
          )}

          {panel === "edit" && (
            <div className="mt-4">
              <label className="block">
                <span className="label block">What should change</span>
                <textarea className="field mt-1 min-h-24" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Crop tighter on the cup, warmer colours" />
              </label>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" disabled={pending || !note.trim()} className="btn" onClick={() => run(() => requestEditAction(item.id, note))}>
                  {pending ? "Sending" : "Send to the creator"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setPanel(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
