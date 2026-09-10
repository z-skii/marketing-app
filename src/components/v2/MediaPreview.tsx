"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A media slot that shows a still and, when the viewer can afford it, a
 * short muted preview of the video:
 *
 *   pointer + hover   plays for a few seconds on hover, then rests
 *   touch             plays while at least 60% of it is on screen
 *
 * It stays a still image when the viewer asks for reduced motion, when the
 * connection is metered (Save-Data), or when the source is not a video.
 */
export function MediaPreview({
  src, poster, alt = "", className = "", priority = false, previewSeconds = 3, sizes,
}: {
  src: string | null;
  poster?: string | null;
  alt?: string;
  className?: string;
  priority?: boolean;
  previewSeconds?: number;
  sizes?: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const isVideo = !!src && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);
  // Read the viewer's preferences once, after mount (they are browser facts, not React state).
  const [prefs, setPrefs] = useState<{ canMove: boolean; hover: boolean } | null>(null);
  useEffect(() => {
    if (!isVideo) return;
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const read = () => setPrefs({
      canMove: !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !nav.connection?.saveData,
      hover: window.matchMedia("(hover: hover)").matches,
    });
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", read);
    const t = window.setTimeout(read, 0);
    return () => { mq.removeEventListener("change", read); window.clearTimeout(t); };
  }, [isVideo]);
  const canMove = prefs?.canMove ?? false;
  const hover = prefs?.hover ?? false;

  // Touch screens: play while visible.
  useEffect(() => {
    const el = video.current;
    if (!el || !canMove || hover) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.intersectionRatio >= 0.6) el.play().catch(() => {});
          else el.pause();
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canMove, hover]);

  if (!src) return null;

  if (!isVideo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src} alt={alt} className={className} sizes={sizes}
        loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async"
      />
    );
  }

  const play = () => {
    const el = video.current;
    if (!el || !canMove || !hover) return;
    el.currentTime = 0;
    el.play().catch(() => {});
    window.setTimeout(() => { if (el && !el.paused) el.pause(); }, previewSeconds * 1000);
  };
  const stop = () => { const el = video.current; if (el && hover) { el.pause(); el.currentTime = 0; } };

  return (
    <video
      ref={video}
      src={src}
      poster={poster ?? undefined}
      muted
      playsInline
      loop
      preload={priority ? "auto" : "metadata"}
      className={className}
      aria-label={alt || undefined}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
    />
  );
}
