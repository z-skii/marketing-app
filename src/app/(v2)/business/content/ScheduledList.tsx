"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretRight, X } from "@phosphor-icons/react";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { markPublishedAction } from "./schedule-actions";
import { dayLabel, dayKeyOf, timeOf } from "./dates";
import { postKindLabel, type ScheduledPost } from "./types";

/**
 * One scheduled or published post as a compact row: thumbnail, one line of
 * caption, platform and date, its state, and a chevron. The row opens the
 * post: its media full size and, until an account posts for the business,
 * the manual "Mark published" action.
 */
export function ScheduledItem({ post, timeZone, index }: { post: ScheduledPost; timeZone: string; index: number }) {
  const [open, setOpen] = useState(false);
  const published = post.status === "published";
  const vertical = post.format === "story" || post.format === "reel";
  const when = `${dayLabel(dayKeyOf(post.when, timeZone), { weekday: false })} · ${timeOf(post.when, timeZone)}`;

  return (
    <li className="reveal" style={{ animationDelay: `${Math.min(index, 4) * 35}ms` }}>
      <button
        type="button" onClick={() => setOpen(true)} aria-label={`${post.title}, ${published ? "published" : "scheduled"} ${when}`}
        className="row flex min-h-[84px] w-full items-center gap-3 p-3 text-left transition-[background,transform] duration-100 active:scale-[0.985] active:bg-[color:var(--tm-pressed)]"
      >
        <span className={`relative shrink-0 overflow-hidden bg-surface-2 ${vertical ? "h-16 w-12 rounded-[12px]" : "h-14 w-14 rounded-[13px]"}`}>
          <MediaPreview src={post.url} poster={post.thumbnail_url} alt="" className="h-full w-full object-cover" sizes="64px" />
        </span>
        <span className="min-w-0 flex-1 self-stretch py-0.5">
          <span className="flex items-start justify-between gap-2">
            <span className="truncate font-display text-[14px] leading-[18px] font-700 tracking-[-0.1px]">{post.title}</span>
            <span className={`status-text shrink-0 ${published ? "is-done" : "is-warning"}`}><span aria-hidden className="status-dot" />{published ? "Done" : "Pending"}</span>
          </span>
          <span className="mt-0.5 block truncate text-[12px] leading-4 text-ink-soft">{postKindLabel(post.platform, post.format)} · {when}</span>
        </span>
        <CaretRight size={18} className="shrink-0 self-end text-ink-soft" aria-hidden />
      </button>
      {open && <PostSheet post={post} when={when} onClose={() => setOpen(false)} />}
    </li>
  );
}

function PostSheet({ post, when, onClose }: { post: ScheduledPost; when: string; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const published = post.status === "published";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={post.title} className="glass fixed inset-0 z-50 flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
        <div className="min-w-0">
          <p className="truncate font-display text-[16px] leading-5 font-[760]">{post.title}</p>
          <p className="truncate text-[12px] leading-4 text-ink-soft">{postKindLabel(post.platform, post.format)} · {when}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="iconbtn is-surface shrink-0"><X size={22} aria-hidden /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto w-full max-w-lg">
          <div className="overflow-hidden rounded-[16px] bg-paper-deep">
            {post.kind === "video" ? (
              <video src={post.url} poster={post.thumbnail_url ?? undefined} controls muted autoPlay playsInline loop className="mx-auto max-h-[60vh] w-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.url} alt="" className="mx-auto max-h-[60vh] w-full object-contain" />
            )}
          </div>
          {post.caption && <p className="mt-3 text-[13px] leading-[18px] whitespace-pre-wrap text-ink-soft">{post.caption}</p>}
          <p className={`status-text mt-4 ${published ? "is-done" : "is-warning"}`}><span aria-hidden className="status-dot" />{published ? "Published" : "Scheduled, posted by you"}</p>
          {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
          {!published && (
            <button
              type="button" disabled={pending} className="btn btn-signal mt-4 w-full"
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const r = await markPublishedAction(post.deliverable_id);
                  if (!r.ok) setError(r.error);
                  else { router.refresh(); onClose(); }
                });
              }}
            >
              {pending ? "Saving" : "Mark published"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
