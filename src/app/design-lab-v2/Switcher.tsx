"use client";

import Link from "next/link";
import { Check, Plus } from "@phosphor-icons/react";
import { Sheet } from "./Sheet";
import { IdentityLabel, Avatar } from "./parts";

/**
 * The identity switcher: Personal or the active business. A bottom sheet on
 * phone, an anchored menu from 768px, listing Personal, each permitted
 * business and Add business. In the lab it moves between the Personal
 * and Business previews; it never changes a production session.
 */
export function Switcher({ current, className = "identity" }: { current: "Personal" | "Business"; className?: string }) {
  const rows = [
    { key: "Personal", name: "Maya Chen", mode: "Personal" as const, href: "/design-lab-v2/home", avatar: "/design-lab/portrait-maya-01.jpg", initials: "MC" },
    { key: "Business", name: "Loopday Coffee", mode: "Business" as const, href: "/design-lab-v2/business", avatar: null, initials: "LC" },
  ];
  const me = rows.find((r) => r.key === current) ?? rows[0];
  return (
    <Sheet title="Use TapMart as" variant="menu" triggerClass={className} triggerLabel={`${me.mode}: ${me.name}. Switch`} trigger={<IdentityLabel name={me.name} mode={me.mode} avatar={me.avatar} initials={me.initials} />}>
      {rows.map((r) => (
        <Link key={r.key} href={r.href} className="sheet-row" aria-current={r.key === current ? "true" : undefined}>
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}><Avatar src={r.avatar} name={r.name} initials={r.initials} size={32} /><span>{r.name}<span className="t-fact" style={{ display: "block" }}>{r.mode}</span></span></span>
          {r.key === current && <Check size={20} aria-hidden />}
        </Link>
      ))}
      <span className="sheet-row muted" aria-disabled="true"><span style={{ display: "flex", alignItems: "center", gap: 12 }}><Plus size={20} aria-hidden />Add business</span></span>
    </Sheet>
  );
}
