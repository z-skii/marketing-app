"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

/** Previous and Next advance a native shelf or ribbon by one object over 220ms; reduced motion jumps. */
export function ShelfButton({ dir, target = "car-shelf", step = 360, label = "cars" }: { dir: -1 | 1; target?: string; step?: number; label?: string }) {
  return (
    <button type="button" className="icon-btn" aria-label={dir < 0 ? `Previous ${label}` : `Next ${label}`} style={{ border: "1px solid var(--tm-control-border)" }}
      onClick={(e) => { const root = (e.currentTarget.closest("[data-shelf-root]") as HTMLElement | null) ?? document; const el = root.querySelector<HTMLElement>(`[data-shelf="${target}"]`); if (el) el.scrollBy({ left: step * dir, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }}>
      {dir < 0 ? <CaretLeft size={20} /> : <CaretRight size={20} />}
    </button>
  );
}
