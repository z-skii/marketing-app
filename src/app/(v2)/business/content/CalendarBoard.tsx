"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretRight, CheckCircle, Circle, FilmStrip, Image as ImageIcon, Plus } from "@phosphor-icons/react";
import { StatusChip } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { deleteCalendarPost, upsertCalendarPost } from "../actions";
import { approveAllAction, movePostAction, proposeMonthAction } from "./schedule-actions";
import { FORMAT_LABEL, dayLabel, dayKeyOf, monthGrid, monthLabel, postWhen, timeOf } from "./dates";
import type { CalendarPost, PostFormat } from "./types";

const PLATFORMS = [
  ["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"],
  ["google_business", "Google"], ["other", "Other"],
] as const;

/** The 2px underline under each day: one segment per post, coloured by its real status. */
const BAR: Record<string, string> = {
  idea: "bg-ink-faint/40", draft: "bg-ink-faint/40", needs_approval: "bg-alert",
  approved: "bg-signal", scheduled: "bg-signal", published: "bg-rise", failed: "bg-alert",
};
const WAITING = ["idea", "draft", "needs_approval"];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * One month of the content calendar: a seven-column grid of thumbnails,
 * one primary action for the month (plan it, then approve it), and the
 * posts underneath filtered by the tapped day.
 */
export function CalendarBoard({
  businessId, month, timeZone, todayKey, initialDay, posts, canAutoPost, canApprove,
}: {
  businessId: string;
  month: string;
  timeZone: string;
  todayKey: string;
  initialDay: string | null;
  posts: CalendarPost[];
  canAutoPost: boolean;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [day, setDay] = useState<string | null>(initialDay);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarPost[]>();
    for (const p of posts) {
      const when = postWhen(p);
      if (!when) continue;
      const key = dayKeyOf(when, timeZone);
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return map;
  }, [posts, timeZone]);

  const cells = useMemo(() => monthGrid(month), [month]);

  const counts = useMemo(() => {
    const out = { reel: 0, photo: 0, story: 0, post: 0 };
    for (const p of posts) out[(p.format ?? "post") as PostFormat] += 1;
    return out;
  }, [posts]);
  const planned = posts.some((p) => p.source !== "manual");
  const waiting = posts.some((p) => WAITING.includes(p.status));
  const sourceLabel = posts.some((p) => p.source === "ai") ? "Planned by AI" : planned ? "Planned by template" : null;

  const shown = useMemo(() => {
    const list = day ? (byDay.get(day) ?? []) : posts;
    const at = (p: CalendarPost) => { const w = postWhen(p); return w ? new Date(w).getTime() : Number.MAX_SAFE_INTEGER; };
    return [...list].sort((a, b) => at(a) - at(b));
  }, [day, byDay, posts]);

  const pick = (key: string) => {
    const next = day === key ? null : key;
    setDay(next);
    setAdding(false);
    window.history.replaceState(null, "", next ? `/business/content?day=${next}` : "/business/content");
  };

  const run = (work: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const result = await work();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      else router.refresh();
    });

  const metaParts = [
    counts.reel > 0 && `${counts.reel} ${counts.reel === 1 ? "Reel" : "Reels"}`,
    counts.photo > 0 && `${counts.photo} ${counts.photo === 1 ? "photo" : "photos"}`,
    counts.story > 0 && `${counts.story} ${counts.story === 1 ? "Story" : "Stories"}`,
    counts.post > 0 && `${counts.post} ${counts.post === 1 ? "post" : "posts"}`,
    sourceLabel,
  ].filter(Boolean) as string[];

  return (
    <div>
      {/* ------------------------------------------------ month summary */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-[1.0625rem] leading-tight font-700">
            {posts.length === 0 ? `Nothing planned for ${monthLabel(month).split(" ")[0]}` : `${posts.length} ${posts.length === 1 ? "post" : "posts"} planned`}
          </p>
          {metaParts.length > 0 && <p className="mt-0.5 text-sm text-ink-faint">{metaParts.join(" · ")}</p>}
        </div>
        {!planned ? (
          <button type="button" disabled={pending} className="btn btn-signal shrink-0" onClick={() => run(() => proposeMonthAction(month))}>
            {pending ? "Planning" : "Plan my month"}
          </button>
        ) : waiting && canApprove ? (
          <button type="button" disabled={pending} className="btn btn-signal shrink-0" onClick={() => run(() => approveAllAction(month))}>
            Approve all
          </button>
        ) : !waiting ? (
          <span className="flex shrink-0 items-center gap-1.5 text-sm text-rise"><CheckCircle size={18} weight="fill" aria-hidden />All approved</span>
        ) : null}
      </div>
      {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}

      {/* ---------------------------------------------------- the grid */}
      <div className="mt-4 grid grid-cols-7 gap-0.5" role="group" aria-label={monthLabel(month)}>
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="pb-1 text-center font-mono text-[0.6875rem] tracking-[0.14em] text-ink-faint" aria-hidden>{w}</span>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <span key={`blank-${i}`} aria-hidden />;
          const dayPosts = byDay.get(cell.key) ?? [];
          const selected = day === cell.key;
          const isToday = cell.key === todayKey;
          return (
            <button
              key={cell.key}
              type="button"
              aria-pressed={selected}
              aria-label={`${dayLabel(cell.key)}, ${dayPosts.length} ${dayPosts.length === 1 ? "post" : "posts"}`}
              onClick={() => pick(cell.key)}
              className={`flex flex-col rounded-lg p-1 text-left transition-colors ${selected ? "bg-surface-2 ring-2 ring-signal" : "can-hover:hover:bg-surface"}`}
            >
              <span className={`tnum inline-flex h-4 min-w-4 items-center justify-center self-start rounded-full px-1 font-display text-[0.6875rem] leading-none font-700 ${isToday ? "bg-ink text-paper" : dayPosts.length ? "text-ink" : "text-ink-faint"}`}>
                {cell.day}
              </span>
              <span className="mt-1 grid aspect-[2/1] w-full grid-cols-2 gap-0.5">
                {dayPosts.slice(0, 2).map((p) => (
                  <span key={p.id} className={`block overflow-hidden rounded-[3px] bg-surface-2 ${dayPosts.length === 1 ? "col-span-2" : ""}`}>
                    <Thumb post={p} size="cell" />
                  </span>
                ))}
              </span>
              <span className="mt-1 flex h-0.5 w-full gap-px" aria-hidden>
                {dayPosts.slice(0, 4).map((p) => (
                  <span key={p.id} className={`h-0.5 flex-1 rounded-full ${BAR[p.status] ?? "bg-ink-faint/40"}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------- posts */}
      <section className="mt-6" aria-label="Posts">
        <div className="flex items-center justify-between gap-3">
          <h2 className="eyebrow min-w-0 truncate">Posts{day ? ` · ${dayLabel(day, { weekday: false })}` : ` · ${monthLabel(month).split(" ")[0]}`}</h2>
          <div className="flex shrink-0 items-center gap-1">
            {day && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => pick(day)}>Whole month</button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" aria-expanded={adding} onClick={() => setAdding((v) => !v)}>
              {adding ? "Close" : <><Plus size={16} weight="bold" aria-hidden />Add</>}
            </button>
          </div>
        </div>

        {adding && (
          <AddPostForm businessId={businessId} day={day} onDone={() => { setAdding(false); router.refresh(); }} />
        )}

        {shown.length === 0 ? (
          <p className="mt-3 py-4 text-sm text-ink-soft">
            {day ? `Nothing on ${dayLabel(day, { weekday: false })}.` : "No posts this month yet."}
          </p>
        ) : (
          <ul className="mt-1 divide-y divide-rule">
            {shown.map((p, i) => (
              <PostRow
                key={p.id} post={p} index={i} businessId={businessId} timeZone={timeZone}
                canAutoPost={canAutoPost} canDelete={canApprove} pending={pending} run={run}
              />
            ))}
          </ul>
        )}

        {!canAutoPost && (
          <div className="rule mt-3 pt-3">
            <p className="text-sm text-ink-soft">Posting for you needs a connected account. Mark posts published yourself.</p>
            <Link href="/business/connections" className="link-row">Connect an account<CaretRight size={16} aria-hidden /></Link>
          </div>
        )}
      </section>
    </div>
  );
}

/** A post's thumbnail, or the glyph of its format when it has no media yet. */
function Thumb({ post, size }: { post: CalendarPost; size: "cell" | "row" }) {
  if (post.thumbnail_url) {
    return <MediaPreview src={post.thumbnail_url} alt="" className="h-full w-full object-cover" sizes={size === "row" ? "56px" : "48px"} />;
  }
  const px = size === "row" ? 24 : 14;
  const Icon = post.format === "reel" ? FilmStrip : post.format === "story" ? Circle : ImageIcon;
  return (
    <span className="flex h-full w-full items-center justify-center text-ink-faint">
      <Icon size={px} aria-hidden />
    </span>
  );
}

function PostRow({
  post, index, businessId, timeZone, canAutoPost, canDelete, pending, run,
}: {
  post: CalendarPost;
  index: number;
  businessId: string;
  timeZone: string;
  canAutoPost: boolean;
  canDelete: boolean;
  pending: boolean;
  run: (work: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [when, setWhen] = useState("");
  const at = postWhen(post);
  const meta = [
    FORMAT_LABEL[post.format ?? "post"],
    at ? `${dayLabel(dayKeyOf(at, timeZone), { weekday: false })} · ${timeOf(at, timeZone)}` : "No date",
  ].join(" · ");

  const setStatus = (status: string) =>
    run(() => upsertCalendarPost({
      id: post.id, businessId, platform: post.platform, title: post.title,
      copy: post.copy ?? "", status, scheduledFor: post.scheduled_for ?? undefined,
    }));

  return (
    <li className="reveal" style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 py-3 text-left">
        <span className="block h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
          <Thumb post={post} size="row" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[1.0625rem] leading-tight font-700">{post.title}</span>
          <span className="mt-0.5 block truncate text-sm text-ink-faint">{meta}</span>
        </span>
        <StatusChip status={post.status} />
      </button>

      {open && (
        <div className="pb-4 pl-[4.25rem]">
          {(post.caption ?? post.copy) && (
            <p className="line-clamp-3 text-sm whitespace-pre-wrap text-ink-soft">{post.caption ?? post.copy}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {WAITING.includes(post.status) && (
              <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus(post.scheduled_for ? "scheduled" : "approved")}>Approve</button>
            )}
            {["approved", "scheduled"].includes(post.status) && (
              <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus("published")}>
                {canAutoPost ? "Mark published" : "Mark published yourself"}
              </button>
            )}
            {post.status === "failed" && (
              <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus("scheduled")}>Try again</button>
            )}
            {post.status !== "published" && (
              <button type="button" className="btn btn-ghost btn-sm" aria-expanded={moving} onClick={() => setMoving((v) => !v)}>
                {moving ? "Cancel" : "Move"}
              </button>
            )}
            {canDelete && (
              <button
                type="button" disabled={pending} className="btn btn-ghost btn-sm ml-auto"
                onClick={() => run(() => deleteCalendarPost(post.id, businessId))}
              >
                Delete
              </button>
            )}
          </div>
          {moving && (
            <div className="mt-2 flex items-center gap-2">
              <input type="datetime-local" className="field min-w-0 flex-1" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="New date and time" />
              <button
                type="button" disabled={pending || !when} className="btn btn-sm"
                onClick={() => run(async () => { const r = await movePostAction(post.id, when); if (r.ok) setMoving(false); return r; })}
              >
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function AddPostForm({ businessId, day, onDone }: { businessId: string; day: string | null; onDone: () => void }) {
  const [platform, setPlatform] = useState("instagram");
  const [title, setTitle] = useState("");
  const [copy, setCopy] = useState("");
  const [when, setWhen] = useState(day ? `${day}T11:00` : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="card mt-3 p-4">
      <div className="grid grid-cols-2 gap-2">
        <select className="field" value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
          {PLATFORMS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input type="datetime-local" className="field min-w-0" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Scheduled for" />
      </div>
      <input className="field mt-2 w-full" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title or idea" aria-label="Post title" />
      <textarea className="field mt-2 min-h-20 w-full" maxLength={4000} value={copy} onChange={(e) => setCopy(e.target.value)} placeholder="Caption (optional)" aria-label="Caption" />
      {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
      <button
        type="button" disabled={pending || !title.trim()} className="btn mt-3"
        onClick={() => startTransition(async () => {
          const result = await upsertCalendarPost({
            businessId, platform, title, copy,
            status: when ? "needs_approval" : "idea", scheduledFor: when || undefined,
          });
          if (!result.ok) setError(result.error ?? "Failed.");
          else onDone();
        })}
      >
        {pending ? "Adding" : "Add post"}
      </button>
    </div>
  );
}
