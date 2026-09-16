"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/fs/parts";

const SITE_LINKS = [
  { href: "#earn", label: "Earn" },
  { href: "#business", label: "For businesses" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

/**
 * The public header: wordmark, four section links, Sign in and Get started.
 * Under 1024px the section links live in a bottom sheet behind one Menu
 * button. A signed-in visitor gets one Open TapMart action instead of the
 * account pair. The header also owns the light document class, the
 * scrolled hairline and the one-time section reveals, so the server page
 * stays free of effects.
 */
export function SiteHeader({ open }: { open: { href: string; label: string } | null }) {
  const menu = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("fs-doc");
    const root = document.querySelector<HTMLElement>(".site");
    const header = root?.querySelector<HTMLElement>(".site-header");
    const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let observer: IntersectionObserver | null = null;
    if (root && !reduce && typeof IntersectionObserver !== "undefined") {
      root.classList.add("site-js");
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) { entry.target.classList.add("is-in"); observer?.unobserve(entry.target); }
        }
      }, { rootMargin: "0px 0px -10% 0px" });
      root.querySelectorAll("[data-reveal]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add("is-in"); else observer!.observe(el);
      });
    }
    return () => {
      document.documentElement.classList.remove("fs-doc");
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
      root?.classList.remove("site-js");
    };
  }, []);

  const close = () => menu.current?.close();

  return (
    <header className="site-header">
      <div className="site-wrap site-header-row">
        <Link href="/" className="site-brand" aria-label="TapMart home"><Wordmark size={30} /></Link>
        <nav className="site-nav" aria-label="Sections">
          {SITE_LINKS.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        </nav>
        <div className="site-header-actions">
          {open ? (
            <Link href={open.href} className="fs-btn fs-btn-primary fs-btn-sm">{open.label}</Link>
          ) : (
            <>
              <Link href="/sign-in" className="fs-btn fs-btn-secondary fs-btn-sm is-desktop">Sign in</Link>
              <Link href="/sign-up" className="fs-btn fs-btn-primary fs-btn-sm is-desktop">Get started</Link>
            </>
          )}
          <button type="button" className="fs-btn fs-btn-secondary fs-btn-sm is-phone" onClick={() => menu.current?.showModal()} aria-haspopup="dialog">
            <List size={18} aria-hidden /> Menu
          </button>
        </div>
      </div>
      <dialog ref={menu} className="site-menu" aria-label="Menu" onClick={(e) => { if (e.target === menu.current) close(); }}>
        <div className="site-menu-sheet">
          <div className="site-menu-head">
            <Wordmark size={30} />
            <button type="button" className="fs-icon-btn" onClick={close} aria-label="Close menu"><X size={22} aria-hidden /></button>
          </div>
          <ul className="site-menu-list">
            {SITE_LINKS.map((l) => <li key={l.href}><a href={l.href} onClick={close}>{l.label}</a></li>)}
          </ul>
          <div className="site-menu-actions">
            {open ? (
              <Link href={open.href} className="fs-btn fs-btn-primary" onClick={close}>{open.label}</Link>
            ) : (
              <>
                <Link href="/sign-up" className="fs-btn fs-btn-primary" onClick={close}>Get started</Link>
                <Link href="/sign-in" className="fs-btn fs-btn-secondary" onClick={close}>Sign in</Link>
              </>
            )}
          </div>
        </div>
      </dialog>
    </header>
  );
}
