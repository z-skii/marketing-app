"use client";

import { useState } from "react";
import type { ContentFile } from "../mock";
import { demoMutation } from "../adapter";

/**
 * The media-to-decision edge: an 816px graphite stage holding the selected
 * original, contained at its native ratio, a filmstrip of the other actual
 * files, and a 336px white inspector. Selecting never changes a file's
 * state; approval waits for the demo response, then a 140ms state change
 * and a 1200ms accent wash. Imagery crossfades over 180ms once the next
 * source is ready.
 */
export function ContentWorkspace({ files, shootLabel, uploader }: { files: ContentFile[]; shootLabel: string; uploader: string }) {
  const [selectedId, setSelectedId] = useState(files[0].id);
  const [states, setStates] = useState<Record<string, ContentFile["state"] | "Skipped">>(Object.fromEntries(files.map((f) => [f.id, f.state])));
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState(false);
  const [caption, setCaption] = useState<Record<string, string>>(Object.fromEntries(files.map((f) => [f.id, f.caption])));
  const selected = files.find((f) => f.id === selectedId) ?? files[0];
  const state = states[selected.id];
  const others = files.filter((f) => f.id !== selected.id);

  const act = async (next: ContentFile["state"] | "Skipped") => {
    if (pending) return;
    setPending(true);
    const r = await demoMutation();
    setPending(false);
    if (!r.ok) return;
    setStates((s) => ({ ...s, [selected.id]: next }));
    setFlash(true); window.setTimeout(() => setFlash(false), 1200);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "816px 336px", gap: 24, marginTop: 12, alignItems: "start" }}>
      <div>
        <div style={{ position: "relative", width: 816, height: 420, background: "var(--tm-graphite)", borderRadius: "var(--tm-radius-media)", overflow: "hidden", display: "grid", placeItems: "center" }} className="on-dark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={selected.id} src={selected.src} alt={`${selected.title}, the original delivered file`} width={816} height={420} style={{ width: 816, height: 420, objectFit: "contain", animation: "lab-xfade 180ms var(--tm-ease-out) both" }} />
        </div>
        <ul style={{ display: "grid", gridTemplateColumns: "repeat(4, 192px)", gap: 16, listStyle: "none", padding: 0, margin: "16px 0 0" }}>
          {others.map((f) => (
            <li key={f.id}>
              <button type="button" onClick={() => setSelectedId(f.id)} aria-pressed={false} style={{ display: "block", width: 192, textAlign: "left" }}>
                <span className="media contain" style={{ display: "grid", placeItems: "center", width: 192, height: 144, background: "var(--tm-underlay)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.src} alt="" width={192} height={144} style={{ width: 192, height: 144, objectFit: "contain" }} />
                </span>
                <span className="t-meta" style={{ display: "block", marginTop: 8, color: "var(--tm-ink)" }}>{f.title}</span>
                <span className="t-meta" style={{ display: "block" }}>{states[f.id]}{f.post.state !== "Not scheduled" && <> · <span className={f.post.state === "Failed" ? "status problem" : undefined}>Post {f.post.state.toLowerCase()}</span></>}</span>
              </button>
            </li>
          ))}
        </ul>
        <style>{`@keyframes lab-xfade { from { opacity: 0 } to { opacity: 1 } }`}</style>
      </div>

      <aside aria-label="Selected file" style={{ background: "var(--tm-surface)", padding: 24, minHeight: 584, borderRadius: 0, transition: "background-color 140ms var(--tm-ease-out)", ...(flash ? { background: "var(--tm-accent-wash)" } : {}) }}>
        <p className="t-meta" style={{ margin: 0 }}>File state · <span className={`status ${state === "Approved" ? "confirmed" : state === "Skipped" ? "neutral" : "waiting"}`}>{state}</span></p>
        <h3 className="t-section" style={{ margin: "4px 0 0" }}>{selected.title}</h3>
        <p className="t-meta" style={{ margin: "8px 0 0" }}>{shootLabel}</p>
        <p className="t-meta" style={{ margin: 0 }}>Uploaded by {uploader}</p>
        <p className="t-meta" style={{ margin: 0 }}>Demo delivered file</p>

        <label className="t-label" style={{ display: "block", marginTop: 16 }}>Caption
          <textarea value={caption[selected.id]} onChange={(e) => setCaption((c) => ({ ...c, [selected.id]: e.target.value }))} rows={2} style={{ display: "block", width: "100%", height: 72, marginTop: 4, padding: 12, font: "inherit", fontSize: 16, lineHeight: "24px", border: "1px solid var(--tm-control-border)", borderRadius: "var(--tm-radius-control)", background: "#fff", color: "var(--tm-ink)", resize: "vertical" }} />
        </label>
        {selected.editNote && <p className="t-meta" style={{ margin: "12px 0 0" }}>Edit note · {selected.editNote}</p>}
        <p className="t-meta" style={{ margin: "12px 0 0" }}>Post · <span className={`status ${selected.post.state === "Failed" ? "problem" : selected.post.state === "Scheduled" ? "waiting" : "neutral"}`}>{selected.post.state}</span>{selected.post.detail ? ` · ${selected.post.detail}` : ""}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
          {state === "New" ? (
            <button type="button" className="btn btn-primary" disabled={pending} onClick={() => act("Approved")}>{pending ? "Saving" : "Approve content"}</button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={pending}>Schedule</button>
          )}
          <button type="button" className="btn btn-secondary" disabled={pending}>Request an edit</button>
          <button type="button" className="btn btn-quiet" style={{ minHeight: 44, color: "var(--tm-ink)" }} disabled={pending} onClick={() => act("Skipped")}>Skip</button>
          <button type="button" className="btn btn-quiet" style={{ minHeight: 44, color: "var(--tm-ink)" }}>Open original</button>
        </div>
      </aside>
    </div>
  );
}
