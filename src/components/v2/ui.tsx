import Link from "next/link";
import { MagnifyingGlass, Bell, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { formatCredit } from "@/lib/money";

/**
 * V2 design kit: the small parts every marketplace screen is built from.
 * Graphite surfaces, big display type, one lime signal, and photography
 * doing the colour work. Nothing here draws an outline.
 */

const MONEY_SIZE = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-[1.5rem] leading-none",
  xl: "text-[1.5rem] leading-none",
  hero: "text-[1.5rem] leading-none",
} as const;

export function Money({
  cents, suffix, size = "md", tone = "signal",
}: { cents: number; suffix?: string; size?: keyof typeof MONEY_SIZE; tone?: "signal" | "ink" }) {
  return (
    <span className={`tnum font-display font-600 tracking-[-0.02em] whitespace-nowrap ${MONEY_SIZE[size]} ${tone === "signal" ? "text-signal" : "text-ink"}`}>
      {formatCredit(cents)}
      {suffix && (
        <span className={`ml-1 font-display font-500 tracking-normal text-ink-soft ${size === "hero" || size === "xl" ? "text-base" : size === "lg" ? "text-sm" : "text-[0.7em]"}`}>
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
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-display text-xs font-600 ${tones[tone]}`}>
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
        className="shrink-0 rounded-full object-cover ring-1 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-surface-3 font-display font-600 text-ink ring-1 ring-white/10"
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
    <div className="card px-6 py-10 text-center">
      <p className="font-display text-[1.125rem] font-600 tracking-[-0.01em]">{title}</p>
      {body && <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{body}</p>}
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
      <h2 className="font-display text-[1.0625rem] font-600 tracking-[-0.01em]">
        {children}
        {count !== undefined && <span className="tnum ml-2 font-500 text-ink-faint">{count}</span>}
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
      <p className={`tnum truncate font-display text-[1.25rem] leading-none font-600 tracking-[-0.02em] ${tone === "signal" ? "text-signal" : "text-ink"}`}>
        {value}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
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
        <h1 className={`${wrap ? "leading-[1.05]" : "truncate"} font-display text-[1.5rem] font-700 tracking-[-0.02em] md:text-[1.5rem]`}>{title}</h1>
      </div>
      {right}
      {showSearch && (
        <Link href="/search" aria-label="Search" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink">
          <MagnifyingGlass size={22} aria-hidden />
        </Link>
      )}
      {bell && <Link href="/alerts" aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink rail:hidden">
        <Bell size={22} aria-hidden />
        {unread > 0 && <span aria-hidden className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-signal" />}
      </Link>}
    </header>
  );
}

/**
 * A row on its own surface, exactly as the reference draws it: a 44px icon
 * square, a 17px semibold title, one 14px muted line, an optional quiet
 * status at the right (8px lime dot only when it matters) and a chevron.
 * 72px tall. Stack them with gap-2.5.
 */
export function SurfaceRow({
  href, icon, title, sub, status, statusTone = "faint", external = false, iconTone = "neutral", trailing,
}: {
  href: string; icon: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode;
  status?: React.ReactNode; statusTone?: "signal" | "faint"; external?: boolean;
  iconTone?: "neutral" | "success" | "warn" | "signal" | "instagram"; trailing?: React.ReactNode;
}) {
  const square = `icon-square${iconTone === "neutral" ? "" : ` icon-square-${iconTone}`}`;
  const inner = (
    <>
      <span className={square}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[1rem] leading-[1.3] font-600 tracking-[-0.01em]">{title}</span>
        {sub && <span className="mt-0.5 block truncate text-sm text-ink-soft">{sub}</span>}
      </span>
      {status && (
        <span className="flex shrink-0 items-center gap-1.5 text-[0.8125rem] text-ink-soft">
          {statusTone === "signal" && <span aria-hidden className="status-dot" />}
          {status}
        </span>
      )}
      {trailing}
      <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
    </>
  );
  const cls = "row flex min-h-[4.5rem] items-center gap-3 px-3.5 py-3";
  return external
    ? <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
    : <Link href={href} className={cls}>{inner}</Link>;
}
