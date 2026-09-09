import Link from "next/link";
import { formatCredit } from "@/lib/money";

/**
 * V2 design kit: the small parts every marketplace screen is built from.
 * Same TapMart identity — paper, ink, signal, Archivo + mono — arranged for a
 * social, thumb-first app.
 */

export function Money({ cents, suffix }: { cents: number; suffix?: string }) {
  return (
    <span className="tnum font-display font-800 whitespace-nowrap text-signal">
      {formatCredit(cents)}
      {suffix && <span className="font-mono text-[0.625rem] font-500 text-ink-faint">{suffix}</span>}
    </span>
  );
}

export function Chip({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "signal" | "faint" | "rise" }) {
  const tones = {
    ink: "border-ink text-ink",
    signal: "border-signal text-signal",
    faint: "border-rule text-ink-faint",
    rise: "border-rise text-rise",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[0.625rem] font-600 tracking-[0.08em] uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, "ink" | "signal" | "faint" | "rise"> = {
  open: "rise", active: "rise", approved: "rise", paid: "rise", accepted: "rise",
  completed: "rise", published: "rise", verified: "rise", connected: "rise",
  draft: "faint", idea: "faint", unverified: "faint", disconnected: "faint",
  closed: "faint", unlisted: "faint", withdrawn: "faint",
  rejected: "signal", declined: "signal", failed: "signal", cancelled: "signal",
  disputed: "signal", revision_requested: "signal", proof_required: "signal",
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
        className="shrink-0 border border-ink object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center border border-ink bg-ink font-display font-800 text-paper"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {initial}
    </span>
  );
}

export function EmptyState({
  title, body, actionHref, actionLabel,
}: { title: string; body?: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="border border-dashed border-rule px-5 py-10 text-center">
      <p className="font-display text-lg font-800">{title}</p>
      {body && <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-faint">{body}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn btn-signal mt-4 !px-5 !py-2.5 inline-flex">
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
        <div key={i} className="border border-rule p-4">
          <div className="h-3 w-24 bg-rule" />
          <div className="mt-3 h-5 w-3/4 bg-rule" />
          <div className="mt-2 h-3 w-1/2 bg-rule" />
        </div>
      ))}
    </div>
  );
}

export function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <h2 className="eyebrow">
      {children}
      {count !== undefined && <span className="tnum ml-2 text-ink-faint">{count}</span>}
    </h2>
  );
}

/** Distance/deadline/meta line under a card title. */
export function MetaLine({ parts }: { parts: (string | null | undefined | false)[] }) {
  const shown = parts.filter(Boolean) as string[];
  if (shown.length === 0) return null;
  return (
    <p className="mt-1 font-mono text-[0.6875rem] text-ink-faint">
      {shown.join(" · ")}
    </p>
  );
}
