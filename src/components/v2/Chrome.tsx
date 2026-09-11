"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Icon } from "@phosphor-icons/react";

/**
 * Shared chrome for both modes, built to the UI system in
 * docs/design-specs/system.json: a 56px phone top bar that is transparent
 * at the top of the page and turns to glass once content scrolls under it,
 * a floating 68px glass bottom bar, and an 88px collapsed desktop rail.
 * Destinations differ by mode; the material does not.
 */

export type ChromeNavItem = { href: string; label: string; icon: Icon; exact?: boolean; noFill?: boolean; create?: boolean };

export function isActivePath(item: { href: string; exact?: boolean }, pathname: string) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

/** Phone top bar: left slot, centred wordmark, up to two right icons. */
export function TopBar({ homeHref, left, right }: { homeHref: string; left?: React.ReactNode; right?: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`sticky top-0 z-30 grid h-[56px] grid-cols-[44px_1fr_auto] items-center px-4 transition-[background,border-color] duration-200 rail:hidden ${scrolled ? "glass border-b" : "border-b border-transparent"}`}>
      <span className="flex">{left}</span>
      <Link href={homeHref} className="justify-self-center font-display text-[21px] leading-6 font-[820] tracking-[-0.45px]" aria-label="TapMart home">
        Tapmart<span className="text-signal">.</span>
      </Link>
      <span className="flex items-center gap-2">{right}</span>
    </header>
  );
}

export function TopIcon({ href, label, icon: IconC, badge = 0 }: { href: string; label: string; icon: Icon; badge?: number }) {
  return (
    <Link href={href} aria-label={badge > 0 ? `${badge} unread ${label.toLowerCase()}` : label} className="iconbtn">
      <IconC size={22} aria-hidden />
      {badge > 0 && <span aria-hidden className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-signal" />}
    </Link>
  );
}

/** Floating glass bottom bar. Four items in User mode, five in Business mode with Create filled. */
export function BottomNav({ items, pathname, label }: { items: ChromeNavItem[]; pathname: string; label: string }) {
  return (
    <nav aria-label={label} className={`tm-bottomnav rail:hidden ${items.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>
      {items.map((item) => {
        const on = isActivePath(item, pathname);
        return (
          <Link key={item.href} href={item.href} aria-current={on ? "page" : undefined} className={item.create ? "is-create" : undefined}>
            <span className="inline-grid place-items-center"><item.icon size={22} weight={item.create ? "bold" : "regular"} aria-hidden /></span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Collapsed desktop rail: 88px, icon items with 10px labels, one optional lime create button, identity at the bottom. */
export function Rail({
  homeHref, items, extra, pathname, create, identity,
}: {
  homeHref: string; items: ChromeNavItem[]; extra?: { href: string; label: string; icon: Icon; badge?: number }[]; pathname: string;
  create?: { href: string; label: string; icon: Icon }; identity: React.ReactNode;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[88px] flex-col items-center gap-2.5 overflow-y-auto border-r border-rule bg-paper-deep px-3 py-[18px] rail:flex">
      <Link href={homeHref} aria-label="TapMart home" className="mb-2 flex h-11 w-11 items-center justify-center rounded-[14px] font-display text-[22px] font-[820] tracking-[-0.5px]">
        T<span className="text-signal">.</span>
      </Link>
      {create && (
        <Link href={create.href} aria-label={create.label} className="mb-1 flex h-[52px] w-16 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,var(--tm-lime-light),var(--tm-lime))] text-signal-ink shadow-[0_8px_20px_rgba(201,255,56,0.16)]">
          <create.icon size={24} weight="bold" aria-hidden />
        </Link>
      )}
      <nav className="flex flex-col gap-2.5" aria-label="Main">
        {items.map((item) => <RailItem key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActivePath(item, pathname)} />)}
      </nav>
      {extra && extra.length > 0 && (
        <nav className="mt-2 flex flex-col gap-2.5 border-t border-rule pt-3" aria-label="More">
          {extra.map((item) => <RailItem key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActivePath(item, pathname)} badge={item.badge} />)}
        </nav>
      )}
      <div className="mt-auto">{identity}</div>
    </aside>
  );
}

function RailItem({ href, label, icon: IconC, active, badge = 0 }: { href: string; label: string; icon: Icon; active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={badge > 0 ? `${label}, ${badge} unread` : label}
      className={`relative flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-[16px] font-display text-[10px] leading-3 font-[650] transition-colors duration-150 ${active ? "bg-signal/12 text-signal" : "text-ink-soft can-hover:hover:bg-surface can-hover:hover:text-ink"}`}
    >
      <IconC size={22} weight="regular" aria-hidden />
      {label}
      {badge > 0 && <span aria-hidden className="absolute top-2 right-3 h-1.5 w-1.5 rounded-full bg-signal" />}
    </Link>
  );
}
