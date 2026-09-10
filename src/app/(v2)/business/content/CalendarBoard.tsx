"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretRight, CheckCircle, Circle, FilmStrip, Image as ImageIcon, Plus } from "@phosphor-icons/react";
import { Chip } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Uploader } from "@/components/v2/Uploader";
import { deleteCalendarPost, upsertCalendarPost } from "../actions";
import {
  approveAllAction, editPostAction, movePostAction, proposeMonthAction, replacePostMediaAction, schedulePostAction,
} from "./schedule-actions";
import { FORMAT_LABEL, dayLabel, dayKeyOf, monthGrid, monthLabel, postWhen, timeOf } from "./dates";
import { contentStatusLabel, contentStatusTone, type CalendarPost, type PostFormat } from "./types";

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

type Result = { ok: boolean; error?: string };
type Run = (work: () => Promise<Result>) => void;

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** "8 ready · 3 scheduled · 1 needs approval": only the parts that are not zero. */
function statusSummary(posts: CalendarPost[]): string {
  const n = (s: string) => posts.filter((p) => p.status === s).length;
  const parts = [
    n("published") > 0 && `${n("published")} published`,
    n("scheduled") > 0 && `${n("scheduled")} scheduled`,
    n("approved") > 0 && `${n("approved")} ready`,
    n("needs_approval") > 0 && `${n("needs_approval")} ${n("needs_approval") === 1 ? "needs" : "need"} approval`,
    n("draft") > 0 && plural(n("draft"), "draft", "drafts"),
    n("idea") > 0 && plural(n("idea"), "idea", "ideas"),
    n("failed") > 0 && `${n("failed")} failed`,
  ].filter(Boolean) as string[];
  return parts.join(" · ");
}

/** Local wall-clock "YYYY-MM-DDTHH:MM" for a datetime-local input, in the business time zone. */
function localInputValue(iso: string | null, timeZone: string): string {
  if (!iso) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/**
 * The month's workspace: the plan and its one action, the seven-column
 * calendar, whatever the page puts between (the next shoot), and the posts
 * underneath filtered by the tapped day.
 */
export function CalendarBoard({
  businessId, month, timeZone, todayKey, initialDay, posts, canAutoPost, canApprove, between,
}: {
  businessId: string;
  month: string;
  timeZone: string;
  todayKey: string;
  initialDay: string | null;
  posts: CalendarPost[];
  canAutoPost: boolean;
  canApprove: boolean;
  /** Server-rendered content shown between the calendar and the posts. */
  between?: ReactNode;
}) {
  const router = useRouter();
  const [day, setDay] = useState<string | null>(initialDay);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const monthName = monthLabel(month).split(" ")[0];

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

  const run: Run = (work) =>
    startTransition(async () => {
      setError(null);
      const result = await work();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      else router.refresh();
    });

  const planParts = [
    counts.reel > 0 && plural(counts.reel, "Reel", "Reels"),
    counts.photo > 0 && plural(counts.photo, "Photo", "Photos"),
    counts.story > 0 && plural(counts.story, "Story", "Stories"),
    counts.post > 0 && plural(counts.post, "Post", "Posts"),
  ].filter(Boolean) as string[];
  const summary = statusSummary(posts);

  return (
    <div>
      {/* ------------------------------------------------ this month */}
      <section aria-labelledby="month-title">
        <h2 id="month-title" className="eyebrow">{monthName} content</h2>
        <p className="mt-2 font-display text-[2.5rem] leading-none font-800 tracking-[-0.03em]">
          <span className="tnum">{posts.length}</span>
          <span className="ml-2 font-display text-[1.0625rem] font-700 tracking-normal text-ink-soft">
            {posts.length === 1 ? "post planned" : "posts planned"}
          </span>
        </p>
        {summary && <p className="settle mt-1.5 text-sm text-ink-soft">{summary}</p>}

        <h2 className="eyebrow mt-6">Your {monthName} plan</h2>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <p className="font-display text-[1.0625rem] leading-tight font-700">
              {planParts.length > 0 ? planParts.join(" · ") : "Nothing planned yet"}
            </p>
            {sourceLabel && <p className="mt-0.5 text-sm text-ink-faint">{sourceLabel}</p>}
          </div>
          {!planned ? (
            <button type="button" disabled={pending} className="btn btn-signal w-full sm:w-auto" onClick={() => run(() => proposeMonthAction(month))}>
              {pending ? "Planning" : "Plan my month"}
            </button>
          ) : waiting && canApprove ? (
            <button type="button" disabled={pending} className="btn btn-signal w-full sm:w-auto" onClick={() => run(() => approveAllAction(month))}>
              Approve all
            </button>
          ) : !waiting ? (
            <span className="flex shrink-0 items-center gap-1.5 text-sm text-rise"><CheckCircle size={18} weight="fill" aria-hidden />All approved</span>
          ) : null}
        </div>
        {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}

        {/* ---------------------------------------------------- the grid */}
        <div className="mt-5 grid grid-cols-7 gap-0.5" role="group" aria-label={monthLabel(month)}>
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
      </section>

      {between}

      {/* ------------------------------------------------------- posts */}
      <section className="mt-9" aria-label="Posts">
        <div className="flex items-center justify-between gap-3">
          <h2 className="eyebrow min-w-0 truncate">Posts{day ? ` · ${dayLabel(day, { weekday: false })}` : ` · ${monthName}`}</h2>
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
  const src = post.thumbnail_url ?? post.media_urls[0] ?? null;
  if (src) {
    return <MediaPreview src={src} alt="" className="h-full w-full object-cover" sizes={size === "row" ? "56px" : "48px"} />;
  }
  const px = size === "row" ? 24 : 14;
  const Icon = post.format === "reel" ? FilmStrip : post.format === "story" ? Circle : ImageIcon;
  return (
    <span className="flex h-full w-full items-center justify-center text-ink-faint">
      <Icon size={px} aria-hidden />
    </span>
  );
}

export function PostStatusChip({ status }: { status: string }) {
  return <Chip tone={contentStatusTone(status)}>{contentStatusLabel(status)}</Chip>;
}

type Panel = "move" | "replace" | "edit" | "schedule" | null;

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
  run: Run;
}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [when, setWhen] = useState("");
  const [title, setTitle] = useState(post.title);
  const [caption, setCaption] = useState(post.caption ?? post.copy ?? "");
  const at = postWhen(post);
  const meta = [
    FORMAT_LABEL[post.format ?? "post"],
    at ? `${dayLabel(dayKeyOf(at, timeZone), { weekday: false })} · ${timeOf(at, timeZone)}` : "No date",
  ].join(" · ");

  const toggle = (next: Exclude<Panel, null>) => {
    if (panel === next) { setPanel(null); return; }
    if (next === "move" || next === "schedule") setWhen(localInputValue(at, timeZone));
    if (next === "edit") { setTitle(post.title); setCaption(post.caption ?? post.copy ?? ""); }
    setPanel(next);
  };

  const setStatus = (status: string) =>
    run(() => upsertCalendarPost({
      id: post.id, businessId, platform: post.platform, title: post.title,
      copy: post.copy ?? "", status, scheduledFor: post.scheduled_for ?? undefined,
    }));

  const finish = (work: () => Promise<Result>) =>
    run(async () => { const r = await work(); if (r.ok) setPanel(null); return r; });

  const editable = post.status !== "published";

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
        <PostStatusChip status={post.status} />
      </button>

      {open && (
        <div className="pb-4 pl-[4.25rem]">
          {panel !== "edit" && (post.caption ?? post.copy) && (
            <p className="line-clamp-3 text-sm whitespace-pre-wrap text-ink-soft">{post.caption ?? post.copy}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {WAITING.includes(post.status) && (
              <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus(post.scheduled_for ? "scheduled" : "approved")}>Approve</button>
            )}
            {post.status === "approved" && (
              <button type="button" disabled={pending} className="btn btn-sm" aria-expanded={panel === "schedule"} onClick={() => toggle("schedule")}>
                Schedule
              </button>
            )}
            {["approved", "scheduled"].includes(post.status) && (
              <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus("published")}>
                {canAutoPost ? "Mark published" : "Mark published yourself"}
              </button>
            )}
            {post.status === "failed" && (
              <button type="button" disabled={pending} className="btn btn-sm" onClick={() => setStatus("scheduled")}>Try again</button>
            )}
            {editable && (
              <>
                <button type="button" className="btn btn-ghost btn-sm" aria-expanded={panel === "move"} onClick={() => toggle("move")}>
                  Move
                </button>
                <button type="button" className="btn btn-ghost btn-sm" aria-expanded={panel === "replace"} onClick={() => toggle("replace")}>
                  Replace
                </button>
                <button type="button" className="btn btn-ghost btn-sm" aria-expanded={panel === "edit"} onClick={() => toggle("edit")}>
                  Edit
                </button>
              </>
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

          {(panel === "move" || panel === "schedule") && (
            <div className="mt-2 flex items-center gap-2">
              <input type="datetime-local" className="field min-w-0 flex-1" value={when} onChange={(e) => setWhen(e.target.value)} aria-label={panel === "move" ? "New date and time" : "Publish date and time"} />
              <button
                type="button" disabled={pending || !when} className="btn btn-sm"
                onClick={() => finish(() => panel === "move" ? movePostAction(post.id, when) : schedulePostAction(post.id, when))}
              >
                {panel === "move" ? "Save" : "Schedule"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPanel(null)}>Cancel</button>
            </div>
          )}

          {panel === "replace" && (
            <div className="mt-2">
              <div className="flex flex-wrap items-center gap-2">
                <Uploader
                  folder="business" accept="image/*,video/*" label="Choose a photo or video" id={`replace-${post.id}`}
                  onUploaded={(urls) => { if (urls[0]) finish(() => replacePostMediaAction(post.id, urls[0])); }}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPanel(null)}>Cancel</button>
              </div>
            </div>
          )}

          {panel === "edit" && (
            <div className="mt-2">
              <input className="field w-full" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Post title" />
              <textarea className="field mt-2 min-h-20 w-full" maxLength={4000} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" aria-label="Caption" />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button" disabled={pending || !title.trim()} className="btn btn-sm"
                  onClick={() => finish(() => editPostAction(post.id, { title, caption }))}
                >
                  Save
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPanel(null)}>Cancel</button>
              </div>
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
