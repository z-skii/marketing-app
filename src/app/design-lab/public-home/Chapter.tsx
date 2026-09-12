"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * One earning chapter. On the enhanced desktop it is a 900px section with
 * a 780px panel pinned 120px below the 80px header. Progress p runs from
 * 0 at scrollY = top - 320 to 1 at top + 40 (360px, the last 120 while
 * pinned). One requestAnimationFrame-throttled scroll listener writes two
 * sub-phase custom properties (--pa, --pb) on the section; CSS moves the
 * sources. Money, conditions and actions never move.
 */
export function Chapter({ id, tone, phases, children, label }: { id: string; tone: "graphite" | "canvas" | "underlay"; phases: [number, number]; children: ReactNode; label: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const update = () => {
      raf = 0;
      if (!el.closest(".pub-enh")) { el.style.setProperty("--pa", "1"); el.style.setProperty("--pb", "1"); return; }
      const top = el.getBoundingClientRect().top + window.scrollY;
      const p = clamp((window.scrollY - (top - 320)) / 360);
      el.style.setProperty("--pa", String(clamp(p / phases[0])));
      el.style.setProperty("--pb", String(clamp((p - phases[0]) / (phases[1] - phases[0]))));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [phases]);
  return (
    <section ref={ref} id={id} className={`pub-chapter tone-${tone}`} aria-label={label}>
      <div className="pub-panel">{children}</div>
    </section>
  );
}
