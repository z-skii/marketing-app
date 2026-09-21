"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { DotsIcon } from "./icons";

/**
 * The "more" menu: the actions a card or a screen does not need to show
 * up front. A round icon button (accessible name "More", tooltip on
 * desktop) opens a small glass list; Escape, a click outside or a choice
 * closes it. Items are links or buttons, one line each, an optional icon.
 */
export type MenuItem = { label: string; href?: string; onClick?: () => void; icon?: ReactNode; danger?: boolean; external?: boolean };

export function Menu({ items, label = "More", align = "end", size = "md", surface = false, className = "" }: { items: MenuItem[]; label?: string; align?: "start" | "end"; size?: "sm" | "md"; surface?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown); document.addEventListener("touchstart", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("touchstart", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  if (items.length === 0) return null;
  return (
    <div ref={root} className={`menu ${className}`}>
      <button type="button" className={`iconbtn${size === "sm" ? " is-sm" : ""}${surface ? " is-surface" : ""}`} aria-label={label} data-tip={open ? undefined : label} aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        <DotsIcon size={size === "sm" ? 16 : 20} weight="bold" aria-hidden />
      </button>
      {open && (
        <div id={id} role="menu" className={`menu-pop ${align === "start" ? "is-start" : ""}`}>
          {items.map((it) => {
            const inner = <>{it.icon}<span>{it.label}</span></>;
            const cls = `menu-item${it.danger ? " is-danger" : ""}`;
            if (it.href) return it.external
              ? <a key={it.label} role="menuitem" href={it.href} className={cls} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>{inner}</a>
              : <Link key={it.label} role="menuitem" href={it.href} className={cls} onClick={() => setOpen(false)}>{inner}</Link>;
            return <button key={it.label} type="button" role="menuitem" className={cls} onClick={() => { setOpen(false); it.onClick?.(); }}>{inner}</button>;
          })}
        </div>
      )}
    </div>
  );
}
