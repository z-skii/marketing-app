import Link from "next/link";
import { OpenButton } from "./OpenButton";
import type { BoardRow } from "@/lib/data";
import { formatCredit, formatCount } from "@/lib/money";

/**
 * TOP 3 — the three highest active Board positions.
 *
 * Rank is expressed through composition, not a badge: number one takes a wide
 * feature with artwork and display-scale type, while two and three stack beside
 * it as compact units. The hierarchy reads before the numerals do.
 */
export function TopThree({ rows }: { rows: BoardRow[] }) {
  if (rows.length === 0) return null;
  const [first, ...rest] = rows;

  return (
    <section aria-labelledby="top3-heading" className="rule">
      <div className="shell py-10 md:py-14">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="top3-heading" className="eyebrow">Top 3</h2>
          <span className="eyebrow">Today</span>
        </div>

        <div className="mt-6 grid gap-px bg-rule md:mt-8 md:grid-cols-3">
          {/* Number one — double width, full composition. */}
          <article className="rise-in group relative bg-paper p-5 md:col-span-2 md:p-8">
            <div className="flex items-start gap-5 md:gap-8">
              <span
                className="tnum font-display text-5xl leading-none font-800 tracking-[-0.05em] text-signal md:text-7xl lg:text-8xl"
                aria-hidden="true"
              >
                1
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[0.6875rem] tracking-[0.1em] text-ink-faint uppercase">
                  {first.domain}
                </p>
                <h3 className="mt-2 font-display text-2xl leading-[0.95] font-800 tracking-[-0.04em] break-words sm:text-3xl md:text-4xl lg:text-5xl">
                  <span className="sr-only">Rank 1: </span>
                  {first.display_name}
                </h3>
                {first.short_description && (
                  <p className="mt-3 max-w-md text-sm leading-snug text-ink-soft md:text-base">
                    {first.short_description}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <OpenButton placementId={first.placement_id} className="btn !py-2.5" />
                  <span className="tnum font-mono text-sm font-600">
                    {formatCredit(first.score_cents_today)}{" "}
                    <span className="text-ink-faint">today</span>
                  </span>
                  <span className="tnum font-mono text-xs text-ink-faint">
                    {formatCount(first.total_opens)} opens
                  </span>
                </div>
              </div>

              {first.image_url && (
                <div className="hidden h-28 w-28 shrink-0 overflow-hidden border border-rule-strong lg:block xl:h-36 xl:w-36">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={first.image_url} alt="" width={144} height={144} className="h-full w-full object-cover" loading="lazy" />
                </div>
              )}
            </div>
          </article>

          {/* Two and three — clearly secondary, still premium. */}
          <div className="grid gap-px bg-rule md:col-span-1">
            {rest.map((row) => (
              <article key={row.placement_id} className="rise-in flex items-center gap-4 bg-paper p-5">
                <span
                  className="tnum font-display text-3xl leading-none font-700 tracking-[-0.05em] text-ink-faint md:text-4xl"
                  aria-hidden="true"
                >
                  {row.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-lg leading-tight font-700 tracking-[-0.03em]">
                    <span className="sr-only">Rank {row.rank}: </span>
                    {row.display_name}
                  </h3>
                  <p className="mt-0.5 truncate font-mono text-[0.6875rem] text-ink-faint">{row.domain}</p>
                  <p className="tnum mt-2 font-mono text-xs">
                    {formatCredit(row.score_cents_today)}{" "}
                    <span className="text-ink-faint">today · {formatCount(row.total_opens)} opens</span>
                  </p>
                </div>
                <OpenButton
                  placementId={row.placement_id}
                  label=""
                  accessibleName={`Open ${row.display_name}`}
                  className="btn btn-ghost shrink-0 !px-3 !py-2"
                />
              </article>
            ))}
          </div>
        </div>

        <p className="sr-only">
          <Link href="/board">See the full board</Link>
        </p>
      </div>
    </section>
  );
}
