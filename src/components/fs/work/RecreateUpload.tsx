"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Question, Warning, WarningCircle } from "@phosphor-icons/react";
import type { CheckItem, ClientMediaMeta, CreatorGuide, SubmissionCheck } from "@/lib/ai/types";
import { readVideoMeta, uploadWithProgress } from "@/lib/client/media-meta";
import { runSubmissionCheck, submitRecreate } from "@/app/(v2)/o/actions";

/**
 * Upload your version: pick the video, watch it upload, read the advisory
 * requirement check, confirm the rights note, send. The business approves
 * and approval pays. An earlier version stays on record until this one
 * is sent.
 */
type Stage = "pick" | "reading" | "uploading" | "checking" | "review" | "sending" | "done";

export function RecreateUpload({ campaignId, guide, rightsNote, label = "Upload your Reel" }: { campaignId: string; guide: CreatorGuide; rightsNote: string; label?: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("pick");
  const [progress, setProgress] = useState(0);
  const [meta, setMeta] = useState<ClientMediaMeta | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [check, setCheck] = useState<SubmissionCheck | null>(null);
  const [ack, setAck] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const onFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      setStage("reading");
      const m = await readVideoMeta(file);
      setMeta(m);
      setStage("uploading"); setProgress(0);
      const stored = await uploadWithProgress(file, "submissions", setProgress);
      setUrl(stored);
      setStage("checking");
      setCheck(await runSubmissionCheck(campaignId, stored, m));
      setStage("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStage("pick");
    } finally {
      if (input.current) input.current.value = "";
    }
  };

  const send = () => {
    if (!url) return;
    setStage("sending");
    start(async () => {
      const r = await submitRecreate(campaignId, { mediaUrls: [url], note, rightsAck: ack, check, clientMeta: meta });
      if (!r.ok) { setError(r.error ?? "Could not submit."); setStage("review"); return; }
      setStage("done");
      router.refresh();
    });
  };

  const fails = check?.items.filter((i) => i.status === "fail").length ?? 0;
  const local = meta ? localVerdicts(meta, guide) : [];

  return (
    <div id="start" style={{ scrollMarginTop: 96 }}>
      <input ref={input} type="file" accept="video/*" className="fs-sr" id="fs-recreate-file" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />

      {stage === "pick" && (
        <>
          <label htmlFor="fs-recreate-file" className="fs-btn fs-btn-primary" style={{ width: "100%", cursor: "pointer" }}>{label}</label>
          <p className="fs-t-meta" style={{ marginTop: 8 }}>{guide.duration_seconds[0]} to {guide.duration_seconds[1]} seconds · {guide.orientation === "vertical" ? "Vertical 9:16" : "Horizontal 16:9"}</p>
          {error && <p role="alert" className="fs-field-error">{error}</p>}
        </>
      )}

      {(stage === "reading" || stage === "uploading") && (
        <div className="fs-plane">
          <p className="fs-t-label">{stage === "reading" ? "Reading your video" : `Uploading ${progress}%`}</p>
          <div className="fs-progress" style={{ marginTop: 8 }} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <span style={{ width: `${stage === "reading" ? 4 : progress}%` }} />
          </div>
          {local.length > 0 && <ul className="fs-plain-list" style={{ marginTop: 8 }}>{local.map((v) => <Line key={v.key} item={v} />)}</ul>}
        </div>
      )}

      {stage === "checking" && (
        <div className="fs-plane" aria-busy="true">
          <p className="fs-t-label">Checking your submission</p>
          <ul className="fs-plain-list" style={{ marginTop: 8 }}>
            {local.map((v) => <Line key={v.key} item={v} />)}
            {guide.checklist.slice(0, 4).map((c) => <li key={c} className="fs-check"><Question size={20} aria-hidden style={{ color: "var(--fs-muted)" }} /><span style={{ color: "var(--fs-muted)" }}>{c}</span></li>)}
          </ul>
        </div>
      )}

      {(stage === "review" || stage === "sending") && check && (
        <div className="fs-plane">
          <p className="fs-t-label">{fails > 0 ? `${fails} thing${fails === 1 ? "" : "s"} to look at` : "Looks ready to send"}</p>
          <ul className="fs-plain-list" style={{ marginTop: 8 }}>
            {check.items.filter((i) => i.status !== "unknown").map((i) => <Line key={i.key} item={i} />)}
            {check.items.some((i) => i.status === "unknown") && (
              <li className="fs-check"><Question size={20} aria-hidden style={{ color: "var(--fs-muted)" }} /><span style={{ color: "var(--fs-muted)" }}>{check.items.filter((i) => i.status === "unknown").length} more checked by the business</span></li>
            )}
          </ul>
          <p className="fs-t-meta" style={{ marginTop: 8 }}>
            {check.checked_by === "ai" ? "Checked from a few frames. " : check.checked_by === "client" ? "Only length and format were checked. " : ""}The business makes the final call.
          </p>
          <label className="fs-checkbox" style={{ marginTop: 16 }}>
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span>{rightsNote}</span>
          </label>
          <label className="fs-field-label" htmlFor="fs-recreate-note" style={{ marginTop: 12 }}>Anything the business should know (optional)</label>
          <input id="fs-recreate-note" className="fs-input" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          {error && <p role="alert" className="fs-field-error">{error}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            <label htmlFor="fs-recreate-file" className="fs-btn fs-btn-secondary" style={{ cursor: "pointer" }}>Replace video</label>
            <button type="button" className="fs-btn fs-btn-primary" style={{ flex: 1, minWidth: 160 }} disabled={!ack || stage === "sending"} onClick={send}>
              {stage === "sending" ? "Sending" : fails > 0 ? "Send anyway" : "Send for approval"}
            </button>
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="fs-plane">
          <p className="fs-t-label"><span className="fs-status is-waiting">In review</span> · Sent</p>
          <p className="fs-t-meta" style={{ marginTop: 4 }}>The business reviews it. Approval pays into your earnings.</p>
        </div>
      )}
    </div>
  );
}

function Line({ item }: { item: CheckItem }) {
  const icon = item.status === "pass" ? <CheckCircle size={20} weight="fill" aria-label="Passed" style={{ color: "var(--fs-confirmed)" }} />
    : item.status === "fail" ? <WarningCircle size={20} weight="fill" aria-label="Problem" style={{ color: "var(--fs-problem)" }} />
    : item.status === "warn" ? <Warning size={20} weight="fill" aria-label="Warning" style={{ color: "var(--fs-waiting)" }} />
    : <Question size={20} aria-label="Not checked" style={{ color: "var(--fs-muted)" }} />;
  return (
    <li className="fs-check">
      <span>{icon}</span>
      <span style={{ color: item.status === "fail" ? "var(--fs-ink)" : "var(--fs-muted)" }}>{item.label}{item.note ? ` · ${item.note}` : ""}</span>
    </li>
  );
}

/** What the browser can judge on its own before the server sees anything. */
function localVerdicts(meta: ClientMediaMeta, guide: CreatorGuide): CheckItem[] {
  const out: CheckItem[] = [];
  if (meta.durationSeconds != null) {
    const [min, max] = guide.duration_seconds;
    const ok = meta.durationSeconds >= min - 0.5 && meta.durationSeconds <= max + 0.5;
    out.push({ key: "duration", label: `${Math.round(meta.durationSeconds)} seconds`, status: ok ? "pass" : "fail", note: ok ? null : `Needs ${min} to ${max}` });
  }
  if (meta.width && meta.height) {
    const vertical = meta.height > meta.width;
    const want = guide.orientation === "vertical";
    out.push({ key: "orientation", label: vertical ? "Vertical" : "Horizontal", status: vertical === want ? "pass" : "fail", note: vertical === want ? null : want ? "Film upright, 9:16" : "Film sideways, 16:9" });
  }
  return out;
}
