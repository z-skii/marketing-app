"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { OpenButton } from "../OpenButton";
import type { BoardRow } from "@/lib/data";
import { formatCredit, formatCount } from "@/lib/money";

const PAGE_SIZE = 8;
const ROTATE_SECONDS = 10;
const RESUME_AFTER_MS = 20_000;

/**
 * THE BOARD as a rotating window. Ranks four and up cycle through the screen
 * in pages of eight, so a link at #38 still takes its turn on the main stage.
 * Order is always rank order; rotation only changes which segment is visible.
 *
 * Advances every ten seconds. Any manual act (arrows, keys, swipe) pauses the
 * rotation, which resumes on its own after twenty idle seconds. Under reduced
 * motion the pages still advance, but swap without animation.
 */
export function BoardWindow({
  rows,
  startRank = 4,
  totalCount,
}: {
  rows: BoardRow[];
  startRank?: number;
  totalCount: number;
}) {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [tick, setTick] = useState(ROTATE_SECONDS);
  const pausedUntil = useRef(0);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (dir: "next" | "prev", manual: boolean) => {
      setDirection(dir);
      setPage((p) => (dir === "next" ? (p + 1) % pages : (p - 1 + pages) % pages));
      setTick(ROTATE_SECONDS);
      if (manual) pausedUntil.current = Date.now() + RESUME_AFTER_MS;
    },
    [pages],
  );

  // One 1s heartbeat drives both the countdown and the auto-advance, and never
  // runs when the tab is hidden or there is only one page to show.
  useEffect(() => {
    if (pages <= 1) return;
    const timer = setInterval(() => {
      if (document.hidden || Date.now() < pausedUntil.current) return;
      setTick((t) => {
        if (t <= 1) {
          setDirection("next");
          setPage((p) => (p + 1) % pages);
          return ROTATE_SECONDS;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pages]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") { event.preventDefault(); go("next", true); }
    if (event.key === "ArrowLeft")  { event.preventDefault(); go("prev", true); }
  };

  const onTouchStart = (event: React.TouchEvent) => {
    touchX.current = event.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchX.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) > 44) go(delta < 0 ? "next" : "prev", true);
  };

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8">
        <div>
          <h2 className="eyebrow">The Board</h2>
          <p className="mt-1.5 font-display text-lg font-700 tracking-[-0.02em]">
            {totalCount > 0 ? "Three links hold the whole board." : "The board is open. Be first today."}
          </p>
        </div>
        <Link href="/add" className="btn !py-2.5">Get on the board</Link>
      </div>
    );
  }

  const first = page * PAGE_SIZE;
  const visible = rows.slice(first, first + PAGE_SIZE);
  const lastRank = startRank + Math.min(first + PAGE_SIZE, rows.length) - 1;

  return (
    <section
      aria-label="The Board"
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="flex h-full flex-col px-5 pt-3 pb-2.5 md:px-8"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-4">
          <h2 className="eyebrow">The Board</h2>
          <span className="tnum font-mono text-[0.6875rem] text-ink-faint" aria-live="off">
            {String(startRank + first).padStart(2, "0")}
            {"-"}
            {String(lastRank).padStart(2, "0")} / {totalCount}
          </span>
          {pages > 1 && (
            <span className="tnum hidden font-mono text-[0.6875rem] text-ink-faint sm:inline" aria-hidden="true">
              next in {String(tick).padStart(2, "0")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/board"
            className="eyebrow mr-1 underline underline-offset-4 transition-colors hover:text-ink"
          >
            Full board
          </Link>
          {pages > 1 && (
            <>
              <button
                type="button"
                onClick={() => go("prev", true)}
                aria-label="Previous board group"
                className="btn btn-ghost !min-h-[32px] !px-2.5 !py-1"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                onClick={() => go("next", true)}
                aria-label="Next board group"
                className="btn btn-ghost !min-h-[32px] !px-2.5 !py-1"
              >
                <span aria-hidden="true">›</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div
        key={page}
        className={`${direction === "next" ? "window-next" : "window-prev"} mt-2.5 grid flex-1 grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-2 xl:grid-cols-4`}
      >
        {visible.map((row, index) => {
          const rank = startRank + first + index;
          return (
            <article key={row.placement_id} className="flex min-w-0 items-center gap-3 bg-paper px-3.5 py-2.5">
              <span className="tnum font-mono text-sm text-ink-faint" aria-hidden="true">
                {String(rank).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/l/${row.slug}`} className="block min-w-0">
                  <span className="block truncate font-display text-[0.9375rem] leading-tight font-600 tracking-[-0.02em]">
                    <span className="sr-only">Rank {rank}: </span>
                    {row.display_name}
                  </span>
                  <span translate="no" className="block truncate font-mono text-[0.625rem] text-ink-faint">
                    {row.domain}
                  </span>
                </Link>
                <p className="tnum mt-0.5 truncate font-mono text-[0.6875rem]">
                  {formatCredit(row.score_cents_today)}
                  <span className="text-ink-faint"> / {formatCount(row.opens_today)} opens</span>
                </p>
              </div>
              <OpenButton
                placementId={row.placement_id}
                surface="board"
                label=""
                accessibleName={`Open ${row.display_name}`}
                className="btn btn-ghost shrink-0 !min-h-[32px] !px-2 !py-1"
              />
            </article>
          );
        })}
        {/* Ghost cells keep the grid rhythm when the last page is short. */}
        {visible.length < PAGE_SIZE &&
          Array.from({ length: PAGE_SIZE - visible.length }).map((_, i) => (
            <div key={`open-${i}`} className="hidden items-center bg-paper px-3.5 py-2.5 sm:flex">
              <Link href="/add" className="eyebrow transition-colors hover:text-ink">
                Open spot / add yours
              </Link>
            </div>
          ))}
      </div>
    </section>
  );
}
