import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import type { CurrentUser } from "@/lib/auth";

export function Header({ user }: { user: CurrentUser | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/92 backdrop-blur-md">
      <div className="shell flex h-14 items-center justify-between gap-4 md:h-16">
        <div className="flex items-baseline gap-3">
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
        </div>

        <nav className="flex items-center gap-1 md:gap-2" aria-label="Main">
          <Link href="/board" className="eyebrow hover:text-ink px-2 py-2 transition-colors">
            Board
          </Link>
          <Link href="/earn" className="eyebrow hover:text-ink px-2 py-2 transition-colors">
            Earn
          </Link>
          {user ? (
            <Link href="/dashboard" className="eyebrow hover:text-ink hidden px-2 py-2 transition-colors sm:block">
              Yours
            </Link>
          ) : (
            <Link href="/sign-in" className="eyebrow hover:text-ink hidden px-2 py-2 transition-colors sm:block">
              Sign In
            </Link>
          )}
          <Link href="/add" className="btn ml-1 !px-3 !py-2 text-[0.6875rem] md:!px-4">
            <span aria-hidden="true">+</span>
            <span className="hidden sm:inline">Add Your Link</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
