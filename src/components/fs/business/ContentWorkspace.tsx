"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VideoCamera } from "@phosphor-icons/react";
import type { Deliverable, DeliverableFormat } from "@/lib/business/deliverables";
import {
  approveDeliverableAction, markPublishedAction, rejectDeliverableAction, requestEditAction, scheduleDeliverableAction,
} from "@/app/(v2)/business/content/schedule-actions";

/**
 * The media-to-decision edge, in Frame Shift: a graphite stage holding the
 * selected original at its native ratio, a filmstrip of the other real
 * files, and one white inspector with the file state, provenance, caption,
 * the separate post state, and only the actions the record allows now.
 * Content approval is never publication and never money.
 */
export type PostInfo = { status: string; when: string | null; platform: string; format: string | null };
export type WorkspaceFile = Deliverable & { post: PostInfo | null };

const FILE_STATE: Record<string, { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral" }> = {
  new: { label: "New", tone: "waiting" },
  approved: { label: "Approved", tone: "confirmed" },
  rejected: { label: "Set aside", tone: "neutral" },
  scheduled: { label: "Approved", tone: "confirmed" },
  published: { label: "Approved", tone: "confirmed" },
};
const PLATFORM: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", google_business: "Google", other: "Other" };
const FORMAT: Record<string, string> = { reel: "Reel", photo: "photo", story: "Story", post: "post" };
const FORMATS: { key: DeliverableFormat; label: string }[] = [{ key: "photo", label: "Photo" }, { key: "reel", label: "Reel" }, { key: "story", label: "Story" }];

export function fileTitle(f: Deliverable, index: number): string {
  const first = f.caption?.split("\n")[0].trim();
  if (first) return first.length > 48 ? `${first.slice(0, 47).trim()}…` : first;
  return `${f.kind === "video" ? "Video" : "Photo"} ${String(index + 1).padStart(2, "0")}`;
}

export function fileState(f: Deliverable) {
  if (f.status === "new" && f.edit_note) return { label: "Edit requested", tone: "waiting" as const };
  return FILE_STATE[f.status] ?? { label: f.status, tone: "neutral" as const };
}

export function postState(f: WorkspaceFile, timeZone: string): { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral"; detail: string | null } {
  const p = f.post;
  if (!p) return { label: "Not scheduled", tone: "neutral", detail: null };
  const when = p.when ? new Intl.DateTimeFormat("en-US", { timeZone, month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(p.when)) : null;
  const kind = `${PLATFORM[p.platform] ?? p.platform} ${FORMAT[p.format ?? ""] ?? p.format ?? "post"}`;
  if (p.status === "published") return { label: "Published", tone: "confirmed", detail: [when, kind].filter(Boolean).join(" · ") };
  if (p.status === "failed") return { label: "Post failed", tone: "problem", detail: kind };
  if (p.status === "scheduled") return { label: "Scheduled", tone: "waiting", detail: [when, kind].filter(Boolean).join(" · ") };
  return { label: p.status.replaceAll("_", " "), tone: "neutral", detail: kind };
}

type Result = { ok: boolean; error?: string };

export function ContentWorkspace({ files, timeZone, timeZoneLabel, defaultSlot, shootLabels }: {
  files: WorkspaceFile[]; timeZone: string; timeZoneLabel: string; defaultSlot: { date: string; time: string }; shootLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(files[0]?.id ?? null);
  const [panel, setPanel] = useState<"schedule" | "edit" | null>(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(defaultSlot.date);
  const [time, setTime] = useState(defaultSlot.time);
  const [format, setFormat] = useState<DeliverableFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [pending, start] = useTransition();
  const selected = files.find((f) => f.id === selectedId) ?? files[0];
  if (!selected) return null;
  const index = files.indexOf(selected);
  const state = fileState(selected);
  const post = postState(selected, timeZone);
  const fmt = format ?? (selected.kind === "video" ? "reel" : "photo");

  const run = (work: () => Promise<Result>) => {
    setError(null);
    start(async () => {
      const r = await work();
      if (!r.ok) { setError(r.error ?? "Something went wrong."); return; }
      setPanel(null); setNote("");
      setFlash(true); window.setTimeout(() => setFlash(false), 1200);
      router.refresh();
    });
  };
  const select = (id: string) => { setSelectedId(id); setPanel(null); setError(null); };

  return (
    <div className="fs-workspace">
      <div>
        <div className="fs-stage fs-on-dark" aria-label={`${fileTitle(selected, index)}, the original delivered file`}>
          {selected.kind === "video" ? (
            <video key={selected.id} src={selected.url} poster={selected.thumbnail_url ?? undefined} controls playsInline preload="metadata" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={selected.id} src={selected.url} alt={`${fileTitle(selected, index)}, the original delivered file`} className="fs-reveal" />
          )}
        </div>
        <ul className="fs-filmstrip" aria-label="Delivered files">
          {files.map((f, i) => {
            const st = fileState(f); const ps = postState(f, timeZone);
            return (
              <li key={f.id}>
                <button type="button" aria-pressed={f.id === selected.id} aria-label={`${fileTitle(f, i)}, ${st.label}`} onClick={() => select(f.id)}>
                  <span className="fs-film-thumb fs-media fs-contain">
                    {f.kind === "video" ? (
                      f.thumbnail_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={f.thumbnail_url} alt="" loading="lazy" />
                        : <span className="fs-video-fallback" style={{ padding: 4, fontSize: 12 }}><VideoCamera size={18} aria-hidden />Video</span>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} alt="" loading="lazy" />
                    )}
                  </span>
                  <span className="fs-t-meta fs-desk-only" style={{ display: "block", marginTop: 8, color: "var(--fs-ink)" }}>{fileTitle(f, i)}</span>
                  <span className="fs-t-meta fs-desk-only" style={{ display: "block" }}>{st.label}{ps.label !== "Not scheduled" && <> · <span className={`fs-status is-${ps.tone}`} style={{ fontWeight: 400 }}>Post {ps.label.toLowerCase().replace("post ", "")}</span></>}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="fs-t-meta fs-phone-only" style={{ marginTop: 8 }}>File {index + 1} of {files.length} · {fileTitle(selected, index)}</p>
      </div>

      <aside aria-label="Selected file" className={`fs-inspector${flash ? " is-flash" : ""}`}>
        <p className="fs-t-meta">File state · <span className={`fs-status is-${state.tone}`}>{state.label}</span></p>
        <h3 className="fs-t-section" style={{ marginTop: 4 }}>{fileTitle(selected, index)}</h3>
        <p className="fs-t-meta" style={{ marginTop: 8 }}>{shootLabels[selected.shoot_id] ?? "Shoot"}</p>
        <p className="fs-t-meta">{selected.uploader_name ? `Uploaded by ${selected.uploader_name}${selected.uploader_verified ? " · Verified creator" : ""}` : "Uploaded by the TapMart team"}</p>
        <p className="fs-t-meta">Delivered {selected.kind}</p>

        {selected.caption ? (
          <>
            <p className="fs-t-label" style={{ marginTop: 16 }}>Caption</p>
            <p className="fs-t-body" style={{ whiteSpace: "pre-wrap" }}>{selected.caption}</p>
          </>
        ) : <p className="fs-t-meta" style={{ marginTop: 16 }}>No caption supplied.</p>}
        {selected.edit_note && <p className="fs-t-meta fs-note" style={{ marginTop: 12 }}>Edit note · {selected.edit_note}</p>}
        <p className="fs-t-meta" style={{ marginTop: 12 }}>Post · <span className={`fs-status is-${post.tone}`}>{post.label}</span>{post.detail ? ` · ${post.detail}` : ""}</p>
        {post.label === "Scheduled" && <p className="fs-t-meta">Scheduling does not publish automatically. Post it, then mark it published.</p>}
        {post.label === "Post failed" && <Link href="/business/connections" className="fs-btn fs-btn-secondary fs-btn-sm" style={{ marginTop: 8 }}>Open Connections</Link>}

        {error && <p role="alert" className="fs-field-error" style={{ marginTop: 12 }}>{error}</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
          {(selected.status === "new" || selected.status === "rejected") && (
            <button type="button" className="fs-btn fs-btn-primary" disabled={pending} onClick={() => run(() => approveDeliverableAction(selected.id))}>{pending ? "Saving" : "Approve content"}</button>
          )}
          {selected.status === "approved" && (
            <button type="button" className="fs-btn fs-btn-primary" disabled={pending} aria-expanded={panel === "schedule"} onClick={() => setPanel(panel === "schedule" ? null : "schedule")}>Schedule</button>
          )}
          {selected.status === "scheduled" && post.label !== "Post failed" && (
            <button type="button" className="fs-btn fs-btn-primary" disabled={pending} onClick={() => run(() => markPublishedAction(selected.id))}>{pending ? "Saving" : "Mark published"}</button>
          )}
          {(selected.status === "new" || selected.status === "approved") && (
            <button type="button" className="fs-btn fs-btn-secondary" disabled={pending} aria-expanded={panel === "edit"} onClick={() => setPanel(panel === "edit" ? null : "edit")}>Request an edit</button>
          )}
          {selected.status === "new" && (
            <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" style={{ minHeight: 44 }} disabled={pending} onClick={() => run(() => rejectDeliverableAction(selected.id))}>Skip</button>
          )}
          <a href={selected.url} target="_blank" rel="noopener noreferrer" className="fs-btn fs-btn-quiet fs-link-ink" style={{ minHeight: 44 }}>Open original</a>
        </div>

        {panel === "schedule" && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label><span className="fs-field-label">Date</span><input type="date" className="fs-input" value={date} min={defaultSlot.date} onChange={(e) => setDate(e.target.value)} /></label>
              <label><span className="fs-field-label">Time</span><input type="time" className="fs-input" value={time} onChange={(e) => setTime(e.target.value)} /></label>
            </div>
            <p className="fs-t-meta" style={{ marginTop: 4 }}>Instagram · {timeZoneLabel}</p>
            <div role="radiogroup" aria-label="Format" style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {FORMATS.map((f) => <button key={f.key} type="button" role="radio" aria-checked={fmt === f.key} className={`fs-btn fs-btn-sm ${fmt === f.key ? "fs-btn-primary" : "fs-btn-secondary"}`} onClick={() => setFormat(f.key)}>{f.label}</button>)}
            </div>
            <p className="fs-t-meta" style={{ marginTop: 8 }}>Scheduling puts it on your calendar. You post it yourself and mark it published.</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="button" className="fs-btn fs-btn-primary" disabled={pending || !date || !time} onClick={() => run(() => scheduleDeliverableAction(selected.id, `${date}T${time}`, "instagram", fmt))}>{pending ? "Scheduling" : "Put it on the calendar"}</button>
              <button type="button" className="fs-btn fs-btn-secondary" onClick={() => setPanel(null)}>Cancel</button>
            </div>
          </div>
        )}
        {panel === "edit" && (
          <div style={{ marginTop: 16 }}>
            <label><span className="fs-field-label">What should change</span><textarea className="fs-textarea" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Crop tighter on the cup, warmer colours" /></label>
            <p className="fs-t-meta" style={{ marginTop: 4 }}>The original stays. The creator sees your note and uploads a new version.</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="button" className="fs-btn fs-btn-primary" disabled={pending || !note.trim()} onClick={() => run(() => requestEditAction(selected.id, note))}>{pending ? "Sending" : "Send to the creator"}</button>
              <button type="button" className="fs-btn fs-btn-secondary" onClick={() => setPanel(null)}>Cancel</button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
