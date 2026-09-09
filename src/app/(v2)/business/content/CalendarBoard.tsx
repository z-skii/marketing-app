"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, StatusChip } from "@/components/v2/ui";
import { deleteCalendarPost, upsertCalendarPost } from "../actions";
import type { CalendarPost } from "./types";

const PLATFORMS = [
  ["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"],
  ["google_business", "Google"], ["other", "Other"],
] as const;

/**
 * Five views over the calendar_posts statuses:
 *   Upcoming   everything not yet published, soonest first
 *   Ideas      idea
 *   Drafts     draft, needs_approval
 *   Scheduled  approved, scheduled
 *   Published  published, failed
 * The chip on each post is the real status, never a softer word.
 */
const VIEWS = ["upcoming", "ideas", "drafts", "scheduled", "published"] as const;
type View = (typeof VIEWS)[number];
const VIEW_LABEL: Record<View, string> = {
  upcoming: "Upcoming", ideas: "Ideas", drafts: "Drafts", scheduled: "Scheduled", published: "Published",
};
const VIEW_STATUSES: Record<View, string[]> = {
  upcoming: ["idea", "draft", "needs_approval", "approved", "scheduled"],
  ideas: ["idea"],
  drafts: ["draft", "needs_approval"],
  scheduled: ["approved", "scheduled"],
  published: ["published", "failed"],
};

export function CalendarBoard({
  businessId, posts, canAutoPost,
}: { businessId: string; posts: CalendarPost[]; canAutoPost: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<View>("upcoming");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shown = useMemo(() => {
    const allowed = VIEW_STATUSES[view];
    const list = posts.filter((p) => allowed.includes(p.status));
    const when = (p: CalendarPost) => (p.scheduled_for ? new Date(p.scheduled_for).getTime() : Number.MAX_SAFE_INTEGER);
    if (view === "published") {
      return list.sort((a, b) => new Date(b.published_at ?? b.created_at).getTime() - new Date(a.published_at ?? a.created_at).getTime());
    }
    return list.sort((a, b) => when(a) - when(b));
  }, [posts, view]);

  const counts = useMemo(() => {
    const out = {} as Record<View, number>;
    for (const v of VIEWS) out[v] = posts.filter((p) => VIEW_STATUSES[v].includes(p.status)).length;
    return out;
  }, [posts]);

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

  const empty: Record<View, [string, string]> = {
    upcoming: ["Nothing planned yet", "Add a post and it shows up here."],
    ideas: ["No ideas parked", "Ideas are posts without a date yet."],
    drafts: ["No drafts", "Drafts and posts waiting for approval live here."],
    scheduled: ["Nothing scheduled", "Approve a post with a date and it lands here."],
    published: ["Nothing published yet", "Posts you mark published are kept here."],
  };

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <nav className="pill-row min-w-0 sm:flex-1" aria-label="Content views">
          {VIEWS.map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className="pill">
              {VIEW_LABEL[v]}{counts[v] > 0 && <span className="tnum opacity-70">{counts[v]}</span>}
            </button>
          ))}
        </nav>
        <button type="button" className={`btn btn-sm shrink-0 self-start ${adding ? "" : "btn-signal"}`} onClick={() => setAdding(!adding)}>
          {adding ? "Close" : "+ Post"}
        </button>
      </div>

      {adding && (
        <AddPostForm businessId={businessId} onDone={() => { setAdding(false); router.refresh(); }} />
      )}

      {error && <p role="alert" className="mt-3 text-sm text-signal">{error}</p>}

      <ul className="row-list mt-4">
        {shown.length === 0 && (
          <li><EmptyState title={empty[view][0]} body={empty[view][1]} /></li>
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
              {p.status === "published" && p.published_at && (
                <span className="text-sm text-ink-faint">
                  Published {new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <p className="mt-2 font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{p.title}</p>
            {p.copy && <p className="mt-1.5 line-clamp-2 text-sm whitespace-pre-wrap text-ink-soft">{p.copy}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {p.status === "idea" && (
                <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus(p, "draft")}>Start draft</button>
              )}
              {p.status === "draft" && (
                <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus(p, "needs_approval")}>Send for approval</button>
              )}
              {p.status === "needs_approval" && (
                <button type="button" disabled={pending} className="btn btn-signal btn-sm" onClick={() => setStatus(p, p.scheduled_for ? "scheduled" : "approved")}>Approve</button>
              )}
              {["approved", "scheduled"].includes(p.status) && (
                <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus(p, "published")}>
                  {canAutoPost ? "Mark published" : "Mark published yourself"}
                </button>
              )}
              {p.status === "failed" && (
                <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus(p, "scheduled")}>Try again</button>
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
      <p className="mt-1 text-sm text-ink-faint">With a date it goes to Scheduled after approval. Without one it is parked as an idea.</p>
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
            status: when ? "needs_approval" : "idea", scheduledFor: when || undefined,
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
