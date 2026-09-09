"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, StatusChip } from "@/components/v2/ui";
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
const VIEW_LABEL: Record<(typeof VIEWS)[number], string> = { upcoming: "Upcoming", week: "This week", month: "This month" };

/** Calendar board with three time views and inline add/edit. */
export function CalendarBoard({ businessId, posts }: { businessId: string; posts: CalendarPost[] }) {
  const router = useRouter();
  const [view, setView] = useState<(typeof VIEWS)[number]>("upcoming");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [now] = useState(() => Date.now());
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
    <div className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <nav className="pill-row min-w-0 sm:flex-1" aria-label="Calendar views">
          {VIEWS.map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className="pill">
              {VIEW_LABEL[v]}
            </button>
          ))}
        </nav>
        <button type="button" className={`btn btn-sm shrink-0 self-start ${adding ? "" : "btn-signal"}`} onClick={() => setAdding(!adding)}>
          {adding ? "Close" : "+ Post"}
        </button>
      </div>

      {adding && (
        <AddPostForm
          businessId={businessId}
          onDone={() => { setAdding(false); router.refresh(); }}
        />
      )}

      {error && <p role="alert" className="mt-3 text-sm text-signal">{error}</p>}

      <ul className="row-list mt-4">
        {shown.length === 0 && (
          <li>
            <EmptyState
              title={view === "upcoming" ? "Nothing planned yet" : `Nothing planned this ${view}`}
              body="Add your first post and it shows up here."
            />
          </li>
        )}
        {shown.map((p) => (
          <li key={p.id} className={`card p-4 ${p.status === "needs_approval" ? "card-signal" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-xs font-700 text-ink-faint">
                {PLATFORMS.find(([k]) => k === p.platform)?.[1] ?? p.platform}
              </span>
              <StatusChip status={p.status} />
              {p.scheduled_for && (
                <span className="text-sm text-ink-faint">
                  {new Date(p.scheduled_for).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              )}
            </div>
            <p className="mt-2 font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{p.title}</p>
            {p.copy && <p className="mt-1.5 line-clamp-2 text-sm whitespace-pre-wrap text-ink-soft">{p.copy}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {p.status === "needs_approval" && (
                <button type="button" disabled={pending} className="btn btn-signal btn-sm" onClick={() => setStatus(p, "approved")}>
                  Approve
                </button>
              )}
              {["approved", "scheduled"].includes(p.status) && (
                <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus(p, "published")}>
                  Mark published
                </button>
              )}
              {p.status === "idea" && (
                <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus(p, "draft")}>
                  Start draft
                </button>
              )}
              <button
                type="button" disabled={pending} aria-label="Delete post"
                className="btn btn-ghost btn-sm ml-auto"
                onClick={() => startTransition(async () => { await deleteCalendarPost(p.id, businessId); router.refresh(); })}
              >
                Delete
              </button>
            </div>
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
    <div className="card mt-4 p-4">
      <p className="font-display text-[1.125rem] font-800 tracking-[-0.02em]">New post</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <select className="field" value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
          {PLATFORMS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input type="datetime-local" className="field" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Scheduled for" />
      </div>
      <input className="field mt-2 w-full" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title or idea" aria-label="Post title" />
      <textarea className="field mt-2 min-h-20 w-full" maxLength={4000} value={copy} onChange={(e) => setCopy(e.target.value)} placeholder="Caption (optional)" aria-label="Caption" />
      {error && <p role="alert" className="mt-2 text-sm text-signal">{error}</p>}
      <button
        type="button" disabled={pending || !title.trim()} className="btn btn-signal mt-3"
        onClick={() => startTransition(async () => {
          const result = await upsertCalendarPost({
            businessId, platform, title, copy,
            status: when ? "scheduled" : "idea", scheduledFor: when || undefined,
          });
          if (!result.ok) setError(result.error ?? "Failed.");
          else onDone();
        })}
      >
        {pending ? "Adding…" : "Add post"}
      </button>
    </div>
  );
}
