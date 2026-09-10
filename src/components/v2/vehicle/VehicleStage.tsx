"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const ModelViewer = dynamic(() => import("./ModelViewer"), { ssr: false, loading: () => null });

export type StagePhoto = { angle: string; url: string };

/**
 * The car on stage. Three honest levels, best available first:
 *
 *   1. A reconstructed model (GLB): real 3D, drag to rotate.
 *   2. Angle photos from a scan: drag to turn the car through its photos.
 *   3. One photo: a still.
 *
 * Nothing spins forever. The stage turns a little when it first appears.
 */
export function VehicleStage({
  glbUrl, posterUrl, photos, label, compact = false, fill = false, onAngleChange, children,
}: {
  glbUrl: string | null;
  posterUrl: string | null;
  photos: StagePhoto[];
  label?: string | null;
  compact?: boolean;
  /** Fill the parent (which must be positioned) instead of owning an aspect box; no radius, no background of its own. */
  fill?: boolean;
  /** Fires with the angle currently on stage ("left", "driver_side", "other"). Not called for a 3D model. */
  onAngleChange?: (angle: string) => void;
  /** Overlay slot drawn over the media, under the label. Pointer events pass through to the stage. */
  children?: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const ordered = orderPhotos(photos);
  const stillAngle = glbUrl ? null : ordered.length === 1 ? ordered[0].angle : ordered.length === 0 && posterUrl ? "other" : null;

  // A still has one angle; report it once so overlays can position themselves.
  useEffect(() => {
    if (stillAngle) onAngleChange?.(stillAngle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stillAngle]);

  // Only mount WebGL once the stage is on screen.
  useEffect(() => {
    const el = stage.current;
    if (!el || !glbUrl) return;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setReady(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [glbUrl]);

  const height = compact ? "aspect-[16/10]" : "aspect-[4/3] md:aspect-[16/9]";

  return (
    <div ref={stage} className={fill ? "absolute inset-0 overflow-hidden" : `relative w-full overflow-hidden rounded-[var(--radius-card)] bg-[radial-gradient(ellipse_at_50%_80%,_var(--color-surface-2),_var(--color-paper)_75%)] ${height}`}>
      {glbUrl ? (
        <>
          {posterUrl && !ready && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {ready && <ModelViewer url={glbUrl} />}
          <Hint text="Drag to rotate" />
        </>
      ) : ordered.length >= 2 ? (
        <PhotoTurntable photos={ordered} onAngleChange={onAngleChange} />
      ) : posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      {children && <div className="pointer-events-none absolute inset-0">{children}</div>}
      {label && <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-600 text-ink">{label}</span>}
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return <span className="glass-tag pointer-events-none absolute right-3 bottom-3 px-2.5 py-1 text-xs text-ink-soft">{text}</span>;
}

const ANGLE_ORDER = ["front", "front_left", "left", "driver_side", "rear_left", "rear", "rear_right", "right", "passenger_side", "front_right", "other"];
function orderPhotos(photos: StagePhoto[]) {
  return [...photos].sort((a, b) => ANGLE_ORDER.indexOf(a.angle) - ANGLE_ORDER.indexOf(b.angle));
}

/** Drag or swipe left and right to step through the walk-around photos. */
function PhotoTurntable({ photos, onAngleChange }: { photos: StagePhoto[]; onAngleChange?: (angle: string) => void }) {
  const [i, setI] = useState(0);
  const angle = photos[i]?.angle ?? "other";
  useEffect(() => { onAngleChange?.(angle); }, [angle, onAngleChange]);
  const drag = useRef<{ x: number; start: number } | null>(null);
  const done = useRef(false);
  const box = useRef<HTMLDivElement>(null);

  // First appearance: a short partial turn, then rest.
  useEffect(() => {
    const el = box.current;
    if (!el || done.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting) || done.current) return;
      done.current = true;
      io.disconnect();
      if (reduced || photos.length < 3) return;
      let n = 0;
      const t = window.setInterval(() => { n += 1; setI((v) => (v + 1) % photos.length); if (n >= 2) window.clearInterval(t); }, 420);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [photos.length]);

  const stepFor = (dx: number) => Math.round(dx / 40);

  return (
    <div
      ref={box}
      className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
      onPointerDown={(e) => { drag.current = { x: e.clientX, start: i }; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const s = stepFor(e.clientX - drag.current.x);
        setI(((drag.current.start - s) % photos.length + photos.length) % photos.length);
      }}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      role="img"
      aria-label={`Vehicle, ${photos[i].angle.replaceAll("_", " ")} view. Drag to rotate.`}
    >
      {photos.map((p, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p.url}
          src={p.url}
          alt=""
          draggable={false}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${k === i ? "opacity-100" : "opacity-0"}`}
          loading={k < 2 ? "eager" : "lazy"}
        />
      ))}
      <Hint text="Drag to rotate" />
    </div>
  );
}
