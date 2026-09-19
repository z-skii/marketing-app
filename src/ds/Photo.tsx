"use client";

import { useState, type CSSProperties } from "react";
import { ImageIcon } from "./icons";
import type { PhotoSet } from "./photos";

/**
 * Photography with a loading surface and an honest fallback: the frame
 * shows the quiet surface until the file arrives, fades the picture in,
 * and shows a plain placeholder (never a stock illustration) if it fails.
 */
export function Photo({ set, src, alt, sizes = "100vw", ratio, className = "", style, priority = false, position, radius }: {
  set?: PhotoSet; src?: string | null; alt: string; sizes?: string; ratio?: string; className?: string; style?: CSSProperties; priority?: boolean; position?: string; radius?: number | string;
}) {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const source = set?.src ?? src ?? null;
  const frameStyle: CSSProperties = { aspectRatio: ratio, borderRadius: radius, ...style };
  if (!source || state === "failed") {
    return (
      <div className={`media-frame ${className}`} style={frameStyle} role={alt ? "img" : undefined} aria-label={alt || undefined}>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--tm-muted2)" }}><ImageIcon size={28} aria-hidden /></div>
      </div>
    );
  }
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={set?.fallback ?? source} srcSet={set ? undefined : undefined} sizes={sizes} alt={alt}
      loading={priority ? "eager" : "lazy"} decoding={priority ? "sync" : "async"} fetchPriority={priority ? "high" : undefined}
      onLoad={() => setState("ready")} onError={() => setState("failed")}
      style={{ opacity: state === "ready" ? 1 : 0, transition: "opacity 480ms var(--tm-ease)", objectPosition: position }}
    />
  );
  return (
    <div className={`media-frame ${className}`} style={frameStyle}>
      {set ? (
        <picture>
          <source type={set.type} srcSet={set.srcSet} sizes={sizes} />
          {img}
        </picture>
      ) : img}
      {state === "loading" && <div className="skeleton" aria-hidden style={{ position: "absolute", inset: 0, borderRadius: 0 }} />}
    </div>
  );
}
