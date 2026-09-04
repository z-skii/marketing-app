import Link from "next/link";
import { OpenButton } from "../OpenButton";
import type { BoardRow } from "@/lib/data";
import { formatCount } from "@/lib/money";
import { OpensIcon } from "@/components/icons";

/**
 * TOP 3 as a permanent rail beside The Spot. Number one owns most of the
 * column with display-scale type; two and three read as compact rows below.
 * Rank is expressed by composition first, numerals second.
 */
export function TopRail({ rows }: { rows: BoardRow[] }) {
  if (rows.length === 0) return <TopOpen />;
  const [first, ...rest] = rows;

  return (
    // h-full only where the column has a real height to fill (the desktop
    // grid). In the stacked layout the row is content-sized, and a percentage
    // height there compresses the #1 block into the rows below it.
    <div className="flex min-h-0 flex-col md:h-full">
      <div className="relative z-10 flex items-baseline justify-between gap-3 bg-paper px-4 pt-2.5 pb-1 short:pt-1.5 short:pb-0.5 md:px-6 md:pt-4">
        <h2 className="eyebrow">Top 3</h2>
        <span className="eyebrow">Today</span>
      </div>

      <article className="group flex min-h-0 flex-1 flex-col px-4 pt-2 pb-2.5 short:pt-0.5 short:pb-1 md:justify-center md:px-6 md:py-4">
        <div className="flex items-start gap-4">
          <span
            className="tnum font-display text-2xl leading-none font-800 tracking-[-0.05em] text-signal md:text-[clamp(2.25rem,5vw,4.5rem)]"
            aria-hidden="true"
          >
            1
          </span>
          <div className="min-w-0 flex-1">
            <p translate="no" className="truncate font-mono text-[0.6875rem] tracking-[0.1em] text-ink-faint uppercase">
              {first.domain}
            </p>
            <h3 className="mt-1 font-display text-lg leading-[0.95] font-800 tracking-[-0.04em] break-words short:mt-0.5 md:mt-1.5 md:text-[clamp(1.25rem,2.6vw,2.75rem)]">
              <span className="sr-only">Rank 1: </span>
              {first.display_name}
            </h3>
            {first.short_description && (
              <p className="mt-1.5 hidden line-clamp-2 text-sm leading-snug text-ink-soft not-short:sm:block md:mt-2">
                {first.short_description}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 short:mt-1 md:mt-4">
          <OpenButton placementId={first.placement_id} slug={first.slug} surface="top3" className="btn !min-h-[32px] !py-1.5 short:!min-h-[30px] short:!py-1 md:!min-h-[40px] md:!py-2" />
          <span className="tnum inline-flex items-center gap-1 font-mono text-xs text-ink-faint" title="Opens">
            <OpensIcon />
            <span className="sr-only">Opens </span>
            {formatCount(first.total_opens)}
          </span>
        </div>
      </article>

      <div className="relative z-10 border-t border-rule bg-paper">
        {rest.map((row) => (
          <article
            key={row.link_id}
            className="flex items-center gap-3 border-b border-rule px-4 py-1.5 last:border-b-0 short:py-1 md:px-6 md:py-3"
          >
            <span
              className="tnum w-7 font-display text-xl leading-none font-700 tracking-[-0.05em] text-ink-faint md:text-2xl"
              aria-hidden="true"
            >
              {row.rank}
            </span>
            <Movement rank={row.rank} previous={row.previous_rank} />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-sm leading-tight font-700 tracking-[-0.03em] md:text-base">
                <span className="sr-only">Rank {row.rank}: </span>
                {row.display_name}
              </h3>
              <p className="tnum mt-0.5 hidden truncate font-mono text-[0.6875rem] text-ink-faint sm:block short:hidden md:short:block">
                <span translate="no">{row.domain}</span>
              </p>
            </div>
            <OpenButton
              placementId={row.placement_id}
              slug={row.slug}
              surface="top3"
              label=""
              accessibleName={`Open ${row.display_name}`}
              className="btn btn-ghost shrink-0 !min-h-[36px] !px-2.5 !py-1.5"
            />
          </article>
        ))}
      </div>
    </div>
  );
}

function Movement({ rank, previous }: { rank: number; previous: number | null }) {
  if (previous == null || previous === rank) return null;
  const up = previous > rank;
  const delta = Math.abs(previous - rank);
  return (
    <span className={`font-mono text-[0.625rem] ${up ? "text-rise" : "text-ink-faint"}`}>
      <span className="sr-only">{up ? `Up ${delta}` : `Down ${delta}`}</span>
      <span aria-hidden="true">{up ? `▲${delta}` : `▼${delta}`}</span>
    </span>
  );
}

/** Empty board: the first position is an invitation, not a blank. */
function TopOpen() {
  return (
    <div className="flex h-full flex-col justify-center px-5 py-6 md:px-6">
      <h2 className="eyebrow">Top 3</h2>
      <p className="mt-3 font-display text-[clamp(1.75rem,2.6vw,2.5rem)] leading-[0.92] font-800 tracking-[-0.04em]">
        Nobody owns #1 yet.
      </p>
      <p className="mt-2 max-w-xs text-sm text-ink-soft">
        The board ranks links by credit added today. First one on it is #1.
      </p>
      <div>
        <Link href="/add" className="btn mt-5 !py-2.5">Take it</Link>
      </div>
    </div>
  );
}
