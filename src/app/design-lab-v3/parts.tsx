"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { House, CalendarBlank, Plus, Megaphone, Storefront, CaretDown, Check } from "@phosphor-icons/react";
import { Rail, TabBar, Utilities, Avatar, type Tab } from "../design-lab-v2/parts";
import { Sheet } from "../design-lab-v2/Sheet";
import { business, defaultCard } from "./fixtures";
import { Logo } from "./wallet/Cards";

/**
 * V3 shells reuse the V2 Open Cut parts (rail, tab bar, utilities) with
 * V3 routes. The five business destinations are unchanged; Loyalty lives
 * where the director placed it, not in the navigation.
 */
const ICON = 22;
export const BUSINESS_TABS_V3: Tab[] = [
  { href: "/design-lab-v3/business", label: "Home", icon: <House size={ICON} /> },
  { href: "#content", label: "Content", icon: <CalendarBlank size={ICON} />, outside: true, badge: 2 },
  { href: "#create", label: "Create", deskLabel: "Create campaign", icon: <Plus size={18} weight="bold" />, create: true, outside: true },
  { href: "#campaigns", label: "Campaigns", icon: <Megaphone size={ICON} />, outside: true, badge: 3 },
  { href: "/design-lab-v3/business/profile", label: "Business", icon: <Storefront size={ICON} /> },
];

export function SwitcherV3({ className = "identity" }: { className?: string }) {
  const rows = [
    { key: "Personal", name: "Maya Chen", mode: "Personal" as const, href: "/design-lab-v3/home", avatar: "/design-lab-v3/m/portrait-maya-480.jpg", initials: "MC" },
    { key: "Business", name: business.name, mode: "Business" as const, href: "/design-lab-v3/business", avatar: null, initials: business.initials },
  ];
  const me = rows[1];
  return (
    <Sheet title="Use TapMart as" variant="menu" triggerClass={className} triggerLabel={`Business: ${me.name}. Switch`} trigger={<><span className="loy-brand-mark" style={{ width: 28, height: 28, background: defaultCard.bg, color: defaultCard.fg }}><Logo design={defaultCard} size={18} /></span><span style={{ textAlign: "left", minWidth: 0 }}><span className="who clamp-1">{me.name}</span><span className="v2-sr">Business</span></span><CaretDown size={16} aria-hidden style={{ color: "var(--v2-muted)", flexShrink: 0 }} /></>}>
      {rows.map((r) => (
        <Link key={r.key} href={r.href} className="sheet-row" aria-current={r.key === "Business" ? "true" : undefined}>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}><Avatar src={r.avatar} name={r.name} initials={r.initials} size={32} /><span>{r.name}<span className="t-fact" style={{ display: "block" }}>{r.mode}</span></span></span>
          {r.key === "Business" && <Check size={20} aria-hidden />}
        </Link>
      ))}
      <span className="sheet-row muted" aria-disabled="true"><span style={{ display: "flex", alignItems: "center", gap: 12 }}><Plus size={20} aria-hidden />Add business</span></span>
    </Sheet>
  );
}

/** The business shell: phone header and tab bar, tablet rail, desktop sidebar; the page body in `.desk-main`. */
export function BusinessShell({ title, children, header, mainClass = "", active = "Home", bare = false }: { title: string; children: ReactNode; header?: ReactNode; mainClass?: string; active?: "Home" | "Business"; bare?: boolean }) {
  return (
    <div className="desk x-shell">
      <Rail mode="Business" active={active} identity={<SwitcherV3 />} tabs={BUSINESS_TABS_V3} />
      <div className="phone">
        <h1 className="v2-sr">{title}</h1>
        {!bare && <header className="phone-header">{header ?? <><SwitcherV3 /><Utilities /></>}</header>}
        <div className="desk-wrap">
          {!bare && <header className="desk-header tablet-only">{header ?? <><SwitcherV3 /><Utilities /></>}</header>}
          <main className={`phone-main desk-main ${mainClass}`}>{children}</main>
        </div>
        <TabBar tabs={BUSINESS_TABS_V3} active={active} label="Business" />
      </div>
    </div>
  );
}

export { CaretDown };
