"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Icon } from "@phosphor-icons/react";
import {
  House, CalendarBlank, Plus, PlusCircle, Megaphone, Storefront, Bell, ChatCircle, ArrowsLeftRight, MagnifyingGlass, Gear,
} from "@phosphor-icons/react";

/**
 * The Business shell: a marketing operating system for one business.
 *
 *   Home       browse people and cars to advertise through
 *   Content    what TapMart shot, delivered and scheduled for the business
 *   Create     Recreate / Story / Car public campaigns
 *   Campaigns  public campaigns and direct requests: active, review, completed
 *   Business   the business's own profile, with settings behind a gear
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
  { href: "/business", label: "Home", icon: House, exact: true },
  { href: "/business/content", label: "Content", icon: CalendarBlank },
  { href: "/business/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/business/profile", label: "Business", icon: Storefront },
];

const CREATE: NavItem = { href: "/business/create", label: "Create", icon: PlusCircle };

const MOBILE_ORDER: NavItem[] = [NAV[0], NAV[1], CREATE, NAV[2], NAV[3]];

function isActive(item: NavItem, pathname: string) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

export function BusinessShell({ business, unreadNotifications, unreadMessages, children }: BusinessShellProps) {
  const pathname = usePathname();

  return (
    <div className="app-root min-h-dvh bg-paper rail:grid rail:grid-cols-[13rem_minmax(0,1fr)]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto bg-paper-deep px-3 py-6 rail:flex">
        <Link href="/business" className="flex min-h-11 items-center px-3 font-display text-[24px] font-[800] tracking-[-1px]" aria-label="TapMart business home">
          Tapmart<span className="text-signal">.</span>
        </Link>
        <Link href="/business/profile" className="mt-4 flex min-h-12 items-center gap-3 rounded-[12px] px-2 py-1.5 can-hover:hover:bg-surface">
          <Mark business={business} size={32} />
          <span className="min-w-0">
            <span className="block truncate font-display text-[0.9375rem] font-600">{business.name}</span>
            <span className="block text-xs text-ink-faint">Business</span>
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
                className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 py-2 font-display text-[0.9375rem] font-500 transition-colors ${
                  on ? "bg-surface text-signal" : "text-ink-soft can-hover:hover:bg-surface can-hover:hover:text-ink"
                }`}
              >
                <item.icon size={22} weight={on ? "fill" : "regular"} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-0.5 pt-3">
          <RailRow href="/business/search" label="Search" icon={MagnifyingGlass} badge={0} active={pathname.startsWith("/business/search")} />
          <RailRow href="/messages" label="Messages" icon={ChatCircle} badge={unreadMessages} active={pathname.startsWith("/messages")} />
          <RailRow href="/alerts" label="Notifications" icon={Bell} badge={unreadNotifications} active={pathname.startsWith("/alerts")} />
          <Link href="/me" className="flex min-h-11 items-center gap-3 rounded-[12px] px-3 py-2 text-sm text-ink-faint can-hover:hover:text-ink">
            <ArrowsLeftRight size={20} aria-hidden />
            Switch account
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Phone top chrome: the wordmark in the middle, messages on the left,
            alerts and settings on the right. The business identity lives on
            the Business tab. */}
        <header className="glass sticky top-0 z-30 flex h-[58px] items-center justify-between border-b px-[18px] rail:hidden">
          <Link href="/business" className="font-display text-[16px] font-[750] tracking-[-0.4px]" aria-label="TapMart business home">
            Tapmart<span className="text-signal">.</span>
          </Link>
          <span className="-mr-2 flex items-center">
            <TopIcon href="/messages" label="Messages" icon={ChatCircle} badge={unreadMessages} />
            <TopIcon href="/alerts" label="Notifications" icon={Bell} badge={unreadNotifications} />
            <TopIcon href="/business/settings" label="Settings" icon={Gear} badge={0} />
          </span>
        </header>

        <div className="pb-24 rail:pb-0">{children}</div>
      </div>

      {/* Phone bottom bar: five destinations, Create in the middle, drawn like every other tab. */}
      <nav aria-label="Business" className="tm-bottomnav grid-cols-5 rail:hidden">
        {MOBILE_ORDER.map((item) => {
          const on = isActive(item, pathname);
          return (
            <Link key={item.href} href={item.href} aria-current={on ? "page" : undefined}>
              <item.icon size={20} weight={on ? "fill" : "regular"} aria-hidden />
              <span>{item.label}</span>
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
    <span aria-hidden className="flex shrink-0 items-center justify-center rounded-[8px] bg-surface-3 font-display font-600" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(business.name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

function Count({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="tnum inline-flex min-w-5 items-center justify-center rounded-full bg-surface-3 px-1.5 font-display text-[0.6875rem] font-600 leading-5 text-ink">
      {n > 99 ? "99+" : n}
    </span>
  );
}

function RailRow({ href, label, icon: IconC, badge, active }: { href: string; label: string; icon: Icon; badge: number; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 py-2 font-display text-[0.9375rem] font-500 ${active ? "bg-surface text-signal" : "text-ink-soft can-hover:hover:bg-surface can-hover:hover:text-ink"}`}
    >
      <IconC size={22} aria-hidden />
      {label}
      <span className="ml-auto"><Count n={badge} /></span>
    </Link>
  );
}

function TopIcon({ href, label, icon: IconC, badge }: { href: string; label: string; icon: Icon; badge: number }) {
  return (
    <Link href={href} aria-label={badge > 0 ? `${badge} unread ${label.toLowerCase()}` : label} className="relative flex h-11 w-11 items-center justify-center text-ink">
      <IconC size={20} aria-hidden />
      {badge > 0 && <span aria-hidden className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-signal" />}
    </Link>
  );
}
