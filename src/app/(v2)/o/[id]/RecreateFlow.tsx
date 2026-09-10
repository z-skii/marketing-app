"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Warning, WarningCircle, Question, UploadSimple, VideoCamera } from "@phosphor-icons/react";
import type { CheckItem, ClientMediaMeta, CreatorGuide, SubmissionCheck } from "@/lib/ai/types";
import { readVideoMeta, uploadWithProgress } from "@/lib/client/media-meta";
import { runSubmissionCheck, submitRecreate } from "../actions";

/**
 * Start recreating: pick the video, watch it upload, see the requirement
 * check, then send it. The check is advisory; the business approves and
 * pays. Every stage shows something moving so the wait feels intentional.
 */
type Stage = "pick" | "reading" | "uploading" | "checking" | "review" | "sending" | "done";

export function RecreateFlow({ campaignId, guide, rightsNote }: { campaignId: string; guide: CreatorGuide; rightsNote: string }) {
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
      setStage("uploading");
      setProgress(0);
      const stored = await uploadWithProgress(file, "submissions", setProgress);
      setUrl(stored);
      setStage("checking");
      const result = await runSubmissionCheck(campaignId, stored, m);
      setCheck(result);
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
    <div id="start" className="scroll-mt-24">
      <input ref={input} type="file" accept="video/*" className="sr-only" id="recreate-file" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />

      {stage === "pick" && (
        <label htmlFor="recreate-file" className="btn btn-signal btn-lg w-full cursor-pointer">
          <UploadSimple size={22} weight="bold" aria-hidden />
          Upload your Reel
        </label>
      )}

      {(stage === "reading" || stage === "uploading") && (
        <div className="rounded-[var(--radius-card)] bg-surface p-4">
          <div className="flex items-center gap-3">
            <VideoCamera size={24} className="text-ink-soft" aria-hidden />
            <p className="font-display text-[1.0625rem] font-600">{stage === "reading" ? "Reading your video" : `Uploading ${progress}%`}</p>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-signal transition-[width] duration-200" style={{ width: `${stage === "reading" ? 4 : progress}%` }} />
          </div>
          {local.length > 0 && <ul className="mt-3 flex flex-col gap-1.5">{local.map((v) => <Line key={v.key} item={v} />)}</ul>}
        </div>
      )}

      {stage === "checking" && (
        <div className="rounded-[var(--radius-card)] bg-surface p-4">
          <p className="font-display text-[1.0625rem] font-600">Checking your submission</p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {local.map((v) => <Line key={v.key} item={v} />)}
            {guide.checklist.slice(0, 4).map((c, i) => (
              <li key={c} className="flex items-center gap-2.5 text-sm text-ink-faint settle" style={{ animationDelay: `${(i + 1) * 260}ms` }}>
                <span className="live-dot" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(stage === "review" || stage === "sending") && check && (
        <div className="rounded-[var(--radius-card)] bg-surface p-4">
          <p className="font-display text-[1.0625rem] font-600">
            {fails > 0 ? `${fails} thing${fails === 1 ? "" : "s"} to look at` : "Looks ready"}
          </p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {check.items.filter((i) => i.status !== "unknown").map((i) => <Line key={i.key} item={i} />)}
            {check.items.some((i) => i.status === "unknown") && (
              <li className="flex items-start gap-2.5 text-sm text-ink-faint">
                <Question size={20} className="mt-0.5 shrink-0" aria-hidden />
                <span>{check.items.filter((i) => i.status === "unknown").length} more checked by the business</span>
              </li>
            )}
          </ul>
          <p className="mt-3 text-xs text-ink-faint">
            {check.checked_by === "ai" ? "Checked from a few frames. " : check.checked_by === "client" ? "Only length and format were checked. " : ""}
            The business makes the final call.
          </p>

          <label className="mt-4 flex items-start gap-3 text-sm text-ink-soft">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1 h-5 w-5 accent-signal" />
            <span>{rightsNote}</span>
          </label>
          <input
            className="field mt-3" value={note} maxLength={500} placeholder="Anything the business should know (optional)"
            onChange={(e) => setNote(e.target.value)}
          />
          {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
          <div className="mt-4 flex gap-2">
            <label htmlFor="recreate-file" className="btn cursor-pointer">Replace video</label>
            <button type="button" className="btn btn-signal btn-lg flex-1" disabled={!ack || stage === "sending"} onClick={send}>
              {stage === "sending" ? "Sending" : fails > 0 ? "Submit anyway" : "Submit"}
            </button>
          </div>
        </div>
      )}

      {stage === "done" && (
        <div className="rounded-[var(--radius-card)] bg-surface p-5 text-center">
          <CheckCircle size={40} weight="fill" className="mx-auto text-signal" aria-hidden />
          <p className="mt-2 font-display text-[1.25rem] font-700 tracking-[-0.02em]">Sent</p>
          <p className="mt-1 text-sm text-ink-soft">The business reviews it. Approval pays into your earnings.</p>
        </div>
      )}

      {stage === "pick" && error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
    </div>
  );
}

function Line({ item }: { item: CheckItem }) {
  const icon = item.status === "pass" ? <CheckCircle size={20} weight="fill" className="text-rise" aria-hidden />
    : item.status === "fail" ? <WarningCircle size={20} weight="fill" className="text-alert" aria-hidden />
    : item.status === "warn" ? <Warning size={20} weight="fill" className="text-ink-soft" aria-hidden />
    : <Question size={20} className="text-ink-faint" aria-hidden />;
  return (
    <li className="settle flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className={item.status === "fail" ? "text-ink" : "text-ink-soft"}>
        {item.label}{item.note ? <span className="text-ink-faint"> · {item.note}</span> : null}
      </span>
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
