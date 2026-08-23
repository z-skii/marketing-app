import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { RoundCountdown } from "./RoundCountdown";
import { formatCount } from "@/lib/money";
import type { CurrentUser } from "@/lib/auth";

export type HeaderStats = {
  liveLinks: number;
  opensToday: number;
  roundEndsAt: string | null;
};

/**
 * On the live screen the header doubles as the status row: link count, opens
 * today, and the round reset all read at a glance, so the page needs no hero.
 * Subpages pass no stats and get the plain compact header.
 */
export function Header({ user, stats }: { user: CurrentUser | null; stats?: HeaderStats }) {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/92 backdrop-blur-md">
      <div
        className={`flex h-12 items-center justify-between gap-3 md:h-14 ${
          stats ? "w-full px-5 md:px-8" : "shell"
        }`}
      >
        <div className="flex min-w-0 items-baseline gap-3 md:gap-5">
          <Link
            href="/"
            className="font-display text-[1.0625rem] font-800 tracking-[-0.04em] uppercase md:text-lg"
          >
            {SITE_NAME}
          </Link>
          <span className="flex items-center gap-1.5">
            <span className="live-dot" aria-hidden="true" />
            <span className="eyebrow !text-signal">Live</span>
          </span>

          {stats && (
            <dl className="hidden items-baseline gap-5 md:flex" aria-label="Live status">
              <div className="flex items-baseline gap-1.5">
                <dd className="tnum font-mono text-xs font-600">{formatCount(stats.liveLinks)}</dd>
                <dt className="eyebrow">Links</dt>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dd className="tnum font-mono text-xs font-600">{formatCount(stats.opensToday)}</dd>
                <dt className="eyebrow">Opens</dt>
              </div>
              {stats.roundEndsAt && (
                <div className="hidden items-baseline gap-1.5 lg:flex">
                  <dt className="eyebrow">Reset</dt>
                  <dd><RoundCountdown endsAt={stats.roundEndsAt} /></dd>
                </div>
              )}
            </dl>
          )}
        </div>

        <nav className="flex items-center gap-1 md:gap-2" aria-label="Main">
          <Link href="/board" className="eyebrow hover:text-ink px-2 py-2 transition-colors">
            Board
          </Link>
          <Link href="/earn" className="eyebrow hover:text-ink px-2 py-2 transition-colors">
            Earn
          </Link>
          <Link href="/rules" className="eyebrow hover:text-ink hidden px-2 py-2 transition-colors md:block">
            Rules
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="eyebrow !text-signal hover:!text-ink px-2 py-2 transition-colors">
              Admin
            </Link>
          )}
          {user ? (
            <Link href="/dashboard" className="eyebrow hover:text-ink hidden px-2 py-2 transition-colors sm:block">
              Yours
            </Link>
          ) : (
            <Link href="/sign-in" className="eyebrow hover:text-ink hidden px-2 py-2 transition-colors sm:block">
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
