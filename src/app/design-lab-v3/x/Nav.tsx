"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { House, ListChecks, Wallet, User, CalendarBlank, Plus, Megaphone, Storefront } from "@phosphor-icons/react";
import { Rail, TabBar, Utilities, type Tab } from "../../design-lab-v2/parts";
import { Sheet } from "../../design-lab-v2/Sheet";
import { Avatar } from "../../design-lab-v2/parts";
import { CaretDown, Check } from "@phosphor-icons/react";
import { SwitcherV3 } from "../parts";
import { homeActivityCount, businessAttention } from "../../design-lab-v2/fixtures";
import { LabStrip } from "./motion";

/**
 * V3 app shells. The phone tab bar is the one floating material on a
 * default app surface: a 64px light lens inset 12px, four or five equal
 * labelled destinations, real content passing beneath it. Tablet keeps the
 * 80px labelled rail and desktop the opaque 200px sidebar (no lens).
 * Destinations are unchanged from V2; unimplemented ones open the
 * explicit Outside this preview notice.
 */
const ICON = 22;
export const USER_TABS_V3: Tab[] = [
  { href: "/design-lab-v3/home", label: "Home", icon: <House size={ICON} /> },
  { href: "#activity", label: "Activity", icon: <ListChecks size={ICON} />, outside: true, badge: homeActivityCount },
  { href: "#earnings", label: "Earnings", icon: <Wallet size={ICON} />, outside: true },
  { href: "/design-lab-v3/profile", label: "Profile", icon: <User size={ICON} /> },
];
export const BUSINESS_TABS_X: Tab[] = [
  { href: "/design-lab-v3/business", label: "Home", icon: <House size={ICON} /> },
  { href: "#content", label: "Content", icon: <CalendarBlank size={ICON} />, outside: true, badge: businessAttention.content },
  { href: "#create", label: "Create", deskLabel: "Create campaign", icon: <Plus size={18} weight="bold" />, create: true, outside: true },
  { href: "#campaigns", label: "Campaigns", icon: <Megaphone size={ICON} />, outside: true, badge: businessAttention.campaigns },
  { href: "/design-lab-v3/business/profile", label: "Business", icon: <Storefront size={ICON} /> },
];

/** The V3 Personal identity switcher: the same isolated sheet as V2, with V3 destinations. It never changes a production session. */
export function PersonalSwitcher({ className = "identity" }: { className?: string }) {
  const rows = [
    { key: "Personal", name: "Maya Chen", mode: "Personal" as const, href: "/design-lab-v3/home", avatar: "/design-lab-v3/m/portrait-maya-480.jpg", initials: "MC" },
    { key: "Business", name: "Loopday Coffee", mode: "Business" as const, href: "/design-lab-v3/business", avatar: null, initials: "LC" },
  ];
  return (
    <Sheet title="Use TapMart as" variant="menu" triggerClass={className} triggerLabel="Personal: Maya Chen. Switch" trigger={<><span className="who">Personal</span><CaretDown size={16} aria-hidden style={{ color: "var(--v2-muted)" }} /></>}>
      {rows.map((r) => (
        <Link key={r.key} href={r.href} className="sheet-row" aria-current={r.key === "Personal" ? "true" : undefined}>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}><Avatar src={r.avatar} name={r.name} initials={r.initials} size={32} /><span>{r.name}<span className="t-fact" style={{ display: "block" }}>{r.mode}</span></span></span>
          {r.key === "Personal" && <Check size={20} aria-hidden />}
        </Link>
      ))}
      <span className="sheet-row muted" aria-disabled="true"><span style={{ display: "flex", alignItems: "center", gap: 12 }}><Plus size={20} aria-hidden />Add business</span></span>
    </Sheet>
  );
}

/** The Personal shell: identity switcher and utilities in the header, lab and motion strip, the floating tab bar. */
export function UserShell({ title, active, children, headerRight, mainClass = "" }: { title: string; active: "Home" | "Profile"; children: ReactNode; headerRight?: ReactNode; mainClass?: string }) {
  return (
    <div className="desk x-shell">
      <Rail mode="Personal" active={active} identity={<PersonalSwitcher />} tabs={USER_TABS_V3} />
      <div className="phone">
        <h1 className="v2-sr">{title}</h1>
        <header className="phone-header"><PersonalSwitcher />{headerRight ?? <Utilities />}</header>
        <div className="desk-wrap">
          <header className="desk-header tablet-only"><PersonalSwitcher />{headerRight ?? <Utilities />}</header>
          <main className={`phone-main desk-main ${mainClass}`}>{children}</main>
        </div>
        <TabBar tabs={USER_TABS_V3} active={active} label="Personal" />
      </div>
    </div>
  );
}

/** The Business shell with V3 destinations. */
export function BizShell({ title, active, children, header, mainClass = "" }: { title: string; active: "Home" | "Business"; children: ReactNode; header?: ReactNode; mainClass?: string }) {
  return (
    <div className="desk x-shell">
      <Rail mode="Business" active={active} identity={<SwitcherV3 />} tabs={BUSINESS_TABS_X} />
      <div className="phone">
        <h1 className="v2-sr">{title}</h1>
        <header className="phone-header">{header ?? <><SwitcherV3 /><Utilities /></>}</header>
        <div className="desk-wrap">
          <header className="desk-header tablet-only">{header ?? <><SwitcherV3 /><Utilities /></>}</header>
          <main className={`phone-main desk-main ${mainClass}`}>{children}</main>
        </div>
        <TabBar tabs={BUSINESS_TABS_X} active={active} label="Business" />
      </div>
    </div>
  );
}

export { LabStrip, Link };
