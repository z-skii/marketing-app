import Link from "next/link";
import { SpotRefresh } from "../SpotRefresh";
import { OpenButton } from "../OpenButton";
import type { SpotRow } from "@/lib/data";
import { formatCount } from "@/lib/money";
import { DetailsIcon, OpensIcon } from "@/components/icons";

/**
 * THE SPOT on the live screen: one link owns the largest panel for sixty
 * seconds. Each change of hands re-keys the takeover wrapper, so the incoming
 * link wipes in like a broadcast handover. When nothing is on air, the next
 * scheduled link plays as "up next"; when nothing is queued at all, the empty
 * panel sells the minute itself.
 */
export function SpotPanel({ current, next }: { current: SpotRow | null; next: SpotRow | null }) {
  const spot = current ?? next;
  const upcoming = !current && !!next;

  if (!spot) return <SpotOpen />;

  return (
    <div className="flex h-full min-h-0 flex-col px-4 py-3 md:px-8 md:py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 eyebrow">
          {upcoming ? (
            <span>The Spot / Up next</span>
          ) : (
            <>
              <span className="live-dot" aria-hidden="true" />
              <span className="!text-signal">The Spot</span>
            </>
          )}
        </h2>
      </div>
      {/* No clock on the landing page, but the handover still runs on time. */}
      <SpotRefresh endsAt={upcoming ? spot.starts_at : spot.ends_at} />

      <div
        key={spot.schedule_id}
        className={`takeover mt-3 grid min-h-0 flex-1 gap-5 md:mt-5 md:grid-cols-12 md:gap-8 ${
          upcoming ? "opacity-80" : ""
        }`}
      >
        {/* Phones: the photo banners across the top with the panel's spare
            height, whole and uncropped, and everything else sits organized
            under it. Desktop keeps the split columns. */}
        <div className="flex h-full min-h-0 flex-col justify-center md:order-2 md:col-span-7 xl:col-span-6">
          {spot.image_url && (
            <div className="flex min-h-24 w-full flex-1 items-center justify-center pb-2 short:min-h-12 short:pb-1 md:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/art/${spot.link_id}?v=2`}
                alt=""
                className="max-h-full max-w-full border border-ink"
                loading="eager"
              />
            </div>
          )}
          <div className="min-w-0 md:flex-none">
          <div className="min-w-0">
            <p translate="no" className="font-mono text-[0.6875rem] tracking-[0.1em] text-ink-faint uppercase md:text-xs">
              {spot.domain}
            </p>
            <h3 className="mt-1 font-display text-xl leading-[0.9] font-800 tracking-[-0.045em] break-words md:mt-2 md:text-[clamp(2rem,3.2vw+2.8vh,6.5rem)]">
              {spot.display_name}
            </h3>
          </div>
          {spot.short_description && (
            <p className="mt-2 hidden max-w-xl font-display text-sm leading-snug text-ink-soft sm:line-clamp-2 short:sm:hidden md:mt-3 md:text-[clamp(1.0625rem,0.8vw+0.8vh,1.625rem)]">
              {spot.short_description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-2 md:mt-5 md:gap-x-5">
            <OpenButton
              placementId={spot.placement_id}
              slug={spot.slug}
              surface="spot"
              className={`btn !min-h-[30px] !px-3.5 !py-1 md:!min-h-[40px] md:!px-6 md:!py-3 xl:!min-h-[48px] xl:!px-8 ${upcoming ? "" : "btn-signal"}`}
            />
            <span className="tnum inline-flex items-center gap-1 font-mono text-xs text-ink-faint" title="Opens">
              <OpensIcon />
              <span className="sr-only">Opens </span>
              {formatCount(spot.total_opens)}
            </span>
            <Link
              href={`/l/${spot.slug}`}
              aria-label="Details"
              title="Details"
              className="text-ink-faint transition-colors hover:text-ink"
            >
              <DetailsIcon />
            </Link>
          </div>
          </div>
        </div>

        <div className="hidden min-h-0 md:order-1 md:col-span-5 md:block xl:col-span-6">
          {spot.image_url ? (
            <div className="flex h-full max-h-full w-full items-center justify-center">
              {/* The border belongs to the photo, whatever its shape. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/art/${spot.link_id}?v=2`}
                alt=""
                className="max-h-full max-w-full border border-ink bg-paper-deep"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          ) : (
            <div className="relative h-full max-h-full w-full overflow-hidden border border-ink bg-paper-deep">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-[clamp(3rem,7vw,6rem)] font-800 text-rule-strong">
                  {spot.display_name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {upcoming ? (
        <p className="mt-2.5 hidden border-t border-rule pt-2.5 font-display text-sm text-ink-soft md:mt-4 md:block md:pt-3">
          The Spot is open this minute.{" "}
          <Link href="/add" className="text-signal underline underline-offset-4">
            Take it
          </Link>
        </p>
      ) : (
        next &&
        next.schedule_id !== spot.schedule_id && (
          <p className="mt-1.5 flex items-baseline gap-2 border-t border-rule pt-1.5 short:hidden md:mt-4 md:flex md:pt-3">
            <span className="eyebrow">Up next</span>
            <span translate="no" className="font-mono text-xs text-ink-soft">{next.domain}</span>
          </p>
        )
      )}
    </div>
  );
}

/** Nothing on air and nothing queued: the most valuable minute is for sale. */
function SpotOpen() {
  return (
    <div className="flex h-full flex-col justify-center px-5 py-6 md:px-8">
      <h2 className="eyebrow">The Spot</h2>
      <p className="mt-3 max-w-2xl font-display text-[clamp(2rem,4.5vw,4rem)] leading-[0.92] font-800 tracking-[-0.04em]">
        The Spot is open.
      </p>
      <p className="mt-3 max-w-md text-ink-soft">
        One link at a time, sixty seconds each. Own the next minute.
      </p>
      <div>
        <Link href="/add" className="btn btn-signal mt-6 !px-6 !py-3">
          Take The Spot
        </Link>
      </div>
    </div>
  );
}
