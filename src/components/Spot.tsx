import Link from "next/link";
import { SpotCountdown } from "./SpotCountdown";
import { StartsIn } from "./StartsIn";
import { OpenButton } from "./OpenButton";
import type { SpotRow } from "@/lib/data";
import { formatCount } from "@/lib/money";

/**
 * THE SPOT — one link owns the largest surface on the site for sixty seconds.
 *
 * Composed as a takeover rather than a banner: the name runs at display scale,
 * the artwork sits in an offset panel, and the countdown reads as broadcast
 * timing. Each entry gets ten appearances a day, so quiet minutes are normal —
 * those become scheduled programming ("up next") or an open invitation, never a
 * blank hole in the page.
 */
export function Spot({ spot, upcoming }: { spot: SpotRow | null; upcoming: boolean }) {
  if (!spot) return <SpotOpen />;

  return (
    <section aria-labelledby="spot-heading" className="rule-heavy overflow-hidden">
      <div className="shell py-8 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="spot-heading" className="flex items-center gap-2 eyebrow">
            {upcoming ? (
              <span>The Spot · Up next</span>
            ) : (
              <>
                <span className="live-dot" aria-hidden="true" />
                <span className="!text-signal">The Spot</span>
              </>
            )}
          </h2>
          {upcoming ? <StartsIn startsAt={spot.starts_at} /> : <SpotCountdown endsAt={spot.ends_at} />}
        </div>

        <div
          key={spot.schedule_id}
          className={`spot-in mt-5 grid gap-7 md:mt-8 md:grid-cols-12 md:gap-10 ${
            upcoming ? "opacity-90" : ""
          }`}
        >
          <div className="order-2 md:order-1 md:col-span-5 lg:col-span-4">
            <div className="relative aspect-[5/4] max-h-[38vh] w-full overflow-hidden border border-ink bg-paper-deep sm:aspect-[16/10] md:aspect-[5/4] md:max-h-[300px] lg:max-h-[340px]">
              {spot.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={spot.image_url}
                  alt=""
                  width={600}
                  height={480}
                  className="h-full w-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-display text-6xl font-800 text-rule-strong">
                    {spot.display_name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="order-1 flex flex-col md:order-2 md:col-span-7 lg:col-span-8">
            <div>
              <p className="font-mono text-xs tracking-[0.1em] text-ink-faint uppercase">
                {spot.domain}
              </p>
              <h3 className="mt-3 font-display text-[2.5rem] leading-[0.9] font-800 tracking-[-0.045em] break-words sm:text-5xl lg:text-6xl xl:text-7xl">
                {spot.display_name}
              </h3>
              {spot.short_description && (
                <p className="mt-4 max-w-xl font-display text-lg leading-snug text-ink-soft md:text-xl">
                  {spot.short_description}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 md:mt-8">
              <OpenButton
                placementId={spot.placement_id}
                className={`btn !px-7 !py-4 !text-sm ${upcoming ? "" : "btn-signal"}`}
              />
              <span className="tnum font-mono text-xs text-ink-faint">
                {formatCount(spot.total_opens)} opens
              </span>
              <Link
                href={`/l/${spot.slug}`}
                className="eyebrow underline underline-offset-4 transition-colors hover:text-ink"
              >
                Details
              </Link>
            </div>
          </div>
        </div>

        {upcoming && (
          <p className="rule mt-8 pt-5 font-display text-sm text-ink-soft">
            The Spot is open this minute.{" "}
            <Link href="/add" className="text-signal underline underline-offset-4">
              Take it
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}

/** Nothing scheduled and nothing queued — the most valuable surface is free. */
function SpotOpen() {
  return (
    <section aria-labelledby="spot-heading" className="rule-heavy">
      <div className="shell py-14 md:py-20">
        <h2 id="spot-heading" className="eyebrow">The Spot</h2>
        <p className="mt-4 max-w-2xl font-display text-3xl leading-[0.95] font-800 tracking-[-0.04em] md:text-5xl">
          Nobody owns The Spot right now.
        </p>
        <p className="mt-4 max-w-md text-ink-soft">
          One link at a time, sixty seconds each. It could be yours in about a minute.
        </p>
        <Link href="/add" className="btn btn-signal mt-7 !px-6 !py-3.5">
          Take The Spot
        </Link>
      </div>
    </section>
  );
}
