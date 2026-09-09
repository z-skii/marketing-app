import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { SaveButton } from "@/components/v2/SaveButton";
import { Avatar, Chip, Money, SectionTitle } from "@/components/v2/ui";
import type { Opportunity } from "@/lib/v2/opportunities";

/** Pieces every opportunity layout shares, so the three kinds read as one screen. */

export function TopBar({ o, open }: { o: Opportunity; open: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <BackButton fallback="/home" label="Home" />
      <span className="flex items-center gap-2">
        {!open && <Chip tone="faint">Closed</Chip>}
        <span className="glass-tag flex h-10 w-10 items-center justify-center rounded-full">
          <SaveButton itemType="campaign" itemId={o.id} initialSaved={o.saved} />
        </span>
      </span>
    </div>
  );
}

export function BusinessRow({ o }: { o: Opportunity }) {
  return (
    <Link href={`/b/${o.business_slug}`} className="mt-3 flex items-center gap-2.5">
      <Avatar src={o.business_logo} name={o.business_name} size={28} />
      <span className="min-w-0 truncate font-display text-[0.9375rem] font-600">
        {o.business_name}
        {o.business_verified && <span className="ml-1 text-signal" aria-label="Verified business">✓</span>}
      </span>
      <span className="text-sm text-ink-faint" aria-hidden>→</span>
    </Link>
  );
}

export function WhatToDo({ items, title = "What to do" }: { items: string[]; title?: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6">
      <SectionTitle>{title}</SectionTitle>
      <ul className="row-list mt-2">
        {items.map((r, i) => (
          <li key={i} className="card-2 px-4 py-3 text-[0.9375rem]">{r}</li>
        ))}
      </ul>
    </section>
  );
}

/** Where the person is with this campaign, in one card. */
export function StateCard({
  title, body, tone = "plain", children,
}: { title: string; body?: string | null; tone?: "plain" | "signal"; children?: React.ReactNode }) {
  return (
    <div className={`card p-4 md:p-5 ${tone === "signal" ? "card-signal" : ""}`}>
      <p className={`font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em] ${tone === "signal" ? "text-signal" : ""}`}>{title}</p>
      {body && <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">{body}</p>}
      {children}
    </div>
  );
}

/** Sticky action on phones: money on the left, the one button on the right. */
export function StickyCta({
  cents, suffix, href, label,
}: { cents: number; suffix: string; href: string; label: string }) {
  const cls = "btn btn-signal btn-lg flex-1";
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-4 md:hidden">
      <div className="glass mx-auto flex max-w-2xl items-center gap-4 rounded-[var(--radius-card)] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <span className="pl-2">
          <Money cents={cents} size="md" />
          <span className="block text-xs text-ink-faint">{suffix}</span>
        </span>
        {href.startsWith("#") ? <a href={href} className={cls}>{label}</a> : <Link href={href} className={cls}>{label}</Link>}
      </div>
    </div>
  );
}
