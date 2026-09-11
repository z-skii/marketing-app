"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

export type FilterItem = { key: string; label: string; href: string };

/**
 * A row of filter pills with one sliding lime indicator. The indicator is a
 * real element that moves to the active pill, so switching filters reads as
 * one thing moving rather than two things blinking.
 */
export function FilterBar({ items, active, label = "Filter" }: { items: FilterItem[]; active: string; label?: string }) {
  const row = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const el = row.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(active)}"]`);
    if (!el) return;
    setBox({ left: el.offsetLeft, width: el.offsetWidth });
    el.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [active, items]);

  return (
    <nav className="pill-row relative" aria-label={label} ref={row}>
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 h-full rounded-full bg-signal/16 transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={box ? { left: box.left, width: box.width, opacity: 1 } : { opacity: 0 }}
      />
      {items.map((item) => {
        const on = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            data-key={item.key}
            aria-current={on ? "page" : undefined}
            className={`pill relative z-10 !bg-transparent transition-colors ${on ? "!text-signal" : ""}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
