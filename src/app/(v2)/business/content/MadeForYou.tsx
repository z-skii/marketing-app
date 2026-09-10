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
 * The files a verified creator delivered and the business has not put on
 * the calendar yet: a horizontal rail of thumbnails, each opening a sheet
 * where the business approves it, asks for an edit, or schedules it.
 */

const FORMATS: { key: DeliverableFormat; label: string }[] = [
  { key: "reel", label: "Reel" }, { key: "photo", label: "Photo" }, { key: "story", label: "Story" },
];

type Result = { ok: boolean; error?: string };

export function MadeForYou({
  items, uploader, defaultSlot, timeZoneLabel,
}: {
  items: Deliverable[];
  uploader: { name: string; verified: boolean } | null;
  defaultSlot: { date: string; time: string };
  timeZoneLabel: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [justApproved, setJustApproved] = useState<string | null>(null);
  const open = items.find((d) => d.id === openId) ?? null;

  return (
    <div>
      <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 md:-mx-8 md:px-8 [scrollbar-width:none]" aria-label="Delivered files">
        {items.map((d, i) => (
          <li key={d.id} className="reveal w-36 shrink-0 snap-start md:w-44" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
            <button
              type="button"
              onClick={() => setOpenId(d.id)}
              aria-label={`${d.kind === "video" ? "Video" : "Photo"}, ${deliverableStatusLabel(d.status, d.edit_note)}`}
              className="relative block aspect-[4/5] w-full overflow-hidden rounded-[10px] bg-surface-2 text-left"
            >
              <MediaPreview src={d.url} poster={d.thumbnail_url} alt="" className="h-full w-full object-cover" sizes="176px" />
              <span className={`glass-tag absolute top-1.5 left-1.5 ${justApproved === d.id ? "pop" : ""}`}>
                <Chip tone={deliverableStatusTone(d.status, d.edit_note)}>{deliverableStatusLabel(d.status, d.edit_note)}</Chip>
              </span>
              {d.kind === "video" && (
                <span className="glass-tag absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full text-ink" aria-hidden>
                  <Play size={14} weight="fill" />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {uploader && (
        <p className="mt-2 text-sm text-ink-soft">
          Uploaded by <span className="font-600 text-ink">{uploader.name}</span>
          {uploader.verified && (
            <>
              {" "}<CheckCircle size={16} weight="fill" className="inline-block align-[-3px] text-signal" aria-hidden />
              {" "}Verified TapMart Creator
            </>
          )}
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

/** One file, full size, with what the business can do with it. */
function PreviewSheet({
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
