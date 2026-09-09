"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * The V2 app shell. One navigation model everywhere: five destinations plus a
 * prominent Create action. On phones it's a fixed bottom bar sized for
 * thumbs; on desktop the same items become a left rail. No hover-only
 * affordances, no horizontal scroll.
 */

export type ShellProps = {
  username: string;
  displayName: string | null;
  hasBusiness: boolean;
  wantsBusiness: boolean;
  unreadNotifications: number;
  unreadMessages: number;
  children: React.ReactNode;
};

const NAV = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/cars", label: "Car Ads", icon: CarIcon },
  { href: "/jobs", label: "Jobs", icon: JobsIcon },
  { href: "/alerts", label: "Alerts", icon: BellIcon },
  { href: "/me", label: "Profile", icon: UserIcon },
];

export function AppShell(props: ShellProps) {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  useEffect(() => setCreateOpen(false), [pathname]);

  const badge = (href: string) =>
    href === "/alerts" ? props.unreadNotifications : 0;

  const active = (href: string) =>
    pathname === href || (href !== "/home" && pathname.startsWith(href + "/"));

  return (
    <div className="min-h-dvh bg-paper md:grid md:grid-cols-[13.5rem_minmax(0,1fr)]">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule px-4 py-6 md:flex">
        <Link href="/home" className="flex items-center gap-2.5 px-2">
          <span className="h-2.5 w-2.5 rounded-full bg-signal" aria-hidden />
          <span className="font-display text-lg font-900 tracking-[-0.03em]">TAPMART</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active(item.href) ? "page" : undefined}
              className={`flex items-center gap-3 px-2 py-2.5 font-mono text-[0.8125rem] font-600 tracking-wide uppercase transition-colors ${
                active(item.href) ? "text-signal" : "text-ink hover:text-signal"
              }`}
            >
              <item.icon />
              {item.label}
              {badge(item.href) > 0 && (
                <span className="tnum ml-auto bg-signal px-1.5 text-[0.6875rem] text-white">
                  {badge(item.href)}
                </span>
              )}
            </Link>
          ))}
          <Link
            href="/messages"
            aria-current={active("/messages") ? "page" : undefined}
            className={`flex items-center gap-3 px-2 py-2.5 font-mono text-[0.8125rem] font-600 tracking-wide uppercase ${
              active("/messages") ? "text-signal" : "text-ink hover:text-signal"
            }`}
          >
            <ChatIcon />
            Messages
            {props.unreadMessages > 0 && (
              <span className="tnum ml-auto bg-signal px-1.5 text-[0.6875rem] text-white">
                {props.unreadMessages}
              </span>
            )}
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="btn btn-signal mt-6 w-full !py-3"
        >
          + Create
        </button>
        <div className="mt-auto px-2">
          {props.hasBusiness || props.wantsBusiness ? (
            <Link href="/business" className="font-mono text-[0.6875rem] text-ink-faint hover:text-ink">
              Business tools ↗
            </Link>
          ) : null}
        </div>
      </aside>

      {/* Content; bottom padding clears the mobile bar */}
      <div className="min-w-0 pb-24 md:pb-0">{props.children}</div>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-[1.5px] border-ink bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV.slice(0, 2).map((item) => <MobileTab key={item.href} item={item} active={active(item.href)} badge={badge(item.href)} />)}
        <button
          type="button"
          aria-label="Create"
          onClick={() => setCreateOpen(true)}
          className="flex flex-col items-center justify-center py-2"
        >
          <span className="flex h-9 w-9 items-center justify-center bg-signal font-display text-xl font-800 text-white">+</span>
        </button>
        {NAV.slice(3).map((item) => <MobileTab key={item.href} item={item} active={active(item.href)} badge={badge(item.href)} />)}
      </nav>

      {createOpen && <CreateSheet hasBusiness={props.hasBusiness} wantsBusiness={props.wantsBusiness} onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function MobileTab({
  item, active, badge,
}: { item: (typeof NAV)[number]; active: boolean; badge: number }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 ${active ? "text-signal" : "text-ink"}`}
    >
      <item.icon />
      <span className="font-mono text-[0.5625rem] font-600 tracking-wide uppercase">{item.label}</span>
      {badge > 0 && (
        <span className="tnum absolute top-1.5 right-[22%] bg-signal px-1 text-[0.5625rem] leading-4 text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

/** The + sheet: what do you want to create? Adapts to capabilities. */
function CreateSheet({
  hasBusiness, wantsBusiness, onClose,
}: { hasBusiness: boolean; wantsBusiness: boolean; onClose: () => void }) {
  const businessItems = hasBusiness
    ? [
        { href: "/create", title: "Campaign or job", sub: "Hire creators, photographers, or UGC" },
        { href: "/cars?browse=1", title: "Advertise on cars", sub: "Find vehicles near you" },
        { href: "/business/calendar", title: "Plan content", sub: "Add to your content calendar" },
      ]
    : wantsBusiness
      ? [{ href: "/business/new", title: "Add your business", sub: "Start getting marketing done" }]
      : [];
  const earnItems = [
    { href: "/cars/new", title: "List my car", sub: "Earn from ad space while you drive" },
    { href: "/me/creator", title: "Creator profile", sub: "Get matched with paid work" },
    { href: "/me/portfolio", title: "Portfolio post", sub: "Show your best work" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Create">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-ink/50" />
      <div className="relative w-full max-w-md border-t-[1.5px] border-ink bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:border-[1.5px]">
        <div className="flex items-center justify-between">
          <p className="eyebrow !text-signal">Create</p>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 font-mono text-sm text-ink-faint hover:text-ink">✕</button>
        </div>
        {businessItems.length > 0 && (
          <div className="mt-4">
            <p className="eyebrow">For your business</p>
            <div className="mt-2 flex flex-col gap-2">
              {businessItems.map((i) => <SheetLink key={i.href} {...i} />)}
            </div>
          </div>
        )}
        <div className="mt-4">
          <p className="eyebrow">Earn</p>
          <div className="mt-2 flex flex-col gap-2">
            {earnItems.map((i) => <SheetLink key={i.href} {...i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SheetLink({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link href={href} className="group border border-rule px-4 py-3 hover:border-signal">
      <span className="font-display text-base font-800 group-hover:text-signal">{title}</span>
      <span className="block text-xs text-ink-faint">{sub}</span>
    </Link>
  );
}

/* Icons: 20px stroke glyphs in the house style — geometric, no fills. */
function stroke(props: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d={props.d} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
function HomeIcon() { return stroke({ d: "M3.5 9.5 10 3.5l6.5 6v7h-4.6v-4.4h-3.8v4.4H3.5z" }); }
function CarIcon() { return stroke({ d: "M3 12.5 4.6 8a1.6 1.6 0 0 1 1.5-1h7.8a1.6 1.6 0 0 1 1.5 1l1.6 4.5v4h-2.4v-1.6H5.4V16.5H3zM5.5 12.5h9" }); }
function JobsIcon() { return stroke({ d: "M3.5 7h13v9.5h-13zM7.5 7V4.9A1.4 1.4 0 0 1 8.9 3.5h2.2a1.4 1.4 0 0 1 1.4 1.4V7M3.5 11h13" }); }
function BellIcon() { return stroke({ d: "M10 3.5a4.4 4.4 0 0 1 4.4 4.4c0 3.4 1.3 4.6 1.3 4.6H4.3s1.3-1.2 1.3-4.6A4.4 4.4 0 0 1 10 3.5zM8.4 15.5a1.7 1.7 0 0 0 3.2 0" }); }
function UserIcon() { return stroke({ d: "M10 9.7a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2zM3.9 16.5a6.4 6.4 0 0 1 12.2 0" }); }
function ChatIcon() { return stroke({ d: "M3.5 4.5h13v9h-7l-3.6 3v-3h-2.4z" }); }
