"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Play, UploadSimple } from "@phosphor-icons/react";
import { Chip } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { readVideoMeta, uploadWithProgress } from "@/lib/client/media-meta";
import type { Deliverable } from "@/lib/business/deliverables";
import { deliverableStatusLabel, deliverableStatusTone } from "@/app/(v2)/business/content/types";
import { finishDeliveryAction, uploadDeliverableAction } from "../actions";

/**
 * Multi-file upload for a shoot with real per-file progress. Each file is
 * stored, then recorded as a deliverable (the server checks the uploader
 * again). Videos get a poster frame captured on the device. When the set
 * is complete the creator marks the shoot delivered.
 */

type Progress = { name: string; pct: number; error?: string };

const MAX_FILES = 40;

function dataUrlToFile(dataUrl: string, name: string): File | null {
  const [head, body] = dataUrl.split(",");
  if (!head || !body) return null;
  const mime = /data:(.*?);/.exec(head)?.[1] ?? "image/jpeg";
  const bytes = atob(body);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], name, { type: mime });
}

export function ShootUploader({ shootId, initial, delivered }: { shootId: string; initial: Deliverable[]; delivered: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Deliverable[]>(initial);
  const [queue, setQueue] = useState<Progress[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const photos = items.filter((d) => d.kind === "photo").length;
  const videos = items.length - photos;

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list).slice(0, MAX_FILES);
    setError(null);
    setBusy(true);
    setQueue(files.map((f) => ({ name: f.name, pct: 0 })));
    const update = (i: number, patch: Partial<Progress>) =>
      setQueue((q) => q.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const isVideo = file.type.startsWith("video/");
        const url = await uploadWithProgress(file, "submissions", (pct) => update(i, { pct }));
        let thumbnailUrl: string | null = null;
        if (isVideo) {
          const meta = await readVideoMeta(file, 1).catch(() => null);
          const frame = meta?.frames?.[0] ? dataUrlToFile(meta.frames[0], "poster.jpg") : null;
          if (frame) thumbnailUrl = await uploadWithProgress(frame, "submissions", () => {}).catch(() => null);
        }
        const result = await uploadDeliverableAction(shootId, { url, kind: isVideo ? "video" : "photo", thumbnailUrl });
        if (!result.ok) { update(i, { error: result.error }); continue; }
        if (result.data) setItems((prev) => [...prev, result.data as Deliverable]);
        update(i, { pct: 100 });
      } catch (e) {
        update(i, { error: e instanceof Error ? e.message : "Upload failed." });
      }
    }
    setBusy(false);
    setQueue((q) => q.filter((p) => p.error));
    if (input.current) input.current.value = "";
    router.refresh();
  };

  return (
    <div>
      {items.length === 0 && queue.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">Nothing uploaded yet. Add the photos and videos from the shoot.</p>
      ) : (
        <p className="tnum mt-2 text-sm text-ink-soft">
          {[photos > 0 && `${photos} ${photos === 1 ? "photo" : "photos"}`, videos > 0 && `${videos} ${videos === 1 ? "video" : "videos"}`].filter(Boolean).join(" · ") || "Uploading"}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-1" aria-label="Uploaded files">
          {items.map((d, i) => (
            <li key={d.id} className="reveal relative aspect-square overflow-hidden rounded-[10px] bg-surface-2" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
              <MediaPreview src={d.url} poster={d.thumbnail_url} alt="" className="h-full w-full object-cover" sizes="(min-width: 768px) 224px, 33vw" />
              <span className="glass-tag absolute top-1.5 left-1.5">
                <Chip tone={deliverableStatusTone(d.status, d.edit_note)}>{deliverableStatusLabel(d.status, d.edit_note)}</Chip>
              </span>
              {d.kind === "video" && (
                <span className="glass-tag absolute bottom-1.5 left-1.5 flex h-7 w-7 items-center justify-center rounded-full text-ink" aria-hidden>
                  <Play size={14} weight="fill" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.some((d) => d.edit_note) && (
        <ul className="mt-3 divide-y divide-rule" aria-label="Edit requests">
          {items.filter((d) => d.edit_note).map((d) => (
            <li key={d.id} className="flex gap-3 py-3">
              <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-surface-2">
                <MediaPreview src={d.thumbnail_url ?? d.url} alt="" className="h-full w-full object-cover" sizes="48px" />
              </span>
              <p className="min-w-0 text-sm text-ink-soft"><span className="font-600 text-ink">Edit requested:</span> {d.edit_note}</p>
            </li>
          ))}
        </ul>
      )}

      {queue.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Uploads in progress">
          {queue.map((p, i) => (
            <li key={`${p.name}-${i}`}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-ink-soft">{p.name}</span>
                <span className={`tnum shrink-0 ${p.error ? "alert-text" : "text-ink-faint"}`}>{p.error ? "Failed" : `${p.pct}%`}</span>
              </div>
              {p.error ? (
                <p role="alert" className="mt-1 text-sm alert-text">{p.error}</p>
              ) : (
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={p.pct} aria-valuemin={0} aria-valuemax={100} aria-label={p.name}>
                  <div className="h-1 rounded-full bg-signal transition-all" style={{ width: `${p.pct}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p role="alert" className="mt-3 text-sm alert-text">{error}</p>}

      <input
        ref={input} id="shoot-files" type="file" accept="image/*,video/*" multiple className="sr-only"
        onChange={(e) => handleFiles(e.target.files)} disabled={busy}
      />
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <label htmlFor="shoot-files" className={`btn ${delivered ? "" : "btn-signal"} cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
          <UploadSimple size={18} weight="bold" aria-hidden />
          {busy ? "Uploading" : items.length === 0 ? "Upload photos and videos" : "Add more"}
        </label>
        {!delivered && (
          <button
            type="button" disabled={pending || busy || items.length === 0} className="btn"
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const r = await finishDeliveryAction(shootId);
                if (!r.ok) setError(r.error);
                else router.refresh();
              });
            }}
          >
            <CheckCircle size={18} weight="fill" aria-hidden />
            {pending ? "Saving" : "Mark delivered"}
          </button>
        )}
      </div>
      {!delivered && items.length > 0 && (
        <p className="mt-2 text-sm text-ink-faint">Mark delivered when the whole set is up. The business is told once.</p>
      )}
    </div>
  );
}
