"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardRow } from "@/lib/data";
import { formatCount } from "@/lib/money";

const SEEN_KEY = "untitled-surprise-seen";
const SEEN_MAX = 8;

/**
 * SURPRISE ME: picks an active link the visitor has not seen recently and
 * presents it inside the interface. Nothing is opened and no client credit is
 * touched until the visitor deliberately chooses OPEN, which routes through
 * the same qualified /go/ path as every other click.
 */
export function SurpriseMe({ candidates }: { candidates: BoardRow[] }) {
  const [pick, setPick] = useState<BoardRow | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const choose = useCallback(() => {
    if (candidates.length === 0) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    } catch {
      seen = [];
    }
    const fresh = candidates.filter((c) => !seen.includes(c.link_id));
    const pool = fresh.length > 0 ? fresh : candidates;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setPick(next);
    try {
      localStorage.setItem(
        SEEN_KEY,
        JSON.stringify([next.link_id, ...seen].slice(0, SEEN_MAX)),
      );
    } catch {
      /* private windows are fine; the pick just repeats sooner */
    }
  }, [candidates]);

  const open = () => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    choose();
  };
  const close = useCallback(() => {
    setPick(null);
    returnFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!pick) return;
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pick, close]);

  if (candidates.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="flex h-full shrink-0 items-center gap-2 border-l border-ink bg-paper px-4 font-mono text-[0.6875rem] font-600 tracking-[0.1em] uppercase transition-colors hover:bg-signal hover:text-white"
      >
        Surprise me <span aria-hidden="true">↗</span>
      </button>

      {pick && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Surprise pick"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 cursor-default bg-ink/40"
          />
          <div
            ref={panelRef}
            tabIndex={-1}
            className="spot-in relative w-full max-w-md border-[1.5px] border-ink bg-paper p-6 outline-none md:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow !text-signal">Surprise</p>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="font-mono text-sm text-ink-faint transition-colors hover:text-ink"
              >
                ✕
              </button>
            </div>
            <p translate="no" className="mt-4 font-mono text-xs tracking-[0.1em] text-ink-faint uppercase">
              {pick.domain}
            </p>
            <h3 className="mt-2 font-display text-3xl leading-[0.95] font-800 tracking-[-0.04em] break-words">
              {pick.display_name}
            </h3>
            {pick.short_description && (
              <p className="mt-3 text-sm leading-snug text-ink-soft">{pick.short_description}</p>
            )}
            <p className="tnum mt-3 font-mono text-xs text-ink-faint">
              #{pick.rank} on the board / {formatCount(pick.total_opens)} opens
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={`/go/${pick.placement_id}?s=surprise`}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="btn btn-signal !px-6 !py-3"
              >
                Open <span aria-hidden="true">↗</span>
              </a>
              <button type="button" onClick={choose} className="btn btn-ghost !py-3">
                Another
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
