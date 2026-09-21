"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/ds/Brand";
import { ArrowRightIcon, CloseIcon, ListIcon } from "@/ds/icons";

const LINKS = [
  { href: "#drive", label: "Drive" },
  { href: "#recreate", label: "Recreate" },
  { href: "#share", label: "Share" },
  { href: "#loyalty", label: "Loyalty" },
  { href: "#business", label: "Business" },
  { href: "#plans", label: "Plans" },
];

/** Translucent floating navigation: the wordmark, the chapters, Sign in and the one red action. Turns dark over the dark chapters. */
export function Nav({ open }: { open: { href: string; label: string } | null }) {
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const darks = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-dark]"));
    const on = () => {
      const y = 44;
      setDark(darks.some((el) => { const r = el.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);
  return (
    <>
      <div className="lp-nav">
        <div className={`lp-nav-bar ${dark ? "is-dark" : ""}`}>
          <Link href="#top" aria-label="TapMart, top of page" className="inline-flex items-center"><Wordmark size={24} dark={dark} /></Link>
          <nav className="lp-nav-links" aria-label="Chapters">{LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}</nav>
          <div className="lp-nav-actions">
            {open ? (
              <Link href={open.href} className="btn btn-signal btn-sm">{open.label}</Link>
            ) : (
              <>
                <Link href="/sign-in" className={`btn btn-ghost btn-sm lp-signin ${dark ? "text-white" : ""}`}>Sign in</Link>
                <Link href="/sign-up" className="btn btn-signal btn-sm">Start earning</Link>
              </>
            )}
            <button type="button" className={`iconbtn lp-nav-menu ${dark ? "text-white" : ""}`} aria-label="Open menu" aria-expanded={menu} onClick={() => setMenu(true)}><ListIcon size={24} aria-hidden /></button>
          </div>
        </div>
      </div>
      {menu && (
        <div className="lp-menu" role="dialog" aria-modal="true" aria-label="Menu" onClick={() => setMenu(false)}>
          <div className="lp-menu-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 pt-1 pb-2">
              <Wordmark size={20} />
              <button type="button" className="iconbtn" aria-label="Close menu" onClick={() => setMenu(false)}><CloseIcon size={20} aria-hidden /></button>
            </div>
            <nav aria-label="Chapters">{LINKS.map((l) => <a key={l.href} href={l.href} onClick={() => setMenu(false)}>{l.label}<ArrowRightIcon size={20} aria-hidden /></a>)}</nav>
            <div className="lp-menu-actions">
              {open ? <Link href={open.href} className="btn btn-signal">{open.label}</Link> : (
                <>
                  <Link href="/sign-in" className="btn">Sign in</Link>
                  <Link href="/sign-up" className="btn btn-signal">Start earning</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
