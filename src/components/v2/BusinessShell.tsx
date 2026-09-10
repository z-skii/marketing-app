"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Icon } from "@phosphor-icons/react";
import {
  SquaresFour, CalendarBlank, Plus, Megaphone, Storefront, Bell, ChatCircle, ArrowsLeftRight,
} from "@phosphor-icons/react";

/**
 * The Business shell: a marketing operating system for one business.
 *
 *   Overview   what needs attention
 *   Content    shoots, calendar, library, scheduling
 *   Create     Recreate / Story / Car
 *   Campaigns  active, review, completed
 *   Business   brand, social, Google, plan
 *
 * Phones: a slim top strip (who you are acting as, messages, notifications)
 * and a five-tab bottom bar with Create in the middle. Screens with room:
 * a compact left sidebar with four destinations and one lime Create.
 * Nothing here is shared with the User shell except the design tokens.
 */

export type BusinessIdentity = { id: string; name: string; logo: string | null };

export type BusinessShellProps = {
  business: BusinessIdentity;
  unreadNotifications: number;
  unreadMessages: number;
  children: React.ReactNode;
};

type NavItem = { href: string; label: string; icon: Icon; exact?: boolean };

const NAV: NavItem[] = [
  { href: "/business", label: "Overview", icon: SquaresFour, exact: true },
  { href: "/business/content", label: "Content", icon: CalendarBlank },
  { href: "/business/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/business/settings", label: "Business", icon: Storefront },
];

const CREATE: NavItem = { href: "/business/create", label: "Create", icon: Plus };

const MOBILE_ORDER: NavItem[] = [NAV[0], NAV[1], CREATE, NAV[2], NAV[3]];

function isActive(item: NavItem, pathname: string) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

export function BusinessShell({ business, unreadNotifications, unreadMessages, children }: BusinessShellProps) {
  const pathname = usePathname();

  return (
    <div className="app-root min-h-dvh bg-paper rail:grid rail:grid-cols-[13rem_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r border-rule bg-paper-deep px-3 py-5 rail:flex">
        <Link href="/business/settings" className="flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] px-2 py-1.5 can-hover:hover:bg-surface">
          <Mark business={business} size={36} />
          <span className="min-w-0">
            <span className="block truncate font-display text-[0.9375rem] font-800 tracking-[-0.01em]">{business.name}</span>
            <span className="eyebrow block !text-[0.625rem] text-signal">Business</span>
          </span>
        </Link>

        <Link href={CREATE.href} className="btn btn-signal mt-5 w-full justify-start gap-2">
          <Plus size={20} weight="bold" aria-hidden />
          Create campaign
        </Link>

        <nav className="mt-5 flex flex-col gap-0.5" aria-label="Business">
          {NAV.map((item) => {
            const on = isActive(item, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 font-display text-[0.9375rem] font-600 transition-colors ${
                  on ? "bg-surface-2 text-ink" : "text-ink-soft can-hover:hover:bg-surface can-hover:hover:text-ink"
                }`}
              >
                <item.icon size={22} weight={on ? "fill" : "regular"} className={on ? "text-signal" : ""} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-0.5 border-t border-rule pt-3">
          <RailRow href="/messages" label="Messages" icon={ChatCircle} badge={unreadMessages} active={pathname.startsWith("/messages")} />
          <RailRow href="/alerts" label="Notifications" icon={Bell} badge={unreadNotifications} active={pathname.startsWith("/alerts")} />
          <Link href="/me" className="flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm text-ink-faint can-hover:hover:text-ink">
            <ArrowsLeftRight size={20} aria-hidden />
            Switch account
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Phone top strip: who you are acting as, and the two shared inboxes. */}
        <header className="glass sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-rule px-4 py-2 rail:hidden">
          <Link href="/business/settings" className="flex min-h-11 min-w-0 items-center gap-2.5">
            <Mark business={business} size={30} />
            <span className="min-w-0">
              <span className="block truncate font-display text-[0.9375rem] font-800 tracking-[-0.01em]">{business.name}</span>
            </span>
            <span className="eyebrow shrink-0 !text-[0.625rem] text-signal">Business</span>
          </Link>
          <span className="flex items-center gap-1">
            <TopIcon href="/messages" label="Messages" icon={ChatCircle} badge={unreadMessages} />
            <TopIcon href="/alerts" label="Notifications" icon={Bell} badge={unreadNotifications} />
          </span>
        </header>

        <div className="pb-24 rail:pb-0">{children}</div>
      </div>

      {/* Phone bottom bar: five destinations, Create in the middle. */}
      <nav aria-label="Business" className="glass fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-rule pb-[env(safe-area-inset-bottom)] rail:hidden">
        {MOBILE_ORDER.map((item) => {
          const on = isActive(item, pathname);
          const create = item === CREATE;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={on ? "page" : undefined}
              className={`relative flex min-h-16 flex-col items-center justify-center gap-1 transition-colors ${on ? "text-signal" : "text-ink-soft"}`}
            >
              {create ? (
                <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${on ? "border-signal bg-signal text-signal-ink" : "border-signal text-signal"}`}>
                  <Plus size={20} weight="bold" aria-hidden />
                </span>
              ) : (
                <item.icon size={24} weight={on ? "fill" : "regular"} aria-hidden />
              )}
              <span className="eyebrow !text-[0.625rem] !tracking-[0.1em] text-current">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function Mark({ business, size }: { business: BusinessIdentity; size: number }) {
  if (business.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={business.logo} alt="" width={size} height={size} className="shrink-0 rounded-[8px] object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span aria-hidden className="flex shrink-0 items-center justify-center rounded-[8px] bg-surface-2 font-display font-800" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(business.name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

function Count({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="tnum inline-flex min-w-5 items-center justify-center rounded-full bg-alert px-1.5 font-display text-[0.6875rem] font-800 leading-5 text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function RailRow({ href, label, icon: IconC, badge, active }: { href: string; label: string; icon: Icon; badge: number; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 font-display text-[0.9375rem] font-600 ${active ? "bg-surface-2 text-ink" : "text-ink-soft can-hover:hover:bg-surface can-hover:hover:text-ink"}`}
    >
      <IconC size={22} aria-hidden />
      {label}
      <span className="ml-auto"><Count n={badge} /></span>
    </Link>
  );
}

function TopIcon({ href, label, icon: IconC, badge }: { href: string; label: string; icon: Icon; badge: number }) {
  return (
    <Link href={href} aria-label={badge > 0 ? `${badge} unread ${label.toLowerCase()}` : label} className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink">
      <IconC size={22} aria-hidden />
      {badge > 0 && <span className="absolute top-1 right-1"><Count n={badge} /></span>}
    </Link>
  );
}
