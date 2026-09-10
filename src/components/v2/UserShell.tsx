"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Icon } from "@phosphor-icons/react";
import { House, Pulse, Wallet, User, Bell, ChatCircle, Gear } from "@phosphor-icons/react";

/**
 * The User shell: the earning marketplace. Home · Activity · Earnings ·
 * Profile. Phones (and short landscape windows) get a fixed bottom bar;
 * screens with room get a left rail with the same destinations plus
 * Messages and Notifications, and who you are at the bottom.
 *
 * Business mode has its own shell (BusinessShell.tsx) with a different
 * navigation and structure; the layout picks one or the other.
 */

export type ShellIdentity = { name: string; sub: string; logo: string | null };

export type ShellProps = {
  identity: ShellIdentity;
  unreadNotifications: number;
  unreadMessages: number;
  children: React.ReactNode;
};

type NavItem = { href: string; label: string; icon: Icon; exact?: boolean; noFill?: boolean };

const USER_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/activity", label: "Activity", icon: Pulse, noFill: true },
  { href: "/earnings", label: "Earnings", icon: Wallet },
  { href: "/me", label: "Profile", icon: User },
];

const RAIL_EXTRA: NavItem[] = [
  { href: "/messages", label: "Messages", icon: ChatCircle },
  { href: "/alerts", label: "Notifications", icon: Bell },
];

export function UserShell(props: ShellProps) {
  const pathname = usePathname();
  const nav = USER_NAV;

  const badge = (href: string) =>
    href === "/alerts" ? props.unreadNotifications : href === "/messages" ? props.unreadMessages : 0;

  const active = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

  const railLink = (item: NavItem) => {
    const on = active(item);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={on ? "page" : undefined}
        className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 py-2 font-display text-[0.9375rem] font-500 transition-colors ${
          on ? "bg-surface text-signal" : "text-ink-soft can-hover:hover:bg-surface can-hover:hover:text-ink"
        }`}
      >
        <item.icon size={22} weight={on ? (item.noFill ? "bold" : "fill") : "regular"} aria-hidden />
        {item.label}
        {badge(item.href) > 0 && <Badge n={badge(item.href)} className="ml-auto" />}
      </Link>
    );
  };

  const homeHref = "/home";

  return (
    <div className="app-root min-h-dvh bg-paper rail:grid rail:grid-cols-[14rem_minmax(0,1fr)]">
      {/* Rail: only where there is width and height for it */}
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto bg-paper-deep px-3 py-6 rail:flex">
        <Link href={homeHref} className="flex min-h-11 items-center px-3 font-display text-[24px] font-[800] tracking-[-1px]" aria-label="TapMart home">
          Tapmart<span className="text-signal">.</span>
        </Link>
        <nav className="mt-6 flex flex-col gap-0.5" aria-label="Main">
          {nav.map(railLink)}
          {RAIL_EXTRA.map(railLink)}
        </nav>
        <Link
          href="/me"
          className="mt-auto flex min-h-14 items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 can-hover:hover:bg-surface"
          aria-label={`Acting as ${props.identity.name}. Switch in Profile.`}
        >
          <IdentityMark identity={props.identity} />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-600">{props.identity.name}</span>
            <span className="block truncate text-xs text-ink-faint">{props.identity.sub}</span>
          </span>
        </Link>
      </aside>

      <div className="min-w-0">
        {/* Phone top chrome: the wordmark, messages, notifications, settings. Pages carry no bells of their own. */}
        <header className="glass sticky top-0 z-30 flex h-[58px] items-center justify-between border-b px-[18px] rail:hidden">
          <Link href={homeHref} className="font-display text-[16px] font-[750] tracking-[-0.4px]" aria-label="TapMart home">
            Tapmart<span className="text-signal">.</span>
          </Link>
          <span className="-mr-2 flex items-center">
            <TopIcon href="/messages" label="Messages" icon={ChatCircle} badge={props.unreadMessages} />
            <TopIcon href="/alerts" label="Notifications" icon={Bell} badge={props.unreadNotifications} />
            <TopIcon href="/me/settings" label="Settings" icon={Gear} badge={0} />
          </span>
        </header>
        {/* Content; bottom padding clears the mobile bar */}
        <div className="pb-24 rail:pb-0">{props.children}</div>
      </div>

      {/* Bottom bar: navigation only, one destination per tab */}
      <nav aria-label="Main" className="tm-bottomnav grid-cols-4 rail:hidden">
        {nav.map((item) => <MobileTab key={item.href} item={item} active={active(item)} />)}
      </nav>
    </div>
  );
}

export function Badge({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`tnum inline-flex min-w-5 items-center justify-center rounded-full bg-surface-3 px-1.5 font-display text-[0.6875rem] font-600 leading-5 text-ink ${className}`}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

function IdentityMark({ identity }: { identity: ShellIdentity }) {
  if (identity.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={identity.logo} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 font-display text-sm font-600">
      {(identity.name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

function MobileTab({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
    >
      <item.icon size={20} weight={active ? (item.noFill ? "bold" : "fill") : "regular"} aria-hidden />
      <span>{item.label}</span>
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
