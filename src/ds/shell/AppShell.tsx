"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Wordmark } from "@/ds/Brand";
import { ChevronDownIcon } from "@/ds/icons";
import { BUSINESS_NAV, PERSONAL_NAV, utilities } from "./nav";

/**
 * The one application shell for both identities. Phone: a top bar that is
 * transparent at the top of the page and turns to glass once content
 * scrolls under it (identity on the left, wordmark in the centre, the
 * utilities on the right) and a floating glass tab bar with the
 * destinations (Business: Create filled in the middle). Desktop (1024px
 * and up): a translucent sidebar with the wordmark, one identity control
 * (opens Settings, where switching lives), the destinations, a red Create
 * action for a business, the utilities at the bottom. Same URLs, same
 * current-tab rules, same badges as before.
 */
export type ShellIdentity = { name: string; avatar: string | null; mode: "Personal" | "Business"; square?: boolean };

export function AppShell({ mode, identity, unreadMessages, unreadNotifications, frame, children }: {
  mode: "personal" | "business"; identity: ShellIdentity; unreadMessages: number; unreadNotifications: number; frame: "fs" | "v2"; children: ReactNode;
}) {
  const pathname = usePathname();
  const nav = mode === "business" ? BUSINESS_NAV : PERSONAL_NAV;
  const create = nav.find((n) => n.create) ?? null;
  const utils = utilities(mode, unreadMessages, unreadNotifications);
  const homeHref = mode === "business" ? "/business" : "/home";
  const settingsHref = mode === "business" ? "/business/settings" : "/me/settings";
  const identityLabel = `Acting as ${identity.name}, ${identity.mode}. Settings and switching.`;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (frame !== "fs") return;
    document.documentElement.classList.add("fs-doc");
    return () => document.documentElement.classList.remove("fs-doc");
  }, [frame]);

  return (
    <div className={`app-shell ${frame === "fs" ? "fs" : "app-root"}`}>
      <aside className="app-side">
        <div className="app-side-wordmark"><Link href={homeHref} aria-label="TapMart home"><Wordmark size={24} /></Link></div>
        <Link href={settingsHref} className="app-identity" aria-label={identityLabel}>
          <Avatar src={identity.avatar} name={identity.name} size={36} square={identity.square} />
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] leading-4 text-ink-soft">{identity.mode}</span>
            <span className="block truncate text-[15px] font-600 leading-5">{identity.name}</span>
          </span>
          <ChevronDownIcon size={16} aria-hidden className="shrink-0 text-ink-faint" />
        </Link>
        {create && <Link href={create.href} className="btn btn-signal app-create" aria-current={create.isActive(pathname) ? "page" : undefined}><create.icon size={20} weight="bold" aria-hidden />New campaign</Link>}
        <nav className="app-nav" aria-label="Main">
          {nav.filter((n) => !n.create).map((n) => (
            <Link key={n.href} href={n.href} aria-current={n.isActive(pathname) ? "page" : undefined}><n.icon size={20} aria-hidden />{n.label}</Link>
          ))}
        </nav>
        <nav className="app-nav app-side-bottom" aria-label="Utilities">
          {utils.map((u) => (
            <Link key={u.href} href={u.href} aria-current={pathname === u.href ? "page" : undefined} aria-label={u.badge > 0 ? `${u.label}, ${u.badge} unread` : u.label}>
              <u.icon size={20} aria-hidden />{u.label}{u.badge > 0 && <span className="app-badge" aria-hidden>{u.badge > 99 ? "99+" : u.badge}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="app-body">
        <header className={`app-top ${scrolled ? "is-scrolled" : ""}`}>
          <Link href={settingsHref} className="app-top-identity" aria-label={identityLabel} data-tip="Settings">
            <Avatar src={identity.avatar} name={identity.name} size={32} square={identity.square} />
          </Link>
          <Link href={homeHref} className="app-wordmark" aria-label="TapMart home"><Wordmark size={24} /></Link>
          <span className="app-top-actions">
            {utils.map((u) => (
              <Link key={u.href} href={u.href} className="iconbtn" aria-label={u.badge > 0 ? `${u.badge} unread ${u.label.toLowerCase()}` : u.label} data-tip={u.label}>
                <u.icon size={24} aria-hidden />{u.badge > 0 && <span aria-hidden className="app-dot" />}
              </Link>
            ))}
          </span>
        </header>
        {frame === "fs" ? <div className="fs-phone">{children}</div> : <div className="app-content">{children}</div>}
      </div>

      <nav className={`tm-bottomnav app-tabs ${nav.length === 5 ? "grid-cols-5" : "grid-cols-4"}`} aria-label={mode === "business" ? "Business" : "Main"}>
        {nav.map((n) => (
          <Link key={n.href} href={n.href} aria-current={n.isActive(pathname) ? "page" : undefined} className={n.create ? "is-create" : undefined}>
            <span className="inline-grid place-items-center"><n.icon size={24} weight={n.create ? "bold" : n.isActive(pathname) ? "fill" : "regular"} aria-hidden /></span>
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Avatar({ src, name, size, square = false }: { src: string | null; name: string; size: number; square?: boolean }) {
  const radius = square ? Math.round(size * 0.3) : "50%";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", flexShrink: 0, boxShadow: "0 0 0 1px rgba(18,20,23,0.08)" }} />;
  }
  return <span aria-hidden style={{ display: "inline-grid", placeItems: "center", width: size, height: size, borderRadius: radius, background: "var(--tm-surface3)", color: "var(--tm-text)", fontWeight: 600, fontSize: Math.round(size * 0.42), flexShrink: 0 }}>{(name.trim()[0] ?? "?").toUpperCase()}</span>;
}
