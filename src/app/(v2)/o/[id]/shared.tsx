import Link from "next/link";
import { CheckCircle, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { SaveButton } from "@/components/v2/SaveButton";
import { Avatar, Chip, Money } from "@/components/v2/ui";
import type { Opportunity } from "@/lib/v2/opportunities";
import type { CreatorStep } from "@/lib/ai/types";

/** Pieces every opportunity layout shares, so the three kinds read as one screen. */

export function TopBar({ o, open }: { o: Opportunity; open: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <BackButton fallback="/home" label="Home" />
      <span className="flex items-center gap-2">
        {!open && <Chip tone="faint">Closed</Chip>}
        <SaveButton itemType="campaign" itemId={o.id} initialSaved={o.saved} className="!bg-surface-2" />
      </span>
    </div>
  );
}

export function BusinessRow({ o }: { o: Opportunity }) {
  return (
    <Link href={`/b/${o.business_slug}`} className="flex min-w-0 items-center gap-2 py-1">
      <Avatar src={o.business_logo} name={o.business_name} size={26} />
      <span className="min-w-0 truncate font-display text-[0.9375rem] font-600">
        {o.business_name}
        {o.business_verified && <CheckCircle size={16} weight="fill" className="ml-1 inline-block align-[-2px] text-signal" aria-label="Verified business" />}
      </span>
      <CaretRight size={14} className="text-ink-faint" aria-hidden />
    </Link>
  );
}

/**
 * Numbered visual steps: a frame (or a big number when there is none) and
 * one short line each. This is the creator assistant: a production
 * checklist, not a chat.
 */
export function StepList({ steps, poster }: { steps: CreatorStep[]; poster?: string | null }) {
  if (steps.length === 0) return null;
  return (
    <ol className="mt-3 flex flex-col gap-2">
      {steps.map((s, i) => {
        const frame = s.frame_url ?? null;
        return (
          <li key={s.n} className="reveal flex items-center gap-3" style={{ animationDelay: `${i * 60}ms` }}>
            <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
              {frame ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={frame} alt="" className="h-full w-full object-cover" loading="lazy" width={96} height={128} />
              ) : poster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poster} alt="" className="h-full w-full object-cover opacity-40" loading="lazy" width={96} height={128} style={{ objectPosition: `${(i * 37) % 100}% ${(i * 53) % 100}%` }} />
              ) : null}
              <span className="tnum absolute right-1 bottom-0.5 font-mono text-[0.6875rem] font-600 text-ink">{String(s.n).padStart(2, "0")}</span>
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[1.0625rem] leading-snug font-700">{s.text}</span>
              {s.timing && <span className="block text-xs text-ink-faint">{s.timing}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Plain requirement list for Story and Car campaigns. */
export function WhatToDo({ items, title = "What to do" }: { items: string[]; title?: string }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="eyebrow">{title}</h2>
      <ol className="mt-2 flex flex-col">
        {items.map((r, i) => (
          <li key={i} className="flex gap-3 border-t border-rule py-3 text-[1.0625rem] first:border-t-0">
            <span className="tnum font-mono text-sm text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
            <span>{r}</span>
          </li>
        ))}
      </ol>
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
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-4 rail:hidden">
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
