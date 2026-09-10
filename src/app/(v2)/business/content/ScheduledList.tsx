"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Play } from "@phosphor-icons/react";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { markPublishedAction } from "./schedule-actions";
import { postKindLabel, type ScheduledPost } from "./types";

/**
 * One scheduled or published post: the real media (a video plays inline,
 * muted, on tap), when it goes out, where, and its state. Posting itself is
 * manual until an account is connected, so a scheduled post can be marked
 * published from here.
 */
export function ScheduledItem({ post, time, index }: { post: ScheduledPost; time: string; index: number }) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const video = box.current?.querySelector("video");
    if (!video) return;
    if (video.paused) { video.play().then(() => setPlaying(true)).catch(() => {}); }
    else { video.pause(); setPlaying(false); }
  };

  const published = post.status === "published";
  const media = (
    <MediaPreview src={post.url} poster={post.thumbnail_url} alt="" className="h-full w-full object-cover" sizes="(min-width: 768px) 176px, 40vw" />
  );

  return (
    <li className="reveal flex gap-4 py-4" style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
      <div ref={box} className="relative w-[38%] max-w-44 shrink-0 overflow-hidden rounded-[12px] bg-surface-2">
        {post.kind === "video" ? (
          <button type="button" onClick={toggle} aria-pressed={playing} aria-label={playing ? "Pause video" : "Play video"} className="block aspect-[4/5] w-full text-left">
            {media}
            {!playing && (
              <span className="glass-tag absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full text-ink" aria-hidden>
                <Play size={16} weight="fill" />
              </span>
            )}
          </button>
        ) : (
          <div className="aspect-[4/5] w-full">{media}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="tnum font-display text-[1.375rem] leading-none font-700 tracking-[-0.02em]">{time}</p>
        <p className="mt-1.5 text-sm text-ink-soft">{postKindLabel(post.platform, post.format)}</p>
        <p className="mt-2 line-clamp-2 font-display text-[1.0625rem] leading-tight font-600">{post.title}</p>
        <p className={`mt-2 flex items-center gap-1.5 text-sm font-600 ${published ? "text-rise" : "text-ink"}`}>
          <CheckCircle size={16} weight="fill" aria-hidden />
          {published ? "Published" : "Scheduled"}
        </p>
        {!published && (
          <button
            type="button" disabled={pending} className="btn btn-ghost btn-sm -ml-3 mt-1"
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const r = await markPublishedAction(post.deliverable_id);
                if (!r.ok) setError(r.error);
                else router.refresh();
              });
            }}
          >
            {pending ? "Saving" : "Mark published"}
          </button>
        )}
        {error && <p role="alert" className="mt-1 text-sm alert-text">{error}</p>}
      </div>
    </li>
  );
}
