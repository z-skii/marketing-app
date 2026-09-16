"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { switchContext } from "@/app/(v2)/mode/actions";
import { Avatar } from "@/components/fs/parts";

export type Identity = { id: "personal" | string; name: string; sub: string; logo: string | null; active: boolean };

/**
 * Use TapMart as: yourself, or any business you belong to. The current
 * identity is named in words; every other row switches the whole app.
 */
export function IdentitySwitch({ identities, canAddBusiness }: { identities: Identity[]; canAddBusiness: boolean }) {
  const [pending, start] = useTransition();
  const [target, setTarget] = useState<string | null>(null);
  return (
    <ul className="fs-settings-group" aria-label="Use TapMart as">
      {identities.map((i) => (
        <li key={i.id}>
          <button
            type="button" className="fs-settings-row" disabled={pending || i.active} aria-current={i.active ? "true" : undefined}
            onClick={() => { setTarget(i.id); start(() => switchContext(i.id)); }}
          >
            <span className="fs-settings-lead">
              <Avatar src={i.logo} name={i.name} size={40} square={i.id !== "personal"} />
              <span className="fs-settings-text">
                <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>{i.name}</span>
                <span className="fs-t-meta fs-settings-sub">{i.sub}</span>
              </span>
            </span>
            <span className="fs-settings-end">{i.active ? <span className="fs-status is-confirmed">Current</span> : <span className="fs-link-ink">{pending && target === i.id ? "Switching" : "Switch"}</span>}</span>
          </button>
        </li>
      ))}
      {canAddBusiness && (
        <li>
          <Link href="/business/new" className="fs-settings-row">
            <span className="fs-t-body" style={{ fontWeight: 500 }}>Add a business</span>
            <span className="fs-settings-end"><CaretRight size={20} aria-hidden /></span>
          </Link>
        </li>
      )}
    </ul>
  );
}
