import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { House, ListChecks, Wallet, User, CalendarBlank, Plus, Megaphone, Storefront, MagnifyingGlass, ChatCircle, Bell, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { money } from "./fixtures";
import { Outside } from "./Outside";

/**
 * Shared shell parts for the V2 Design Lab, built to the Open Cut system:
 * a paper phone tab bar with a 2px ink underline, an 80px tablet rail, a
 * 200px paper desktop sidebar, the typeset wordmark with its brick
 * terminal, avatars, money. Icons are Phosphor at regular weight (the
 * project's bundled family) at the sizes the director specified for the
 * Lucide names.
 */

/** The wordmark: Bricolage Grotesque 700, tracking -0.04em, with the 12x2 brick terminal under its final portion. */
export function Wordmark({ size = 22, onInk = false, style, className = "" }: { size?: number; onInk?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <span className={`t-display ${className}`} style={{ position: "relative", display: "inline-block", fontSize: size, lineHeight: 1, letterSpacing: "-0.04em", color: onInk ? "var(--v2-paper)" : "var(--v2-ink)", paddingBottom: 4, ...style }}>
      TapMart
      <span aria-hidden style={{ position: "absolute", right: 0, bottom: 0, width: 12, height: 2, background: "var(--v2-accent)" }} />
    </span>
  );
}

export function Avatar({ src, name, initials, size = 40 }: { src: string | null; name: string; initials?: string; size?: number }) {
  return (
    <span className="avatar" aria-hidden style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" width={size} height={size} /> : (initials ?? name.trim()[0]?.toUpperCase())}
    </span>
  );
}

/** Money: DM Sans 600, tabular lining numerals. Discovery drops needless .00; balances keep two decimals. */
export function Money({ cents, basis, size = "money", whole = false, onInk = false, basisInk = false, inline = false }: { cents: number; basis?: string; size?: "money" | "money-compact" | "money-metric" | "money-public" | "money-balance"; whole?: boolean; onInk?: boolean; basisInk?: boolean; inline?: boolean }) {
  const amount = money(cents, { cents: !whole });
  if (inline) {
    return (
      <span style={{ display: "flex", alignItems: "baseline", gap: 4, flexWrap: "wrap" }}>
        <span className={size} style={{ color: onInk ? "var(--v2-paper)" : undefined }}>{amount}</span>
        {basis && <span className={basisInk ? "t-fact-ink" : "t-fact"} style={{ color: onInk ? "var(--v2-inverse-muted)" : undefined }}>{basis}</span>}
      </span>
    );
  }
  return (
    <span style={{ display: "block" }}>
      <span className={size} style={{ display: "block", color: onInk ? "var(--v2-paper)" : undefined }}>{amount}</span>
      {basis && <span className={basisInk ? "t-fact-ink" : "t-fact"} style={{ display: "block", marginTop: 4, color: onInk ? "var(--v2-inverse-muted)" : undefined }}>{basis}</span>}
    </span>
  );
}

/** The earning edge: a 2px ink line with a 12px brick terminal. */
export function Edge({ left = false, style }: { left?: boolean; style?: CSSProperties }) {
  return <span aria-hidden className={`edge${left ? " edge-left" : ""}`} style={{ display: "block", ...style }} />;
}

export type Tab = { href: string; label: string; deskLabel?: string; icon: ReactNode; create?: boolean; outside?: boolean; badge?: number };

const ICON = 22;
export const USER_TABS: Tab[] = [
  { href: "/design-lab-v2/home", label: "Home", icon: <House size={ICON} /> },
  { href: "#activity", label: "Activity", icon: <ListChecks size={ICON} />, outside: true },
  { href: "#earnings", label: "Earnings", icon: <Wallet size={ICON} />, outside: true },
  { href: "/design-lab-v2/profile", label: "Profile", icon: <User size={ICON} /> },
];
export const BUSINESS_TABS: Tab[] = [
  { href: "/design-lab-v2/business", label: "Home", icon: <House size={ICON} /> },
  { href: "#content", label: "Content", icon: <CalendarBlank size={ICON} />, outside: true },
  { href: "#create", label: "Create", deskLabel: "Create campaign", icon: <Plus size={18} weight="bold" />, create: true, outside: true },
  { href: "#campaigns", label: "Campaigns", icon: <Megaphone size={ICON} />, outside: true },
  { href: "#business", label: "Business", icon: <Storefront size={ICON} />, outside: true },
];

function TabLink({ t, active }: { t: Tab; active: string }) {
  const inner = <><span className={t.create ? "disc icon" : "icon"} aria-hidden={t.badge ? undefined : true}>{t.icon}{t.badge ? <span className="count" aria-label={`${t.badge} need attention`}>{t.badge}</span> : null}</span><span>{t.deskLabel ? <><span className="lbl-phone">{t.label}</span><span className="lbl-desk">{t.deskLabel}</span></> : t.label}</span></>;
  if (t.outside) return <Outside label={t.label} className={t.create ? "create" : undefined}>{inner}</Outside>;
  return <Link href={t.href} aria-current={t.label === active ? "page" : undefined} className={t.create ? "create" : undefined}>{inner}</Link>;
}

export function TabBar({ tabs, active, label }: { tabs: Tab[]; active: string; label: string }) {
  return <nav className="tabbar v2-fixed-unroll" aria-label={label}>{tabs.map((t) => <TabLink key={t.label} t={t} active={active} />)}</nav>;
}

/** Desktop and tablet rail: wordmark, identity switcher (desktop), destinations, labelled utilities. */
export function Rail({ mode, active, identity, tabs: given, search }: { mode: "Personal" | "Business"; active: string; identity: ReactNode; tabs?: Tab[]; search?: ReactNode }) {
  const tabs = given ?? (mode === "Business" ? BUSINESS_TABS : USER_TABS);
  return (
    <aside className="rail">
      <div className="wordmark"><Link href="/design-lab-v2" aria-label="TapMart"><Wordmark size={22} /></Link></div>
      <div className="switcher">{identity}</div>
      <nav aria-label="Main">{tabs.map((t) => <TabLink key={t.label} t={t} active={active} />)}</nav>
      <nav aria-label="Utilities" className="bottom">
        {search ?? <Outside label="Search"><span aria-hidden><MagnifyingGlass size={20} /></span><span>Search</span></Outside>}
        <Outside label="Messages"><span aria-hidden><ChatCircle size={20} /></span><span>Messages</span></Outside>
        <Outside label="Notifications"><span aria-hidden><Bell size={20} /></span><span>Notifications</span></Outside>
      </nav>
    </aside>
  );
}

/** The identity trigger: Personal or the business's real name, opening the switcher sheet. */
export function IdentityLabel({ name, mode, avatar, initials }: { name: string; mode: "Personal" | "Business"; avatar: string | null; initials?: string }) {
  return (
    <>
      <Avatar src={avatar} name={name} initials={initials} size={28} />
      <span style={{ textAlign: "left", minWidth: 0 }}>
        <span className="who clamp-1">{name}</span>
        <span className="v2-sr">{mode}</span>
      </span>
      <CaretDown size={16} aria-hidden style={{ color: "var(--v2-muted)", flexShrink: 0 }} />
    </>
  );
}

export function Utilities({ messages = 0, alerts = 0, search }: { messages?: number; alerts?: number; search?: ReactNode }) {
  return (
    <span style={{ display: "flex" }}>
      {search ?? <Outside label="Search" className="icon-btn"><MagnifyingGlass size={20} aria-hidden /></Outside>}
      <Outside label="Messages" className="icon-btn"><ChatCircle size={20} aria-hidden />{messages > 0 && <span className="badge" aria-label={`${messages} unread`}>{messages}</span>}</Outside>
      <Outside label="Notifications" className="icon-btn"><Bell size={20} aria-hidden />{alerts > 0 && <span className="badge" aria-label={`${alerts} new`}>{alerts}</span>}</Outside>
    </span>
  );
}
