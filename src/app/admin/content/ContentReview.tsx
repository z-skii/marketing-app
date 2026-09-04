"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveContent, markPublished, rejectContent, runAgentsNow,
} from "./actions";

export type QueueRow = {
  id: string;
  platform: string;
  format: string;
  copy: string;
  asset_url: string | null;
  hashtags: string[] | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  publish_result: Record<string, unknown> | null;
  created_at: string;
};

/**
 * The review queue: every draft with its rendered creative, one-tap
 * approve/reject, an optional schedule, and — for items waiting on platform
 * tokens — the copy and asset ready to post by hand.
 */
export function ContentReview({ rows }: { rows: QueueRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [schedules, setSchedules] = useState<Record<string, string>>({});

  const run = (fn: () => Promise<{ ok: boolean; error?: string; detail?: string }>, success: string) =>
    startTransition(async () => {
      const result = await fn();
      setMessage(
        result.ok
          ? { tone: "ok", text: result.detail ?? success }
          : { tone: "bad", text: result.error ?? "Failed." },
      );
      if (result.ok) router.refresh();
    });

  const copyText = async (row: QueueRow) => {
    const text = row.hashtags?.length
      ? `${row.copy}\n\n${row.hashtags.map((h) => `#${h}`).join(" ")}`
      : row.copy;
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ tone: "ok", text: "Copy on the clipboard — paste it into the app." });
    } catch {
      setMessage({ tone: "bad", text: "Clipboard blocked — select the text manually." });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-signal !px-5 !py-2.5"
          disabled={pending}
          onClick={() => run(runAgentsNow, "Batch generated.")}
        >
          {pending ? "Working…" : "Run agents now"}
        </button>
        <p className="font-mono text-[0.6875rem] text-ink-faint">
          generate → render ads → drafts below. Nothing posts without approval.
        </p>
      </div>

      {message && (
        <p role="alert" className={`mt-3 font-mono text-xs ${message.tone === "ok" ? "text-rise" : "text-signal"}`}>
          {message.text}
        </p>
      )}

      {rows.length === 0 && (
        <p className="mt-8 font-mono text-xs text-ink-faint">
          Queue is empty. Run the agents to draft a batch.
        </p>
      )}

      <ul className="mt-6 flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.id} className="border border-rule bg-paper p-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="eyebrow !text-signal">{row.platform}</span>
              <span className="eyebrow">{row.format.replace("_", " ")}</span>
              <StatusChip status={row.status} />
              {row.scheduled_for && (
                <span className="font-mono text-[0.6875rem] text-ink-faint">
                  scheduled {new Date(row.scheduled_for).toLocaleString()}
                </span>
              )}
              {row.published_at && (
                <span className="font-mono text-[0.6875rem] text-ink-faint">
                  published {new Date(row.published_at).toLocaleString()}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-col gap-4 md:flex-row">
              {row.asset_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.asset_url}
                  alt="Rendered ad"
                  className="w-44 shrink-0 border border-ink"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug whitespace-pre-wrap">{row.copy}</p>
                {row.hashtags && row.hashtags.length > 0 && (
                  <p className="tnum mt-2 font-mono text-[0.6875rem] text-ink-faint">
                    {row.hashtags.map((h) => `#${h}`).join(" ")}
                  </p>
                )}
                {row.status === "failed" && row.publish_result?.error != null && (
                  <p className="mt-2 font-mono text-[0.6875rem] text-signal">
                    {String(row.publish_result.error)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(row.status === "draft" || row.status === "failed") && (
                <>
                  <button
                    type="button" className="btn !min-h-0 !px-3 !py-1.5 !text-[0.625rem]" disabled={pending}
                    onClick={() => run(() => approveContent(row.id, schedules[row.id]), "Approved.")}
                  >
                    Approve
                  </button>
                  <input
                    type="datetime-local"
                    value={schedules[row.id] ?? ""}
                    onChange={(e) => setSchedules({ ...schedules, [row.id]: e.target.value })}
                    className="field !min-h-0 !w-52 !py-1 !text-xs"
                    aria-label="Schedule for"
                  />
                  <span className="font-mono text-[0.625rem] text-ink-faint">blank = next cron</span>
                </>
              )}
              {row.status === "ready" && (
                <>
                  <button
                    type="button" className="btn btn-signal !min-h-0 !px-3 !py-1.5 !text-[0.625rem]"
                    onClick={() => copyText(row)}
                  >
                    Copy text
                  </button>
                  {row.asset_url && (
                    <a
                      href={row.asset_url} target="_blank" rel="noopener noreferrer"
                      className="btn !min-h-0 !px-3 !py-1.5 !text-[0.625rem]"
                    >
                      Open image
                    </a>
                  )}
                  <button
                    type="button" className="btn !min-h-0 !px-3 !py-1.5 !text-[0.625rem]" disabled={pending}
                    onClick={() => run(() => markPublished(row.id), "Marked published.")}
                  >
                    Mark published
                  </button>
                </>
              )}
              {(row.status === "draft" || row.status === "approved" || row.status === "ready" || row.status === "failed") && (
                <button
                  type="button" className="btn btn-ghost !min-h-0 !px-3 !py-1.5 !text-[0.625rem]" disabled={pending}
                  onClick={() => run(() => rejectContent(row.id), "Rejected.")}
                >
                  Reject
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function StatusChip({ status }: { status: string }) {
  const tone =
    status === "published" ? "text-rise"
    : status === "rejected" || status === "failed" ? "text-signal"
    : status === "ready" ? "text-ink"
    : "text-ink-faint";
  return <span className={`font-mono text-[0.6875rem] font-600 uppercase ${tone}`}>{status}</span>;
}
