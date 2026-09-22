"use client";

import { useEffect, useRef, useState } from "react";
import { getVehicle, type CameraPresetKey } from "./catalog";
import type { Placement } from "./placement";

/**
 * A still of the 3D car for cards and lists: rendered once by the shared
 * offscreen renderer (engine/thumbnail.ts) when the card scrolls into
 * view, then shown as an image. Same mesh, same paint, same artwork
 * mapping as the interactive viewer; no WebGL context per card.
 */
export function VehicleThumbnail({ vehicleId, paint = "#B9BCC1", placement = null, preset, width, height, alt = "", className = "", badge = null, reflection = true }: {
  vehicleId?: string;
  paint?: string;
  placement?: Placement | null;
  preset?: CameraPresetKey;
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
  badge?: "demo" | "preview" | null;
  reflection?: boolean;
}) {
  const vehicle = getVehicle(vehicleId);
  const host = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const w = width ?? vehicle.thumbnail.width, h = height ?? vehicle.thumbnail.height;
  const key = JSON.stringify([vehicle.id, paint, placement, preset, w, h, reflection]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let alive = true;
    let io: IntersectionObserver | null = null;
    const run = async () => {
      try {
        const { renderThumbnail } = await import("./engine/thumbnail");
        const url = await renderThumbnail({ vehicleId: vehicle.id, paint, placement, preset, width: w, height: h, reflection });
        if (alive) setSrc(url);
      } catch { if (alive) setFailed(true); }
    };
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { io?.disconnect(); run(); } }, { rootMargin: "300px 0px" });
      io.observe(el);
    } else run();
    return () => { alive = false; io?.disconnect(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div ref={host} className={`v3d-thumb ${src ? "is-ready" : ""} ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} width={w} height={h} draggable={false} />
      ) : failed ? (
        <span className="v3d-thumb-fallback">3D preview unavailable</span>
      ) : (
        <span className="v3d-thumb-skeleton" aria-hidden />
      )}
      {badge && <span className={`v3d-badge-tag is-${badge} v3d-thumb-badge`}>{badge === "demo" ? "Demo vehicle" : "3D preview"}</span>}
    </div>
  );
}
