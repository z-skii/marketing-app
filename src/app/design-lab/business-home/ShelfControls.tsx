"use client";

import { useEffect, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

/**
 * Previous and Next for a native shelf or ribbon. They read the real
 * scroll position: Previous is disabled at the true beginning, Next at
 * the true end, and each press moves to the next item's own offset
 * (record aware, not a fixed card width). Native trackpad, touch and
 * keyboard scrolling keep working; reduced motion jumps.
 */
export function ShelfControls({ target, label }: { target: string; label: string }) {
  const [state, setState] = useState({ start: true, end: false });
  useEffect(() => {
    const el = (document.querySelector(`[data-shelf="${target}"]`) as HTMLElement | null);
    if (!el) return;
    const read = () => setState({ start: el.scrollLeft <= 1, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 });
    read();
    el.addEventListener("scroll", read, { passive: true });
    const ro = new ResizeObserver(read); ro.observe(el);
    return () => { el.removeEventListener("scroll", read); ro.disconnect(); };
  }, [target]);
  const move = (dir: -1 | 1) => {
    const el = document.querySelector(`[data-shelf="${target}"]`) as HTMLElement | null; if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    const x = el.scrollLeft;
    const next = dir > 0 ? items.find((i) => i.offsetLeft > x + 1) : [...items].reverse().find((i) => i.offsetLeft < x - 1);
    el.scrollTo({ left: next ? next.offsetLeft : dir > 0 ? el.scrollWidth : 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <>
      <button type="button" className="icon-btn shelf-btn" aria-label={`Previous ${label}`} disabled={state.start} onClick={() => move(-1)}><CaretLeft size={20} /></button>
      <button type="button" className="icon-btn shelf-btn" aria-label={`Next ${label}`} disabled={state.end} onClick={() => move(1)}><CaretRight size={20} /></button>
    </>
  );
}
