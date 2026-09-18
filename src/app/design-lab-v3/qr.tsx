"use client";

import { create } from "qrcode";
import { useMemo } from "react";

/**
 * A real, scannable QR rendered as inline SVG from the qrcode module
 * matrix. In the lab it encodes the lab's own signup URL or a member code;
 * nothing about it is simulated except what the URL leads to.
 */
export function QR({ value, size = 160, label, className = "", quiet = 2, ink = "currentColor", paper = "transparent" }: { value: string; size?: number; label: string; className?: string; quiet?: number; ink?: string; paper?: string }) {
  const cells = useMemo(() => {
    const q = create(value, { errorCorrectionLevel: "M" });
    const n = q.modules.size;
    const rects: string[] = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules.get(y, x)) rects.push(`M${x + quiet} ${y + quiet}h1v1h-1z`);
    return { n: n + quiet * 2, d: rects.join("") };
  }, [value, quiet]);
  return (
    <svg className={`qr ${className}`} viewBox={`0 0 ${cells.n} ${cells.n}`} width={size} height={size} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={cells.n} height={cells.n} fill={paper} />
      <path d={cells.d} fill={ink} />
    </svg>
  );
}
