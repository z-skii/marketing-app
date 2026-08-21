import Link from "next/link";
import { RoundCountdown } from "./RoundCountdown";
import { formatCount } from "@/lib/money";

/**
 * Deliberately short. The homepage is the product — the board below explains
 * itself faster than any paragraph could.
 */
export function Hero({
  liveLinks,
  opensToday,
  roundEndsAt,
}: {
  liveLinks: number;
  opensToday: number;
  roundEndsAt: string | null;
}) {
  return (
    <section className="shell pt-8 pb-7 md:pt-12 md:pb-9">
      <h1 className="max-w-[15ch] font-display text-[2.375rem] leading-[0.9] font-800 tracking-[-0.045em] sm:text-5xl md:max-w-[20ch] md:text-6xl lg:text-[4.25rem] xl:text-[5rem]">
        What&rsquo;s getting clicked right now?
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 md:mt-8">
        <Link href="/add" className="btn btn-signal !px-6 !py-3.5">
          <span aria-hidden="true">+</span> Add Your Link
        </Link>

        <dl className="flex flex-wrap items-center gap-x-7 gap-y-2">
          <div className="flex items-baseline gap-2">
            <dt className="eyebrow">Live</dt>
            <dd className="tnum font-mono text-sm font-600">{formatCount(liveLinks)}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="eyebrow">Opens today</dt>
            <dd className="tnum font-mono text-sm font-600">{formatCount(opensToday)}</dd>
          </div>
          {roundEndsAt && (
            <div className="flex items-baseline gap-2">
              <dt className="eyebrow">Resets in</dt>
              <dd><RoundCountdown endsAt={roundEndsAt} /></dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
