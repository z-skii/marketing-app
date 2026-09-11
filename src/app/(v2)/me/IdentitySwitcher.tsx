"use client";

import Link from "next/link";
import { useTransition } from "react";
import { CaretRight, Plus } from "@phosphor-icons/react";
import { switchContext } from "@/app/(v2)/mode/actions";
import { Avatar } from "@/components/v2/ui";

export type Identity = { id: "personal" | string; name: string; sub: string; logo: string | null; active: boolean };

/**
 * Use TapMart as: yourself, or any business you belong to, as one grouped
 * list. The current identity sits on the deeper surface with a lime
 * "Current"; every other row switches the whole app into that mode.
 * Designed by OpenAI in docs/design-specs/business-settings.md.
 */
export function IdentitySwitcher({ identities, canAddBusiness }: { identities: Identity[]; canAddBusiness: boolean; flat?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <ul className="overflow-hidden rounded-[20px] bg-surface">
      {identities.map((i, n) => (
        <li key={i.id} className={n > 0 ? "relative before:absolute before:top-0 before:right-[13px] before:left-[75px] before:h-px before:bg-rule" : undefined}>
          <button
            type="button"
            disabled={pending || i.active}
            aria-current={i.active ? "true" : undefined}
            onClick={() => start(() => switchContext(i.id))}
            className={`flex h-[66px] w-full items-center gap-3.5 px-[13px] text-left transition-[background,transform] duration-100 ${i.active ? "bg-surface-3" : "can-hover:hover:bg-surface-3 active:scale-[0.985] active:bg-[color:var(--tm-pressed)]"}`}
          >
            <Avatar src={i.logo} name={i.name} size={48} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[14px] leading-[18px] font-700">{i.name}</span>
              <span className="mt-0.5 block truncate text-[12px] leading-4 text-ink-soft">{i.sub}</span>
            </span>
            {i.active ? (
              <span className="font-display text-[12px] leading-[15px] font-[760] text-signal">Current</span>
            ) : (
              <span className="inline-flex h-11 min-w-[63px] items-center justify-end font-display text-[14px] leading-[17px] font-700 text-ink-2">{pending ? "Switching" : "Switch"}</span>
            )}
          </button>
        </li>
      ))}
      {canAddBusiness && (
        <li className="relative before:absolute before:top-0 before:right-[13px] before:left-[75px] before:h-px before:bg-rule">
          <Link href="/business/new" className="flex h-[58px] w-full items-center gap-3.5 px-[13px] transition-[background,transform] duration-100 can-hover:hover:bg-surface-3 active:scale-[0.985] active:bg-[color:var(--tm-pressed)]">
            <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-[14px] text-ink"><Plus size={20} weight="bold" /></span>
            <span className="flex-1 font-display text-[14px] leading-[18px] font-700">Add business</span>
            <CaretRight size={18} className="text-ink-soft" aria-hidden />
          </Link>
        </li>
      )}
    </ul>
  );
}
