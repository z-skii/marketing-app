"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * One navigation for the whole admin: the section names across the top, and
 * a swipe anywhere on the page slides to the neighboring section. A page
 * with its own inner swiper (the Content platform tabs) claims the gesture
 * by stamping window.__innerSwipe; this handler then leaves it alone.
 */

const TABS = [
  { name: "Admin", href: "/admin" },
  { name: "Content", href: "/admin/content" },
  { name: "Agents", href: "/admin/agents" },
  { name: "HQ", href: "/admin/hq" },
];

declare global {
  interface Window {
    __innerSwipe?: number;
  }
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const index = TABS.findIndex((t) => t.href === pathname);

  useEffect(() => {
    let x0 = 0;
    let y0 = 0;
    const onStart = (e: TouchEvent) => {
      x0 = e.touches[0]?.clientX ?? 0;
      y0 = e.touches[0]?.clientY ?? 0;
    };
    const onEnd = (e: TouchEvent) => {
      // An inner swiper (platform tabs) already used this gesture.
      if (Date.now() - (window.__innerSwipe ?? 0) < 400) return;
      const dx = (e.changedTouches[0]?.clientX ?? x0) - x0;
      const dy = (e.changedTouches[0]?.clientY ?? y0) - y0;
      if (Math.abs(dx) < 72 || Math.abs(dy) > 60) return;
      const next = index + (dx < 0 ? 1 : -1);
      if (next >= 0 && next < TABS.length) router.push(TABS[next].href);
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [index, router]);

  return (
    <nav
      aria-label="Admin sections"
      className="flex gap-1 overflow-x-auto border-b border-rule"
    >
      {TABS.map((tab) => {
        const active = tab.href === pathname;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`px-4 py-2.5 font-mono text-[0.6875rem] font-600 tracking-[0.14em] whitespace-nowrap uppercase transition-colors ${
              active
                ? "border-b-2 border-signal text-ink"
                : "text-ink-faint hover:text-ink"
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
