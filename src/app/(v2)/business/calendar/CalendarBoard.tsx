"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusChip } from "@/components/v2/ui";
import { deleteCalendarPost, upsertCalendarPost } from "../actions";
import type { CalendarPost } from "./page";

const PLATFORMS = [
  ["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"],
  ["google_business", "Google"], ["other", "Other"],
] as const;

const STATUSES = [
  "idea", "draft", "needs_approval", "approved", "scheduled", "published", "failed",
] as const;

const VIEWS = ["upcoming", "week", "month"] as const;

/** Calendar board with three time views and inline add/edit. */
export function CalendarBoard({ businessId, posts }: { businessId: string; posts: CalendarPost[] }) {
  const router = useRouter();
  const [view, setView] = useState<(typeof VIEWS)[number]>("upcoming");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const now = Date.now();
  const shown = useMemo(() => {
    const horizon = view === "week" ? 7 : view === "month" ? 31 : 365;
    const cutoff = now + horizon * 86400_000;
    return posts.filter((p) => {
      const t = p.scheduled_for ? new Date(p.scheduled_for).getTime() : null;
      if (view === "upcoming") return p.status !== "published" || (t !== null && t > now - 86400_000);
      return t === null || (t > now - 86400_000 && t < cutoff);
    });
  }, [posts, view, now]);

  const setStatus = (post: CalendarPost, status: string) =>
    startTransition(async () => {
      setError(null);
      const result = await upsertCalendarPost({
        id: post.id, businessId, platform: post.platform, title: post.title,
        copy: post.copy ?? "", status, scheduledFor: post.scheduled_for ?? undefined,
      });
      if (!result.ok) setError(result.error ?? "Failed.");
      else router.refresh();
    });

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1 border-b border-rule">
        {VIEWS.map((v) => (
          <button
            key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}
            className={`px-3.5 py-2 font-mono text-[0.6875rem] font-600 tracking-[0.1em] uppercase ${
              view === v ? "border-b-2 border-signal text-ink" : "text-ink-faint hover:text-ink"
            }`}
          >
            {v}
          </button>
        ))}
        <button type="button" className="btn btn-signal ml-auto !min-h-0 !px-3 !py-1.5 !text-[0.625rem]" onClick={() => setAdding(!adding)}>
          + Post
        </button>
      </div>

      {adding && (
        <AddPostForm
          businessId={businessId}
          onDone={() => { setAdding(false); router.refresh(); }}
        />
      )}

      {error && <p role="alert" className="mt-3 font-mono text-xs text-signal">{error}</p>}

      <ul className="mt-3 flex flex-col gap-2">
        {shown.length === 0 && (
          <li className="border border-dashed border-rule px-4 py-8 text-center text-sm text-ink-faint">
            Nothing planned {view === "upcoming" ? "yet" : `this ${view}`} — add your first post.
          </li>
        )}
        {shown.map((p) => (
          <li key={p.id} className="border border-rule p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[0.625rem] font-600 uppercase text-ink-faint">
                {PLATFORMS.find(([k]) => k === p.platform)?.[1] ?? p.platform}
              </span>
              <StatusChip status={p.status} />
              {p.scheduled_for && (
                <span className="font-mono text-[0.625rem] text-ink-faint">
                  {new Date(p.scheduled_for).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              )}
              <span className="ml-auto flex gap-1.5">
                {p.status === "needs_approval" && (
                  <button type="button" disabled={pending} className="btn btn-signal !min-h-0 !px-2.5 !py-1 !text-[0.5625rem]" onClick={() => setStatus(p, "approved")}>
                    Approve
                  </button>
                )}
                {["approved", "scheduled"].includes(p.status) && (
                  <button type="button" disabled={pending} className="btn !min-h-0 !px-2.5 !py-1 !text-[0.5625rem]" onClick={() => setStatus(p, "published")}>
                    Mark published
                  </button>
                )}
                {p.status === "idea" && (
                  <button type="button" disabled={pending} className="btn !min-h-0 !px-2.5 !py-1 !text-[0.5625rem]" onClick={() => setStatus(p, "draft")}>
                    Start draft
                  </button>
                )}
                <button
                  type="button" disabled={pending} aria-label="Delete post"
                  className="btn btn-ghost !min-h-0 !px-2 !py-1 !text-[0.5625rem]"
                  onClick={() => startTransition(async () => { await deleteCalendarPost(p.id, businessId); router.refresh(); })}
                >
                  ✕
                </button>
              </span>
            </div>
            <p className="mt-1.5 font-display text-sm font-800">{p.title}</p>
            {p.copy && <p className="mt-1 line-clamp-2 text-xs text-ink-faint whitespace-pre-wrap">{p.copy}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddPostForm({ businessId, onDone }: { businessId: string; onDone: () => void }) {
  const [platform, setPlatform] = useState("instagram");
  const [title, setTitle] = useState("");
  const [copy, setCopy] = useState("");
  const [when, setWhen] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3 border border-rule p-3">
      <div className="grid grid-cols-2 gap-2">
        <select className="field !py-2 !text-xs" value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
          {PLATFORMS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input type="datetime-local" className="field !py-2 !text-xs" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Scheduled for" />
      </div>
      <input className="field mt-2 w-full !py-2 !text-xs" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title / idea" aria-label="Post title" />
      <textarea className="field mt-2 min-h-16 w-full !text-xs" maxLength={4000} value={copy} onChange={(e) => setCopy(e.target.value)} placeholder="Caption (optional)" aria-label="Caption" />
      {error && <p role="alert" className="mt-2 font-mono text-xs text-signal">{error}</p>}
      <button
        type="button" disabled={pending || !title.trim()} className="btn btn-signal mt-2 !min-h-0 !px-4 !py-2 !text-[0.6875rem]"
        onClick={() => startTransition(async () => {
          const result = await upsertCalendarPost({
            businessId, platform, title, copy,
            status: when ? "scheduled" : "idea", scheduledFor: when || undefined,
          });
          if (!result.ok) setError(result.error ?? "Failed.");
          else onDone();
        })}
      >
        {pending ? "Adding…" : "Add"}
      </button>
    </div>
  );
}
