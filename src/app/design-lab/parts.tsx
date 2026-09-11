import Link from "next/link";
import {
  House, Pulse, Wallet, User, CalendarBlank, Plus, Megaphone, Storefront, MagnifyingGlass, ChatCircle, Bell, CaretDown,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Shared shell parts for the Design Lab prototypes, built to the Frame
 * Shift shell specification: a white phone tab bar with a 24x3 cobalt
 * indicator, and a 200px graphite desktop rail with a 3x20 selected edge.
 * Icons are Phosphor at regular weight (the project's installed family),
 * standing in for the Lucide family the director named.
 */

/** The offset-frame mark: two frame halves; the negative space is the recognizable part. */
export function Mark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className} fill="currentColor">
      <path d="M3 3H19V9H9V23H3Z" />
      <path d="M13 23H23V9H29V29H13Z" />
    </svg>
  );
}

export function Wordmark({ dark = false, size = 30 }: { dark?: boolean; size?: number }) {
  return (
    <span className="t-display" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: size, lineHeight: `${size + 2}px`, letterSpacing: "-0.04em", color: dark ? "var(--tm-on-dark)" : "var(--tm-ink)" }}>
      <Mark size={Math.round(size * 0.93)} />
      <span style={{ color: "inherit" }}>TapMart</span>
    </span>
  );
}

export type Tab = { href: string; label: string; icon: React.ReactNode; create?: boolean };

export const USER_TABS: Tab[] = [
  { href: "/design-lab/user-home", label: "Home", icon: <House size={20} /> },
  { href: "#activity", label: "Activity", icon: <Pulse size={20} /> },
  { href: "#earnings", label: "Earnings", icon: <Wallet size={20} /> },
  { href: "/design-lab/user-profile", label: "Profile", icon: <User size={20} /> },
];

export const BUSINESS_TABS: Tab[] = [
  { href: "/design-lab/business-home", label: "Home", icon: <House size={20} /> },
  { href: "/design-lab/business-content", label: "Content", icon: <CalendarBlank size={20} /> },
  { href: "#create", label: "Create", icon: <Plus size={20} weight="bold" />, create: true },
  { href: "#campaigns", label: "Campaigns", icon: <Megaphone size={20} /> },
  { href: "#business", label: "Business", icon: <Storefront size={20} /> },
];

export function TabBar({ tabs, active, label }: { tabs: Tab[]; active: string; label: string }) {
  return (
    <nav className="tabbar" aria-label={label}>
      {tabs.map((t) => (
        <Link key={t.label} href={t.href} aria-current={t.label === active ? "page" : undefined} className={t.create ? "create" : undefined}>
          <span aria-hidden>{t.icon}</span>
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/** Phone root header: identity first, utilities at the right. The logo is not repeated here. */
export function PhoneHeader({ name, avatar, mode, right }: { name: string; avatar: string | null; mode: string; right?: React.ReactNode }) {
  return (
    <header className="phone-header">
      <button type="button" className="identity-trigger" aria-label={`Acting as ${name}, ${mode}. Switch.`} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
        <Avatar src={avatar} name={name} size={28} square={mode === "Business"} />
        <span style={{ textAlign: "left" }}>
          <span className="t-meta" style={{ display: "block", lineHeight: "16px" }}>{mode}</span>
          <span style={{ display: "block", fontWeight: 600, fontSize: 16, lineHeight: "20px" }}>{name}</span>
        </span>
        <CaretDown size={16} aria-hidden style={{ color: "var(--tm-muted)" }} />
      </button>
      <span style={{ display: "flex", gap: 4 }}>{right ?? <><button type="button" className="icon-btn" aria-label="Messages"><ChatCircle size={20} /></button><button type="button" className="icon-btn" aria-label="Notifications"><Bell size={20} /></button></>}</span>
    </header>
  );
}

export function Avatar({ src, name, size = 40, square = false }: { src: string | null; name: string; size?: number; square?: boolean }) {
  const radius = square ? 8 : "50%";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: radius, objectFit: "cover", flexShrink: 0 }} />;
  }
  return <span aria-hidden style={{ display: "inline-grid", placeItems: "center", width: size, height: size, borderRadius: radius, background: "var(--tm-underlay)", color: "var(--tm-ink)", fontWeight: 600, fontSize: Math.round(size * 0.4), flexShrink: 0 }}>{name.trim()[0]?.toUpperCase()}</span>;
}

/** Desktop rail: wordmark, identity, destinations, create, utilities. */
export function Rail({ mode, active, business }: { mode: "Personal" | "Business"; active: string; business?: { name: string; logo: string | null } }) {
  const tabs = mode === "Business" ? BUSINESS_TABS.filter((t) => !t.create) : USER_TABS;
  return (
    <aside className="rail on-dark">
      <div className="wordmark"><Wordmark dark size={22} /></div>
      <button type="button" className="identity" aria-label={`Acting as ${business?.name ?? "you"}, ${mode}. Switch.`}>
        <Avatar src={business?.logo ?? null} name={business?.name ?? "P"} size={28} square={mode === "Business"} />
        <span style={{ textAlign: "left", minWidth: 0 }}>
          <span className="t-meta" style={{ display: "block", color: "var(--tm-muted-dark)", lineHeight: "16px" }}>{mode}</span>
          <span style={{ display: "block", fontWeight: 600, fontSize: 14, lineHeight: "18px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{business?.name ?? "Personal"}</span>
        </span>
        <CaretDown size={16} aria-hidden style={{ marginLeft: "auto", color: "var(--tm-muted-dark)" }} />
      </button>
      {mode === "Business" && <Link href="#create" className="btn btn-primary create"><Plus size={18} weight="bold" aria-hidden />Create a campaign</Link>}
      <nav aria-label="Main">
        {tabs.map((t) => <Link key={t.label} href={t.href} aria-current={t.label === active ? "page" : undefined}><span aria-hidden>{t.icon}</span>{t.label}</Link>)}
      </nav>
      <nav aria-label="Utilities" className="bottom">
        <Link href="#search"><MagnifyingGlass size={20} aria-hidden />Search</Link>
        <Link href="#messages"><ChatCircle size={20} aria-hidden />Messages</Link>
        <Link href="#alerts"><Bell size={20} aria-hidden />Notifications</Link>
      </nav>
    </aside>
  );
}

export function Money({ cents, per, className = "money", dark = false }: { cents: number; per?: string; className?: string; dark?: boolean }) {
  const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
  return (
    <span style={{ display: "block" }}>
      <span className={className} style={{ display: "block", color: dark ? "#fff" : "var(--tm-ink)" }}>{amount}</span>
      {per && <span className="t-meta" style={{ display: "block", color: dark ? "var(--tm-muted-dark)" : undefined }}>{per}</span>}
    </span>
  );
}
