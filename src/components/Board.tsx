import Link from "next/link";
import { OpenButton } from "./OpenButton";
import type { BoardRow } from "@/lib/data";
import { formatCredit, formatCount } from "@/lib/money";

/**
 * THE BOARD — the live ranked list beneath Top 3.
 *
 * Genuinely tabular data, so it is a real table: dense hairline rows, tabular
 * numerals, and one action per row. Movement against the previous round is
 * shown as a small delta rather than a coloured badge.
 */
export function Board({
  rows,
  startRank = 4,
  heading = "The Board",
  showViewAll = false,
}: {
  rows: BoardRow[];
  startRank?: number;
  heading?: string;
  showViewAll?: boolean;
}) {
  // "New" only means something once a previous round exists to be new against.
  const hasHistory = rows.some((row) => row.previous_rank != null);

  if (rows.length === 0) {
    return (
      <section aria-labelledby="board-heading" className="rule">
        <div className="shell py-14">
          <h2 id="board-heading" className="eyebrow">{heading}</h2>
          <p className="mt-4 font-display text-xl text-ink-soft">
            The board is open. Nothing is on it yet.
          </p>
          <Link href="/add" className="btn mt-6">Add your link</Link>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="board-heading" className="rule">
      <div className="shell py-10 md:py-14">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="board-heading" className="eyebrow">{heading}</h2>
          {showViewAll && (
            <Link href="/board" className="eyebrow underline underline-offset-4 transition-colors hover:text-ink">
              See all
            </Link>
          )}
        </div>

        <table className="mt-5 w-full table-fixed border-collapse text-left md:mt-7">
          <colgroup>
            <col className="w-11 md:w-16" />
            <col className="w-6" />
            <col />
            <col className="w-[26%] md:w-[16%]" />
            <col className="hidden sm:table-column sm:w-[18%] md:w-[13%]" />
            <col className="w-11 md:w-20" />
          </colgroup>
          <caption className="sr-only">
            Live ranked links, ordered by credit added to the board today.
          </caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Movement</th>
              <th scope="col">Link</th>
              <th scope="col">Credit today</th>
              <th scope="col">Opens</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const rank = startRank + index;
              const movement = movementOf(rank, row.previous_rank);
              return (
                <tr
                  key={row.link_id}
                  className="group border-t border-rule transition-colors [content-visibility:auto] [contain-intrinsic-size:auto_56px] hover:bg-surface"
                >
                  <td className="py-3.5 pr-2 align-middle md:py-4">
                    <span className="tnum font-mono text-sm text-ink-faint md:text-base">
                      {String(rank).padStart(2, "0")}
                    </span>
                  </td>

                  <td className="pr-1 align-middle">
                    <MovementMark movement={movement} showNew={hasHistory} />
                  </td>

                  <td className="min-w-0 py-3.5 pr-3 align-middle md:py-4">
                    <Link
                      href={`/l/${row.slug}`}
                      className="flex min-w-0 flex-col md:flex-row md:items-baseline md:gap-3"
                    >
                      <span className="truncate font-display text-[0.95rem] font-600 tracking-[-0.02em] md:text-lg">
                        {row.display_name}
                      </span>
                      <span className="truncate font-mono text-[0.6875rem] text-ink-faint md:text-xs">
                        {row.domain}
                      </span>
                    </Link>
                  </td>

                  <td className="py-3.5 pr-3 text-right align-middle md:py-4">
                    <span className="tnum font-mono text-sm font-600 whitespace-nowrap md:text-base">
                      {formatCredit(row.score_cents_today)}
                    </span>
                    <span className="eyebrow ml-1 hidden md:inline">today</span>
                  </td>

                  <td className="hidden py-4 pr-3 text-right align-middle sm:table-cell">
                    <span className="tnum font-mono text-xs whitespace-nowrap text-ink-faint">
                      {formatCount(row.total_opens)}
                      <span className="hidden md:inline"> opens</span>
                    </span>
                  </td>

                  <td className="py-3.5 text-right align-middle md:py-4">
                    <OpenButton
                      placementId={row.placement_id}
                      slug={row.slug}
                      label=""
                      accessibleName={`Open ${row.display_name}`}
                      className="btn btn-ghost !min-h-[36px] !px-2.5 !py-1.5 md:!px-3"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type Movement = { kind: "up" | "down" | "new" | "flat"; delta: number };

function movementOf(rank: number, previous: number | null): Movement {
  if (previous == null) return { kind: "new", delta: 0 };
  if (previous === rank) return { kind: "flat", delta: 0 };
  return previous > rank
    ? { kind: "up", delta: previous - rank }
    : { kind: "down", delta: rank - previous };
}

function MovementMark({ movement, showNew }: { movement: Movement; showNew: boolean }) {
  if (movement.kind === "flat") {
    return (
      <span className="block text-center font-mono text-[0.625rem] text-rule-strong" aria-hidden="true">
        ·
      </span>
    );
  }
  if (movement.kind === "new") {
    if (!showNew) {
      return (
        <span className="block text-center font-mono text-[0.625rem] text-rule-strong" aria-hidden="true">
          ·
        </span>
      );
    }
    return (
      <span className="block text-center font-mono text-[0.5625rem] tracking-tight text-signal">
        <span className="sr-only">New entry</span>
        <span aria-hidden="true">NEW</span>
      </span>
    );
  }
  const up = movement.kind === "up";
  return (
    <span className={`block text-center font-mono text-[0.625rem] ${up ? "text-rise" : "text-ink-faint"}`}>
      <span className="sr-only">{up ? `Up ${movement.delta}` : `Down ${movement.delta}`}</span>
      <span aria-hidden="true">{up ? "▲" : "▼"}</span>
    </span>
  );
}
