"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "@phosphor-icons/react";

/**
 * The bounded work preview: a directly available Recreate reference plays
 * muted and inline for at most six seconds, once, after the object has been
 * at least 75% visible for 500ms. A persistent 44px Pause/Play control
 * stays outside the money and conditions. Reduced motion, Save-Data and a
 * missing source get the poster and an explicit Play.
 */
export function RecreatePreview({ poster, src }: { poster: string; src: string | null }) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);

  useEffect(() => {
    if (!src || played || !box.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (reduce || conn?.saveData || /2g/.test(conn?.effectiveType ?? "")) return;
    let timer: number | null = null;
    const io = new IntersectionObserver(([e]) => {
      if (e.intersectionRatio >= 0.75 && !timer) {
        timer = window.setTimeout(() => {
          video.current?.play().then(() => { setPlaying(true); setPlayed(true); window.setTimeout(() => { video.current?.pause(); setPlaying(false); }, 6000); }).catch(() => {});
        }, 500);
      } else if (e.intersectionRatio < 0.5) {
        if (timer) { window.clearTimeout(timer); timer = null; }
        if (video.current && !video.current.paused) { video.current.pause(); setPlaying(false); }
      }
    }, { threshold: [0.5, 0.75] });
    io.observe(box.current);
    return () => { io.disconnect(); if (timer) window.clearTimeout(timer); };
  }, [src, played]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); } else { v.pause(); setPlaying(false); }
  };

  return (
    <div ref={box} style={{ position: "relative", width: 160, height: 284, background: "var(--tm-stage)" }}>
      {src ? (
        <video ref={video} src={src} poster={poster} muted playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="Reference Reel: a barista pouring a latte in a cafe" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <button type="button" onClick={toggle} className="play" style={{ left: 8, bottom: 8 }} aria-label={playing ? "Pause preview" : "Play preview"}>
        {playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
      </button>
      <span className="t-meta" style={{ position: "absolute", top: 8, left: 8, color: "var(--tm-on-dark)", background: "rgba(16,24,32,0.72)", padding: "2px 6px", borderRadius: 4, fontSize: 12, lineHeight: "16px" }}>Reference</span>
    </div>
  );
}
