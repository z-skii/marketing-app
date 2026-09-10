import Link from "next/link";
import { MagnifyingGlass, Bell } from "@phosphor-icons/react/dist/ssr";
import { formatCredit } from "@/lib/money";

/**
 * V2 design kit: the small parts every marketplace screen is built from.
 * Graphite surfaces, big display type, one lime signal, and photography
 * doing the colour work. Nothing here draws an outline.
 */

const MONEY_SIZE = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-[1.75rem] leading-none",
  xl: "text-[2.5rem] leading-none",
  hero: "text-[3.25rem] leading-none",
} as const;

export function Money({
  cents, suffix, size = "md", tone = "signal",
}: { cents: number; suffix?: string; size?: keyof typeof MONEY_SIZE; tone?: "signal" | "ink" }) {
  return (
    <span className={`tnum font-display font-800 tracking-[-0.03em] whitespace-nowrap ${MONEY_SIZE[size]} ${tone === "signal" ? "text-signal" : "text-ink"}`}>
      {formatCredit(cents)}
      {suffix && (
        <span className={`ml-1.5 font-display font-600 tracking-normal text-ink-soft ${size === "hero" || size === "xl" ? "text-lg" : size === "lg" ? "text-base" : "text-[0.6em]"}`}>
          {suffix}
        </span>
      )}
    </span>
  );
}

export function Chip({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "signal" | "faint" | "rise" | "alert" }) {
  const tones = {
    ink: "bg-surface-2 text-ink",
    signal: "bg-signal text-signal-ink",
    faint: "bg-surface-2 text-ink-faint",
    rise: "bg-rise/15 text-rise",
    alert: "bg-alert/15 text-alert",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-display text-xs font-700 ${tones[tone]}`}>
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, "ink" | "signal" | "faint" | "rise" | "alert"> = {
  open: "rise", active: "rise", approved: "rise", paid: "rise", accepted: "rise",
  completed: "rise", published: "rise", verified: "rise", connected: "rise",
  draft: "faint", idea: "faint", unverified: "faint", disconnected: "faint",
  closed: "faint", unlisted: "faint", withdrawn: "faint",
  rejected: "alert", declined: "alert", failed: "alert", cancelled: "faint",
  disputed: "alert", revision_requested: "alert", proof_required: "alert",
};

export function StatusChip({ status }: { status: string }) {
  return <Chip tone={STATUS_TONES[status] ?? "ink"}>{status.replaceAll("_", " ")}</Chip>;
}

export function Avatar({
  src, name, size = 40,
}: { src?: string | null; name: string; size?: number }) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src} alt={name} width={size} height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-surface-2 font-display font-800 text-ink"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}

export function EmptyState({
  title, body, actionHref, actionLabel,
}: { title: string; body?: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-display text-xl font-800 tracking-[-0.02em]">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-ink-soft">{body}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn btn-signal mt-5 inline-flex">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function SkeletonRows({ n = 3 }: { n?: number }) {
  return (
    <div className="flex animate-pulse flex-col gap-3" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="aspect-[4/3] bg-surface-2" />
          <div className="p-4">
            <div className="h-5 w-3/4 rounded bg-surface-2" />
            <div className="mt-2 h-3 w-1/2 rounded bg-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Section heading in display type. Pair with an optional right-side action. */
export function SectionTitle({
  children, count, action,
}: { children: React.ReactNode; count?: number; action?: { href: string; label: string } }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-lg font-800 tracking-[-0.02em]">
        {children}
        {count !== undefined && <span className="tnum ml-2 text-ink-faint">{count}</span>}
      </h2>
      {action && (
        <Link href={action.href} className="link-row text-sm">
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** Distance/deadline/meta line under a card title. */
export function MetaLine({ parts, className = "" }: { parts: (string | null | undefined | false)[]; className?: string }) {
  const shown = parts.filter(Boolean) as string[];
  if (shown.length === 0) return null;
  return (
    <p className={`text-sm text-ink-faint ${className}`}>
      {shown.join("  ·  ")}
    </p>
  );
}

/** One number that matters, with a plain-language label under it. */
export function Stat({
  label, value, sub, tone = "ink",
}: { label: string; value: React.ReactNode; sub?: string; tone?: "ink" | "signal" }) {
  return (
    <div className="min-w-0">
      <p className={`tnum truncate font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] ${tone === "signal" ? "text-signal" : "text-ink"}`}>
        {value}
      </p>
      <p className="mt-1.5 text-sm text-ink-soft">{label}</p>
      {sub && <p className="text-xs text-ink-faint">{sub}</p>}
    </div>
  );
}

/**
 * Top bar for the main screens: a title (or a place) on the left, search and
 * notifications on the right. The desktop rail has its own nav, so this
 * only renders the bell where the bottom bar does not.
 */
export function ScreenHeader({
  title, kicker, unread = 0, showSearch = true, right, wrap = false, bell = true,
}: { title: React.ReactNode; kicker?: React.ReactNode; unread?: number; showSearch?: boolean; right?: React.ReactNode; wrap?: boolean; bell?: boolean }) {
  return (
    <header className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        {kicker && <p className="text-sm text-ink-faint">{kicker}</p>}
        <h1 className={`${wrap ? "leading-[1.05]" : "truncate"} font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]`}>{title}</h1>
      </div>
      {right}
      {showSearch && (
        <Link href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink">
          <MagnifyingGlass size={22} aria-hidden />
        </Link>
      )}
      {bell && <Link href="/alerts" aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink rail:hidden">
        <Bell size={22} aria-hidden />
        {unread > 0 && (
          <span className="tnum absolute -top-0.5 -right-0.5 min-w-5 rounded-full bg-alert px-1.5 text-center font-display text-[0.6875rem] font-800 leading-5 text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>}
    </header>
  );
}
