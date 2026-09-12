"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { House, Pulse, Wallet, User, MagnifyingGlass, ChatCircle, Bell, CaretDown } from "@phosphor-icons/react";
import { Avatar, Wordmark } from "./parts";

/**
 * The Frame Shift User shell for migrated screens. Phone: a 64px identity
 * header (who you are acting as, then search, messages, notifications)
 * and a white 64px tab bar with a 24x3 cobalt selected edge. Desktop
 * (1024px and up): a 200px graphite rail with the wordmark, one identity
 * control, the four destinations, the utilities, and a 32px working field.
 * Same destinations as before: Home, Activity, Earnings, Profile. The
 * identity control opens Settings, where switching lives.
 */
export type FsIdentity = { name: string; avatar: string | null; mode: "Personal" };

const USER_NAV = [
  { href: "/home", label: "Home", icon: House },
  { href: "/activity", label: "Activity", icon: Pulse },
  { href: "/earnings", label: "Earnings", icon: Wallet },
  { href: "/me", label: "Profile", icon: User },
];

function active(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function FrameShiftUserShell({ identity, unreadNotifications, unreadMessages, children }: { identity: FsIdentity; unreadNotifications: number; unreadMessages: number; children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.classList.add("fs-doc");
    return () => document.documentElement.classList.remove("fs-doc");
  }, []);
  const utilities = [
    { href: "/search", label: "Search", icon: MagnifyingGlass, badge: 0 },
    { href: "/messages", label: "Messages", icon: ChatCircle, badge: unreadMessages },
    { href: "/alerts", label: "Notifications", icon: Bell, badge: unreadNotifications },
  ];
  return (
    <div className="fs">
      <div className="fs-app">
        <aside className="fs-rail fs-on-dark">
          <div className="fs-wordmark"><Link href="/home" aria-label="TapMart home"><Wordmark dark size={30} /></Link></div>
          <Link href="/me/settings" className="fs-identity" aria-label={`Acting as ${identity.name}, ${identity.mode}. Settings and switching.`}>
            <span className="fs-t-meta" style={{ display: "block", color: "var(--fs-muted-dark)" }}>{identity.mode}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Avatar src={identity.avatar} name={identity.name} size={28} />
              <span style={{ width: 88, fontWeight: 600, fontSize: 16, lineHeight: "20px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>{identity.name}</span>
              <CaretDown size={20} aria-hidden style={{ color: "var(--fs-muted-dark)", flexShrink: 0 }} />
            </span>
          </Link>
          <nav aria-label="Main">
            {USER_NAV.map((t) => <Link key={t.href} href={t.href} aria-current={active(t.href, pathname) ? "page" : undefined}><t.icon size={20} aria-hidden />{t.label}</Link>)}
          </nav>
          <nav aria-label="Utilities" className="fs-bottom">
            {utilities.map((u) => (
              <Link key={u.href} href={u.href} aria-current={active(u.href, pathname) ? "page" : undefined} aria-label={u.badge > 0 ? `${u.label}, ${u.badge} unread` : u.label}>
                <u.icon size={20} aria-hidden />{u.label}{u.badge > 0 && <span className="fs-badge" aria-hidden>{u.badge > 99 ? "99+" : u.badge}</span>}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="fs-phone">
          <header className="fs-phone-header">
            <Link href="/me/settings" className="fs-identity-trigger" aria-label={`Acting as ${identity.name}, ${identity.mode}. Settings and switching.`}>
              <Avatar src={identity.avatar} name={identity.name} size={28} />
              <span style={{ minWidth: 0 }}>
                <span className="fs-t-meta" style={{ display: "block", lineHeight: "16px" }}>{identity.mode}</span>
                <span style={{ display: "block", fontWeight: 600, fontSize: 16, lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{identity.name}</span>
              </span>
              <CaretDown size={16} aria-hidden style={{ color: "var(--fs-muted)", flexShrink: 0 }} />
            </Link>
            <span style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {utilities.map((u) => (
                <Link key={u.href} href={u.href} className="fs-icon-btn" aria-label={u.badge > 0 ? `${u.badge} unread ${u.label.toLowerCase()}` : u.label}>
                  <u.icon size={20} aria-hidden />{u.badge > 0 && <span className="fs-badge" aria-hidden>{u.badge > 99 ? "99+" : u.badge}</span>}
                </Link>
              ))}
            </span>
          </header>
          {children}
        </div>

        <nav className="fs-tabbar" aria-label="Main">
          {USER_NAV.map((t) => <Link key={t.href} href={t.href} aria-current={active(t.href, pathname) ? "page" : undefined}><span aria-hidden><t.icon size={20} /></span>{t.label}</Link>)}
        </nav>
      </div>
    </div>
  );
}
