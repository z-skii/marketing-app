"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveContent, markPublished, rejectContent, runAgentsNow,
} from "./actions";
import { VideoMaker } from "./VideoMaker";

export type QueueRow = {
  id: string;
  platform: string;
  format: string;
  copy: string;
  asset_url: string | null;
  asset_urls: string[] | null;
  hashtags: string[] | null;
  status: string;
  scheduled_for: string | null;
  published_at: string | null;
  publish_result: Record<string, unknown> | null;
  ad_params: Record<string, unknown> | null;
  created_at: string;
  /** For published rows: 1 = this platform's first post, counting up. */
  post_number: number | null;
};

const PLATFORMS = [
  { key: "threads", label: "Threads" },
  { key: "instagram", label: "Insta" },
  { key: "facebook", label: "FB" },
  { key: "tiktok", label: "TikTok" },
];

/**
 * The content area: one platform at a time, names across the top, swipe
 * left/right (or tap) to move between them. Each platform shows what's
 * waiting to go out on top and, under it, the numbered record of everything
 * posted there since post #1.
 */
export function ContentReview({ rows, phase }: { rows: QueueRow[]; phase: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [schedules, setSchedules] = useState<Record<string, string>>({});
  const [active, setActive] = useState(0);
  const [videoUrls, setVideoUrls] = useState<string[] | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

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

  // Fetch the image and hand it to the browser as a download, so "save this
  // photo to post it" is one tap instead of open-tab-then-long-press.
  const saveImage = async (row: QueueRow, url: string, n: number) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `tapmart-${row.platform}-${n}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 30_000);
      setMessage({ tone: "ok", text: "Photo saved to your downloads." });
    } catch {
      window.open(url, "_blank", "noopener");
      setMessage({ tone: "bad", text: "Direct save blocked — opened the photo instead, long-press to save." });
    }
  };

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

  const platform = PLATFORMS[active].key;
  const mine = rows.filter((r) => r.platform === platform);
  const toPost = mine.filter((r) => r.status !== "published");
  const posted = mine
    .filter((r) => r.status === "published")
    .sort((a, b) => (b.post_number ?? 0) - (a.post_number ?? 0));

  const pendingCount = (key: string) =>
    rows.filter((r) => r.platform === key && r.status !== "published").length;

  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0]?.clientX ?? 0, y: e.touches[0]?.clientY ?? 0 };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = (e.changedTouches[0]?.clientX ?? touch.current.x) - touch.current.x;
    const dy = (e.changedTouches[0]?.clientY ?? touch.current.y) - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 56 || Math.abs(dy) > 60) return;
    // This gesture belongs to the platform tabs, not the admin sections.
    window.__innerSwipe = Date.now();
    setActive((a) => Math.min(PLATFORMS.length - 1, Math.max(0, a + (dx < 0 ? 1 : -1))));
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
          {phase === "launch"
            ? "launch phase — posting heavy so people learn the app."
            : "steady phase — updates and customer pull."}
          {" "}Every run replaces anything you haven&apos;t posted yet.
        </p>
      </div>

      {message && (
        <p role="alert" className={`mt-3 font-mono text-xs ${message.tone === "ok" ? "text-rise" : "text-signal"}`}>
          {message.text}
        </p>
      )}

      {/* Platform names on top; tap or swipe to switch. */}
      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-rule" role="tablist">
        {PLATFORMS.map((p, i) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 font-mono text-[0.6875rem] font-600 tracking-[0.14em] whitespace-nowrap uppercase transition-colors ${
              i === active ? "border-b-2 border-signal text-ink" : "text-ink-faint hover:text-ink"
            }`}
          >
            {p.label}
            {pendingCount(p.key) > 0 && (
              <span className="tnum ml-1.5 text-signal">{pendingCount(p.key)}</span>
            )}
          </button>
        ))}
      </div>

      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="min-h-[50vh]">
        <section className="mt-5">
          <h2 className="eyebrow">To post</h2>
          {toPost.length === 0 && (
            <p className="mt-3 font-mono text-xs text-ink-faint">
              Nothing waiting for {PLATFORMS[active].label}. Run the agents for a fresh batch.
            </p>
          )}
          <ul className="mt-3 flex flex-col gap-4">
            {toPost.map((row) => (
              <li key={row.id} className="border border-rule bg-paper p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="eyebrow">{row.format.replace("_", " ")}</span>
                  <StatusChip status={row.status} />
                  {row.scheduled_for && (
                    <span className="font-mono text-[0.6875rem] text-ink-faint">
                      scheduled {new Date(row.scheduled_for).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-4 md:flex-row">
                  <Thumbs row={row} size="w-40" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug whitespace-pre-wrap">{row.copy}</p>
                    {row.hashtags && row.hashtags.length > 0 && (
                      <p className="tnum mt-2 font-mono text-[0.6875rem] text-ink-faint">
                        {row.hashtags.map((h) => `#${h}`).join(" ")}
                      </p>
                    )}
                    {typeof row.ad_params?.script === "string" && (
                      <div className="mt-3 border-l-2 border-signal pl-3">
                        <p className="eyebrow">Voiceover script</p>
                        <p className="mt-1 text-xs leading-relaxed whitespace-pre-wrap">
                          {row.ad_params.script}
                        </p>
                      </div>
                    )}
                    {row.status === "failed" && row.publish_result?.error != null && (
                      <p className="mt-2 font-mono text-[0.6875rem] text-signal">
                        {String(row.publish_result.error)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {(row.asset_urls?.length ?? 0) >= 2 && (
                    <button
                      type="button"
                      className="btn btn-signal !min-h-0 !px-3 !py-1.5 !text-[0.625rem]"
                      onClick={() => setVideoUrls(row.asset_urls!)}
                    >
                      {row.format === "video" ? "Make final video" : "Make video"}
                    </button>
                  )}
                  {(row.asset_urls ?? (row.asset_url ? [row.asset_url] : [])).map((url, i, all) => (
                    <button
                      key={i}
                      type="button"
                      className="btn !min-h-0 !px-3 !py-1.5 !text-[0.625rem]"
                      onClick={() => saveImage(row, url, i + 1)}
                    >
                      {all.length > 1 ? `Save photo ${i + 1}` : "Save photo"}
                    </button>
                  ))}
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
        </section>

        {/* The permanent record: everything posted here, numbered from #1. */}
        <section className="rule mt-8 pt-5 pb-6">
          <h2 className="eyebrow">
            Posted on {PLATFORMS[active].label}
            <span className="tnum ml-2 text-ink-faint">{posted.length}</span>
          </h2>
          {posted.length === 0 && (
            <p className="mt-3 font-mono text-xs text-ink-faint">
              Nothing posted here yet — post #1 is waiting above.
            </p>
          )}
          <ul className="mt-3 flex flex-col gap-2">
            {posted.map((row) => (
              <li key={row.id} className="flex items-start gap-3 border-b border-rule pb-2 last:border-b-0">
                <span className="tnum w-10 shrink-0 font-display text-lg font-800 text-signal">
                  #{row.post_number}
                </span>
                <Thumbs row={row} size="w-12" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs">{row.copy}</p>
                  <p className="font-mono text-[0.625rem] text-ink-faint">
                    {row.format.replace("_", " ")}
                    {row.published_at &&
                      ` · ${new Date(row.published_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {videoUrls && <VideoMaker urls={videoUrls} onClose={() => setVideoUrls(null)} />}
    </>
  );
}

function Thumbs({ row, size }: { row: QueueRow; size: string }) {
  const urls = row.asset_urls ?? (row.asset_url ? [row.asset_url] : []);
  if (urls.length === 0) return null;
  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      {urls.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={url} alt={`Graphic ${i + 1}`} className={`${size} border border-ink`} />
      ))}
    </div>
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
