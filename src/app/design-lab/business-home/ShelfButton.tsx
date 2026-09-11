"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";

/** Previous and Next advance the native car shelf by exactly 360px (one 336px object plus its 24px gap). */
export function ShelfButton({ dir }: { dir: -1 | 1 }) {
  return (
    <button type="button" className="icon-btn" aria-label={dir < 0 ? "Previous cars" : "Next cars"} style={{ border: "1px solid var(--tm-control-border)" }}
      onClick={() => { const el = document.getElementById("car-shelf"); if (el) el.scrollBy({ left: 360 * dir, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }}>
      {dir < 0 ? <CaretLeft size={20} /> : <CaretRight size={20} />}
    </button>
  );
}
