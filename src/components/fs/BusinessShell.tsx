"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { House, CalendarBlank, Plus, Megaphone, Storefront, MagnifyingGlass, ChatCircle, Bell, CaretDown } from "@phosphor-icons/react";
import { Avatar, Wordmark } from "./parts";

/**
 * The Frame Shift Business shell for migrated business screens. Same
 * destinations as the current business shell: Home, Content, Create,
 * Campaigns, Business, with Search, Messages and Notifications as
 * utilities. Phone: a 64px identity header and a white tab bar with the
 * filled Create item in the middle. Desktop: the 200px graphite rail with
 * one identity control (opens Settings, where switching lives).
 */
export type FsBusiness = { id: string; name: string; logo: string | null };

const NAV = [
  { href: "/business", label: "Home", icon: House, exact: true },
  { href: "/business/content", label: "Content", icon: CalendarBlank, exact: false },
  { href: "/business/create", label: "Create", icon: Plus, exact: false, create: true },
  { href: "/business/campaigns", label: "Campaigns", icon: Megaphone, exact: false },
  { href: "/business/profile", label: "Business", icon: Storefront, exact: false },
];

function active(item: { href: string; exact: boolean }, pathname: string) {
  if (item.href === "/business" && (pathname.startsWith("/business/people") || pathname.startsWith("/business/cars"))) return true;
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

export function FrameShiftBusinessShell({ business, unreadNotifications, unreadMessages, children }: { business: FsBusiness; unreadNotifications: number; unreadMessages: number; children: React.ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.classList.add("fs-doc");
    return () => document.documentElement.classList.remove("fs-doc");
  }, []);
  const utilities = [
    { href: "/business/search", label: "Search", icon: MagnifyingGlass, badge: 0 },
    { href: "/messages", label: "Messages", icon: ChatCircle, badge: unreadMessages },
    { href: "/alerts", label: "Notifications", icon: Bell, badge: unreadNotifications },
  ];
  const identityLabel = `Acting as ${business.name}, Business. Settings and switching.`;
  return (
    <div className="fs">
      <div className="fs-app">
        <aside className="fs-rail fs-on-dark">
          <div className="fs-wordmark"><Link href="/business" aria-label="TapMart business home"><Wordmark dark size={30} /></Link></div>
          <Link href="/business/settings" className="fs-identity" aria-label={identityLabel}>
            <span className="fs-t-meta" style={{ display: "block", color: "var(--fs-muted-dark)" }}>Business</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Avatar src={business.logo} name={business.name} size={28} square />
              <span style={{ width: 88, fontWeight: 600, fontSize: 16, lineHeight: "20px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>{business.name}</span>
              <CaretDown size={20} aria-hidden style={{ color: "var(--fs-muted-dark)", flexShrink: 0 }} />
            </span>
          </Link>
          <nav aria-label="Main">
            {NAV.map((t) => <Link key={t.href} href={t.href} aria-current={active(t, pathname) ? "page" : undefined}><t.icon size={20} aria-hidden weight={t.create ? "bold" : "regular"} />{t.label}</Link>)}
          </nav>
          <nav aria-label="Utilities" className="fs-bottom">
            {utilities.map((u) => (
              <Link key={u.href} href={u.href} aria-current={pathname === u.href ? "page" : undefined} aria-label={u.badge > 0 ? `${u.label}, ${u.badge} unread` : u.label}>
                <u.icon size={20} aria-hidden />{u.label}{u.badge > 0 && <span className="fs-badge" aria-hidden>{u.badge > 99 ? "99+" : u.badge}</span>}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="fs-phone">
          <header className="fs-phone-header">
            <Link href="/business/settings" className="fs-identity-trigger" aria-label={identityLabel}>
              <Avatar src={business.logo} name={business.name} size={28} square />
              <span style={{ minWidth: 0 }}>
                <span className="fs-t-meta" style={{ display: "block", lineHeight: "16px" }}>Business</span>
                <span style={{ display: "block", fontWeight: 600, fontSize: 16, lineHeight: "20px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{business.name}</span>
              </span>
              <CaretDown size={16} aria-hidden className="fs-header-caret" style={{ flexShrink: 0 }} />
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
          <nav className="fs-tabbar" aria-label="Business">
            {NAV.map((t) => (
              <Link key={t.href} href={t.href} aria-current={active(t, pathname) ? "page" : undefined} className={t.create ? "is-create" : undefined}>
                <span aria-hidden style={{ display: "inline-grid", placeItems: "center" }}><t.icon size={t.create ? 20 : 20} weight={t.create ? "bold" : "regular"} /></span>
                <span>{t.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
