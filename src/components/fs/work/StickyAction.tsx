"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";

/**
 * The phone's sticky action: the pay and one button that jumps to the
 * action card, shown only while that card is off screen. It sits above
 * the floating tab bar and never covers it. Desktop has the sticky rail
 * instead, so the bar is hidden there in CSS.
 */
export function StickyAction({ pay, per, label, target = "#work", tone = "primary" }: { pay: string; per: string; label: string; target?: string; tone?: "primary" | "quiet" }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = document.querySelector(target);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(!e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);
  return (
    <div className={`dt-sticky${on ? " is-on" : ""}`} aria-hidden={!on}>
      <span><b>{pay}</b><small>{per}</small></span>
      <a href={target} className={`btn ${tone === "primary" ? "btn-signal btn-md" : "btn-dark"}`} tabIndex={on ? 0 : -1}>{label} <ArrowRight size={16} aria-hidden /></a>
    </div>
  );
}
