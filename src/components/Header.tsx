import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { RoundCountdown } from "./RoundCountdown";
import { LiveNowIcon, ResetIcon, VisitorsIcon } from "./icons";
import { formatCount } from "@/lib/money";
import type { CurrentUser } from "@/lib/auth";

export type HeaderStats = {
  /** People who have ever visited the platform. Not opens. */
  visitors: number;
  /** Visitors active within the last five minutes. */
  liveNow: number;
  roundEndsAt: string | null;
};

/**
 * One compact strip on the classic board surfaces: brand, real audience
 * numbers, the round reset clock — and for signed-in people just two ways
 * home: the App button and their profile. There is no second account menu;
 * every setting lives in the app's Profile screen.
 */
export function Header({ user, stats }: { user: CurrentUser | null; stats?: HeaderStats }) {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/92 backdrop-blur-md">
      <div
        className={`flex h-12 items-center justify-between gap-3 md:h-14 ${
          stats ? "w-full px-4 md:px-8" : "shell"
        }`}
      >
        <div className="flex min-w-0 items-baseline gap-3 md:gap-5">
          <Link
            href="/"
            className="font-display text-base font-800 tracking-[-0.04em] uppercase md:text-lg xl:text-xl"
          >
            {SITE_NAME}
          </Link>
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="live-dot" aria-hidden="true" />
            <span className="eyebrow !text-signal">Live</span>
          </span>

          {stats && (
            <dl className="flex min-w-0 items-center gap-3 md:gap-5" aria-label="Platform activity">
              <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                <dt className="text-ink-faint">
                  <VisitorsIcon />
                  <span className="sr-only">Visitors</span>
                </dt>
                <dd className="tnum font-mono text-xs font-600">{formatCount(stats.visitors)}</dd>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-signal">
                <dt>
                  <LiveNowIcon />
                  <span className="sr-only">On now</span>
                </dt>
                <dd className="tnum font-mono text-xs font-600">{formatCount(stats.liveNow)}</dd>
              </div>
              {stats.roundEndsAt && (
                <div className="hidden items-center gap-1.5 whitespace-nowrap md:flex">
                  <dt className="text-ink-faint">
                    <ResetIcon />
                    <span className="sr-only">Board resets in</span>
                  </dt>
                  <dd><RoundCountdown endsAt={stats.roundEndsAt} /></dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <nav className="flex items-center gap-1 md:gap-2" aria-label="Main">
          <Link href="/rules" className="eyebrow hover:text-ink hidden px-2 py-2 transition-colors sm:block">
            Rules
          </Link>
          {user ? (
            <>
              <Link
                href="/home"
                className="btn btn-signal !min-h-[38px] !px-3 !py-1.5 text-[0.6875rem]"
              >
                App
              </Link>
              <Link
                href="/me"
                className="eyebrow hover:text-ink max-w-[9rem] truncate px-2 py-2 !normal-case !tracking-normal transition-colors"
                aria-label={`Profile ${user.username}`}
              >
                {user.username}
              </Link>
            </>
          ) : (
            <Link href="/sign-in" className="eyebrow hover:text-ink px-2 py-2 whitespace-nowrap transition-colors">
              Sign In
            </Link>
          )}
          <Link href="/add" className="btn ml-1 !min-h-[38px] !px-3 !py-1.5 text-[0.6875rem] md:!px-4">
            <span aria-hidden="true">+</span>
            <span className="hidden sm:inline">Add Your Link</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
