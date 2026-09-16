"use client";

import { useEffect, useRef, useState } from "react";

/** A fixture image that keeps its reserved ratio and shows a plain labelled fallback when the file is missing or fails. */
export function Img({ src, alt, fallback = "Media unavailable", fit = "cover", position, className = "" }: { src: string | null; alt: string; fallback?: string; fit?: "cover" | "contain"; position?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);
  if (!src || failed) return <span className={`media-fallback ${className}`} style={{ position: "absolute", inset: 0 }} role="img" aria-label={`${alt}: ${fallback}`}>{fallback}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} className={className} style={{ objectFit: fit, objectPosition: position }} onError={() => setFailed(true)} />;
}
