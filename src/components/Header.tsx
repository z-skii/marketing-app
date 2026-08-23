import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { RoundCountdown } from "./RoundCountdown";
import { signOut } from "@/app/sign-in/actions";
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
            <AccountMenu user={user} />
          ) : (
            <Link href="/sign-in" className="eyebrow hover:text-ink px-2 py-2 transition-colors">
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

/**
 * The signed-in account control: the visitor's member number opens a small
 * menu with their pages and a working sign-out. Plain HTML `details`, so it
 * needs no client JavaScript; sign-out is a server action that clears the
 * session cookie and returns to the public site.
 */
function AccountMenu({ user }: { user: CurrentUser }) {
  const memberTag = `#${String(user.memberNo).padStart(4, "0")}`;
  return (
    <details className="relative">
      <summary
        className="eyebrow hover:text-ink flex cursor-pointer list-none items-center gap-1 px-2 py-2 transition-colors [&::-webkit-details-marker]:hidden"
        aria-label={`Account ${memberTag}`}
      >
        <span className="tnum !tracking-normal">{memberTag}</span>
        <span aria-hidden="true" className="text-[0.5625rem]">▾</span>
      </summary>
      <div className="absolute right-0 top-full z-40 mt-1 w-44 border border-ink bg-paper py-1">
        <Link
          href="/dashboard"
          className="block px-3.5 py-2.5 font-mono text-[0.6875rem] font-500 tracking-[0.14em] uppercase transition-colors hover:bg-surface"
        >
          Your links
        </Link>
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="block px-3.5 py-2.5 font-mono text-[0.6875rem] font-500 tracking-[0.14em] uppercase transition-colors hover:bg-surface"
          >
            Admin
          </Link>
        )}
        <form action={signOut} className="border-t border-rule">
          <button
            type="submit"
            className="block w-full px-3.5 py-2.5 text-left font-mono text-[0.6875rem] font-500 tracking-[0.14em] uppercase text-signal transition-colors hover:bg-surface"
          >
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
