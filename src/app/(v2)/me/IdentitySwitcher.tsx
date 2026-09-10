"use client";

import Link from "next/link";
import { useTransition } from "react";
import { switchContext } from "@/app/(v2)/mode/actions";
import { Avatar } from "@/components/v2/ui";

export type Identity = { id: "personal" | string; name: string; sub: string; logo: string | null; active: boolean };

/**
 * Use TapMart as: yourself, or any business you belong to. One tap switches
 * the whole app into that mode. The current identity is marked, not lime,
 * so the switch itself stays the only accent.
 */
export function IdentitySwitcher({ identities, canAddBusiness, flat = false }: { identities: Identity[]; canAddBusiness: boolean; flat?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <ul className={flat ? "divide-y divide-rule overflow-hidden rounded-[var(--radius-card)] bg-surface" : "row-list"}>
      {identities.map((i) => (
        <li key={i.id}>
          <button
            type="button"
            disabled={pending || i.active}
            aria-current={i.active ? "true" : undefined}
            onClick={() => start(() => switchContext(i.id))}
            className={`${flat ? "" : "card"} flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left ${i.active ? "" : "hover:bg-surface-2"}`}
          >
            <Avatar src={i.logo} name={i.name} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[0.9375rem] font-700">{i.name}</span>
              <span className="block truncate text-sm text-ink-faint">{i.sub}</span>
            </span>
            {i.active ? (
              <span className="font-display text-sm font-700 text-signal">Current</span>
            ) : (
              <span className="font-display text-sm font-600 text-ink-soft">{pending ? "Switching…" : "Switch"}</span>
            )}
          </button>
        </li>
      ))}
      {canAddBusiness && (
        <li>
          <Link href="/business/new" className={`${flat ? "" : "card-2"} flex min-h-14 items-center gap-3 px-4 py-3`}>
            <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-surface font-display text-xl font-700">+</span>
            <span className="font-display text-[0.9375rem] font-700">Add business</span>
          </Link>
        </li>
      )}
    </ul>
  );
}
