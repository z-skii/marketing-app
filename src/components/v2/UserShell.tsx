"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Pulse, Wallet, User, Bell, ChatCircle, Gear } from "@phosphor-icons/react";
import { BottomNav, Rail, TopBar, TopIcon, type ChromeNavItem } from "./Chrome";

/**
 * The User shell: the earning marketplace. Home · Activity · Earnings ·
 * Profile. Phones get the 56px top bar and the floating bottom bar; screens
 * with room get the collapsed rail with the same destinations plus Messages
 * and Notifications, and who you are at the bottom.
 */

export type ShellIdentity = { name: string; sub: string; logo: string | null };

export type ShellProps = {
  identity: ShellIdentity;
  unreadNotifications: number;
  unreadMessages: number;
  children: React.ReactNode;
};

const USER_NAV: ChromeNavItem[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/activity", label: "Activity", icon: Pulse, noFill: true },
  { href: "/earnings", label: "Earnings", icon: Wallet },
  { href: "/me", label: "Profile", icon: User },
];

export function UserShell(props: ShellProps) {
  const pathname = usePathname();
  return (
    <div className="app-root min-h-dvh bg-paper rail:grid rail:grid-cols-[88px_minmax(0,1fr)]">
      <Rail
        homeHref="/home"
        items={USER_NAV}
        extra={[
          { href: "/messages", label: "Messages", icon: ChatCircle, badge: props.unreadMessages },
          { href: "/alerts", label: "Alerts", icon: Bell, badge: props.unreadNotifications },
        ]}
        pathname={pathname}
        identity={
          <Link href="/me/settings" aria-label={`Acting as ${props.identity.name}. Settings and switching.`} className="flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-[16px] text-[10px] leading-3 font-[650] text-ink-soft can-hover:hover:bg-surface">
            <IdentityMark identity={props.identity} />
          </Link>
        }
      />

      <div className="min-w-0">
        <TopBar
          homeHref="/home"
          left={<TopIcon href="/messages" label="Messages" icon={ChatCircle} badge={props.unreadMessages} />}
          right={<><TopIcon href="/alerts" label="Notifications" icon={Bell} badge={props.unreadNotifications} /><TopIcon href="/me/settings" label="Settings" icon={Gear} /></>}
        />
        <div className="pb-24 rail:pb-0">{props.children}</div>
      </div>

      <BottomNav items={USER_NAV} pathname={pathname} label="Main" />
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
    return <img src={identity.logo} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/10" />;
  }
  return (
    <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 font-display text-[13px] font-600 ring-1 ring-white/10">
      {(identity.name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
