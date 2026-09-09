"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The TapMart shell. One account, two modes, two navigations:
 *
 *   User mode      Home · Activity · Earnings · Profile
 *   Business mode  Overview · Content · Create · Campaigns · Business
 *
 * Phones get a fixed bottom bar; desktop gets a left rail with the same
 * destinations plus Messages and Notifications, and the identity you are
 * acting as at the bottom (switching lives in Profile).
 */

export type ShellIdentity = { name: string; sub: string; logo: string | null };

export type ShellProps = {
  mode: "user" | "business";
  identity: ShellIdentity;
  unreadNotifications: number;
  unreadMessages: number;
  children: React.ReactNode;
};

type NavItem = { href: string; label: string; icon: () => React.ReactNode; exact?: boolean; primary?: boolean };

const USER_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
  { href: "/earnings", label: "Earnings", icon: MoneyIcon },
  { href: "/me", label: "Profile", icon: UserIcon },
];

const BUSINESS_NAV: NavItem[] = [
  { href: "/business", label: "Overview", icon: HomeIcon, exact: true },
  { href: "/business/content", label: "Content", icon: CalendarIcon },
  { href: "/business/create", label: "Create", icon: PlusIcon, primary: true },
  { href: "/business/campaigns", label: "Campaigns", icon: CampaignIcon },
  { href: "/business/settings", label: "Business", icon: StoreIcon },
];

const RAIL_EXTRA: NavItem[] = [
  { href: "/messages", label: "Messages", icon: ChatIcon },
  { href: "/alerts", label: "Notifications", icon: BellIcon },
];

export function AppShell(props: ShellProps) {
  const pathname = usePathname();
  const nav = props.mode === "business" ? BUSINESS_NAV : USER_NAV;

  const badge = (href: string) =>
    href === "/alerts" ? props.unreadNotifications : href === "/messages" ? props.unreadMessages : 0;

  const active = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

  const railLink = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={active(item) ? "page" : undefined}
      className={`flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 font-display text-[0.9375rem] font-600 transition-colors ${
        active(item) ? "bg-surface-2 text-signal" : "text-ink-soft hover:bg-surface hover:text-ink"
      }`}
    >
      <item.icon />
      {item.label}
      {badge(item.href) > 0 && (
        <span className="tnum ml-auto rounded-full bg-signal px-2 font-display text-xs font-800 leading-5 text-signal-ink">
          {badge(item.href)}
        </span>
      )}
    </Link>
  );

  const homeHref = props.mode === "business" ? "/business" : "/home";

  return (
    <div className="app-root min-h-dvh bg-paper md:grid md:grid-cols-[14rem_minmax(0,1fr)]">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-paper-deep px-3 py-6 md:flex">
        <Link href={homeHref} className="flex items-center gap-2.5 px-3">
          <span className="h-2.5 w-2.5 rounded-full bg-signal" aria-hidden />
          <span className="font-display text-lg font-800 tracking-[-0.03em]">TAPMART</span>
        </Link>
        <nav className="mt-8 flex flex-col gap-0.5" aria-label="Main">
          {nav.filter((i) => !i.primary).map(railLink)}
          {RAIL_EXTRA.map(railLink)}
        </nav>
        {props.mode === "business" && (
          <Link href="/business/create" className="btn btn-signal mt-6 w-full">
            + Create campaign
          </Link>
        )}
        <Link
          href="/me"
          className="mt-auto flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 hover:bg-surface"
          aria-label={`Acting as ${props.identity.name}. Switch in Profile.`}
        >
          <IdentityMark identity={props.identity} />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-700">{props.identity.name}</span>
            <span className="block truncate text-xs text-ink-faint">{props.identity.sub}</span>
          </span>
        </Link>
      </aside>

      {/* Content; bottom padding clears the mobile bar */}
      <div className="min-w-0 pb-24 md:pb-0">{props.children}</div>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Main"
        className={`glass fixed inset-x-0 bottom-0 z-40 grid pb-[env(safe-area-inset-bottom)] md:hidden ${nav.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}
      >
        {nav.map((item) =>
          item.primary ? (
            <Link key={item.href} href={item.href} aria-label={item.label} className="flex flex-col items-center justify-center py-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal font-display text-[1.75rem] font-700 leading-none text-signal-ink shadow-[0_6px_24px_rgba(200,255,61,0.28)]">+</span>
            </Link>
          ) : (
            <MobileTab key={item.href} item={item} active={active(item)} />
          ),
        )}
      </nav>
    </div>
  );
}

function IdentityMark({ identity }: { identity: ShellIdentity }) {
  if (identity.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={identity.logo} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 font-display text-sm font-800">
      {(identity.name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

function MobileTab({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-16 flex-col items-center justify-center gap-1 ${active ? "text-signal" : "text-ink-soft"}`}
    >
      <item.icon />
      <span className="font-display text-[0.6875rem] font-600">{item.label}</span>
    </Link>
  );
}

/* Icons: 20px stroke glyphs in the house style; geometric, no fills. */
function stroke(props: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d={props.d} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
function HomeIcon() { return stroke({ d: "M3.5 9.5 10 3.5l6.5 6v7h-4.6v-4.4h-3.8v4.4H3.5z" }); }
function ActivityIcon() { return stroke({ d: "M3 10.5h3.2l2-5 3.4 9 2-4h3.4" }); }
function MoneyIcon() { return stroke({ d: "M3.5 6h13v8.5h-13zM10 12.4a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2zM6 8.5h.01M14 12h.01" }); }
function UserIcon() { return stroke({ d: "M10 9.7a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2zM3.9 16.5a6.4 6.4 0 0 1 12.2 0" }); }
function CalendarIcon() { return stroke({ d: "M3.5 5.5h13v11h-13zM3.5 9h13M7 3.5v3M13 3.5v3" }); }
function PlusIcon() { return stroke({ d: "M10 4v12M4 10h12" }); }
function CampaignIcon() { return stroke({ d: "M3.5 8.5v3h2.5l6 3.5v-10l-6 3.5zM14.5 8a3 3 0 0 1 0 4" }); }
function StoreIcon() { return stroke({ d: "M3.5 8 5 4.5h10L16.5 8v1.5a2 2 0 0 1-4 0 2 2 0 0 1-5 0 2 2 0 0 1-4 0zM4.5 10.5v6h11v-6M8.5 16.5v-4h3v4" }); }
function BellIcon() { return stroke({ d: "M10 3.5a4.4 4.4 0 0 1 4.4 4.4c0 3.4 1.3 4.6 1.3 4.6H4.3s1.3-1.2 1.3-4.6A4.4 4.4 0 0 1 10 3.5zM8.4 15.5a1.7 1.7 0 0 0 3.2 0" }); }
function ChatIcon() { return stroke({ d: "M3.5 4.5h13v9h-7l-3.6 3v-3h-2.4z" }); }
