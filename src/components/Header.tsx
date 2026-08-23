import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import { RoundCountdown } from "./RoundCountdown";
import { signOut } from "@/app/sign-in/actions";
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
 * One compact strip: brand, real audience numbers, the round reset clock, and
 * the account. The board and creator areas are not separate destinations in
 * the navigation; the homepage IS the board, and Earn lives in the account
 * menu.
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
            className="font-display text-[1.0625rem] font-800 tracking-[-0.04em] uppercase md:text-lg"
          >
            {SITE_NAME}
          </Link>
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="live-dot" aria-hidden="true" />
            <span className="eyebrow !text-signal">Live</span>
          </span>

          {stats && (
            <dl className="flex min-w-0 items-baseline gap-3 md:gap-5" aria-label="Platform activity">
              <div className="hidden items-baseline gap-1.5 sm:flex">
                <dd className="tnum font-mono text-xs font-600">{formatCount(stats.visitors)}</dd>
                <dt className="eyebrow">Visitors</dt>
              </div>
              <div className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
                <dd className="tnum font-mono text-xs font-600 text-signal">
                  {formatCount(stats.liveNow)}
                </dd>
                <dt className="eyebrow">On now</dt>
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
          <Link href="/rules" className="eyebrow hover:text-ink hidden px-2 py-2 transition-colors sm:block">
            Rules
          </Link>
          {user ? (
            <AccountMenu user={user} />
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

/**
 * The signed-in account control: the visitor's member number opens a small
 * menu with their dashboard, the creator area, the admin panel when their
 * database role allows it, and a working sign-out. Plain HTML `details`, so
 * it needs no client JavaScript; admin visibility is decided server-side from
 * the authenticated user's role and enforced again on every admin page and
 * action.
 */
function AccountMenu({ user }: { user: CurrentUser }) {
  const memberTag = `#${String(user.memberNo).padStart(4, "0")}`;
  const item =
    "block px-3.5 py-2.5 font-mono text-[0.6875rem] font-500 tracking-[0.14em] uppercase transition-colors hover:bg-surface";
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
        <Link href="/dashboard" className={item}>
          Your links
        </Link>
        <Link href="/earn" className={item}>
          Earn
        </Link>
        {user.role === "admin" && (
          <Link href="/admin" className={item}>
            Admin
          </Link>
        )}
        <form action={signOut} className="border-t border-rule">
          <button type="submit" className={`${item} w-full text-left text-signal`}>
            Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
