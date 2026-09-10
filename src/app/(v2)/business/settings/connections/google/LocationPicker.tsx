"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "@phosphor-icons/react";
import { chooseGoogleLocation } from "../actions";

export type PickerLocation = { name: string; title: string; address: string | null };

/** Google listed more than one location: the business picks the one TapMart should manage. */
export function LocationPicker({ locations }: { locations: PickerLocation[] }) {
  const router = useRouter();
  const [choosing, setChoosing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const choose = (name: string) => {
    setError(null);
    setChoosing(name);
    start(async () => {
      const result = await chooseGoogleLocation(name);
      if (!result.ok) { setError(result.error); setChoosing(null); return; }
      router.push("/business/google?connected=1");
      router.refresh();
    });
  };

  return (
    <div>
      <ul className="mt-4 divide-y divide-rule" aria-label="Locations">
        {locations.map((l, i) => (
          <li key={l.name} className="reveal flex min-h-16 items-center gap-3 py-3" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
            <MapPin size={24} weight="fill" className="shrink-0 text-ink-soft" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[1.0625rem] leading-tight font-700">{l.title}</p>
              {l.address && <p className="mt-0.5 truncate text-sm text-ink-soft">{l.address}</p>}
            </div>
            {choosing === l.name && pending ? (
              <span className="flex items-center gap-2 text-sm text-ink-soft"><span className="live-dot" aria-hidden />Connecting</span>
            ) : (
              <button type="button" className="btn btn-sm btn-signal" disabled={pending} onClick={() => choose(l.name)}>Use this location</button>
            )}
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="mt-3 text-sm alert-text">{error}</p>}
    </div>
  );
}
