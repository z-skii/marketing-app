"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { OpenButton } from "../OpenButton";
import type { BoardRow } from "@/lib/data";
import { formatCredit, formatCount } from "@/lib/money";

const ROTATE_SECONDS = 10;
const RESUME_AFTER_MS = 20_000;

/**
 * THE BOARD as a rotating window. Ranks four and up cycle through the screen
 * in rank order, so a link at #38 still takes its turn on the main stage.
 * Rotation only changes which segment is visible, never the order.
 *
 * Advances every ten seconds. Any manual act (arrows, keys, swipe) pauses the
 * rotation, which resumes on its own after twenty idle seconds. Under reduced
 * motion the pages still advance, but swap without animation. `pageSize` and
 * `compact` let the phone composition run a smaller window than desktop.
 */
export function BoardWindow({
  rows,
  startRank = 4,
  totalCount,
  pageSize = 8,
  compact = false,
  className = "",
}: {
  rows: BoardRow[];
  startRank?: number;
  totalCount: number;
  pageSize?: number;
  compact?: boolean;
  className?: string;
}) {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
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

  const pad = compact ? "px-4" : "px-4 md:px-8";
  const cellPad = compact ? "px-3 py-1.5 short:py-1" : "px-3.5 py-2.5";

  if (rows.length === 0) {
    return (
      <div className={`${pad} flex flex-col py-3 ${className}`}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="eyebrow">The Board</h2>
          <span className="tnum font-mono text-[0.6875rem] text-ink-faint">
            {totalCount > 0 ? "Top 3 holds the whole board" : "100 positions open"}
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Link
              key={i}
              href="/add"
              className={`group flex items-center justify-between gap-2 bg-paper ${cellPad} transition-colors hover:bg-surface`}
            >
              <span className="tnum font-mono text-sm text-rule-strong">
                {String(startRank + i).padStart(2, "0")}
              </span>
              <span className="eyebrow transition-colors group-hover:text-signal">Open</span>
            </Link>
          ))}
        </div>
        <p className="mt-2 font-display text-sm text-ink-soft">
          The board ranks links by credit added today.{" "}
          <Link href="/add" className="text-signal underline underline-offset-4">
            Be first today
          </Link>
        </p>
      </div>
    );
  }

  const first = page * pageSize;
  const visible = rows.slice(first, first + pageSize);
  const lastRank = startRank + Math.min(first + pageSize, rows.length) - 1;

  return (
    <section
      aria-label="The Board"
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={`${pad} flex h-full flex-col pt-2.5 pb-2 short:pt-1.5 short:pb-1.5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3 md:gap-4">
          <h2 className="eyebrow">The Board</h2>
          <span className="tnum font-mono text-[0.6875rem] text-ink-faint" aria-live="off">
            {String(startRank + first).padStart(2, "0")}
            {"-"}
            {String(lastRank).padStart(2, "0")} / {totalCount}
          </span>
          {pages > 1 && !compact && (
            <span className="tnum hidden font-mono text-[0.6875rem] text-ink-faint sm:inline" aria-hidden="true">
              next in {String(tick).padStart(2, "0")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
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
                className="btn btn-ghost !min-h-[30px] !px-2.5 !py-0.5"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <button
                type="button"
                onClick={() => go("next", true)}
                aria-label="Next board group"
                className="btn btn-ghost !min-h-[30px] !px-2.5 !py-0.5"
              >
                <span aria-hidden="true">›</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div
        key={page}
        className={`${direction === "next" ? "window-next" : "window-prev"} mt-2 grid flex-1 gap-px border border-rule bg-rule ${
          compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        }`}
      >
        {visible.map((row, index) => {
          const rank = startRank + first + index;
          return (
            <article key={row.placement_id} className={`flex min-w-0 items-center gap-3 bg-paper ${cellPad}`}>
              <span className="tnum font-mono text-sm text-ink-faint" aria-hidden="true">
                {String(rank).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/l/${row.slug}`} className={`min-w-0 ${compact ? "flex items-baseline gap-2" : "block"}`}>
                  <span className="block truncate font-display text-[0.9375rem] leading-tight font-600 tracking-[-0.02em]">
                    <span className="sr-only">Rank {rank}: </span>
                    {row.display_name}
                  </span>
                  <span translate="no" className="block truncate font-mono text-[0.625rem] text-ink-faint">
                    {row.domain}
                  </span>
                </Link>
                {!compact && (
                  <p className="tnum mt-0.5 truncate font-mono text-[0.6875rem]">
                    {formatCredit(row.score_cents_today)}
                    <span className="text-ink-faint"> / {formatCount(row.opens_today)} opens</span>
                  </p>
                )}
              </div>
              {compact && (
                <span className="tnum shrink-0 font-mono text-[0.6875rem]">
                  {formatCredit(row.score_cents_today)}
                </span>
              )}
              <OpenButton
                placementId={row.placement_id}
                surface="board"
                label=""
                accessibleName={`Open ${row.display_name}`}
                className="btn btn-ghost shrink-0 !min-h-[30px] !px-2 !py-0.5"
              />
            </article>
          );
        })}
        {/* Ghost cells keep the grid rhythm when the last page is short. */}
        {visible.length < pageSize &&
          Array.from({ length: pageSize - visible.length }).map((_, i) => (
            <div key={`open-${i}`} className={`hidden items-center bg-paper sm:flex ${cellPad}`}>
              <Link href="/add" className="eyebrow transition-colors hover:text-ink">
                Open spot / add yours
              </Link>
            </div>
          ))}
      </div>
    </section>
  );
}
