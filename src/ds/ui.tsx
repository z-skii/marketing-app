import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRightIcon } from "./icons";

/**
 * The product primitives every screen is built from: actions, chips,
 * badges, metrics, section heads, empty states. Server-renderable.
 */
type Variant = "primary" | "secondary" | "ghost" | "dark" | "glass";
const VARIANT: Record<Variant, string> = { primary: "btn btn-signal", secondary: "btn", ghost: "btn btn-ghost", dark: "btn btn-dark", glass: "btn btn-glass" };

export function Button({ href, variant = "secondary", size, children, className = "", arrow = false, type = "button", disabled, onClick, ariaLabel, style, external }: {
  href?: string; variant?: Variant; size?: "sm" | "lg"; children: ReactNode; className?: string; arrow?: boolean; type?: "button" | "submit"; disabled?: boolean; onClick?: () => void; ariaLabel?: string; style?: CSSProperties; external?: boolean;
}) {
  const cls = `${VARIANT[variant]}${size ? ` btn-${size}` : ""} ${className}`;
  const inner = <>{children}{arrow && <ArrowRightIcon size={20} aria-hidden />}</>;
  if (href) return external ? <a href={href} className={cls} aria-label={ariaLabel} style={style} target="_blank" rel="noreferrer">{inner}</a> : <Link href={href} className={cls} aria-label={ariaLabel} style={style}>{inner}</Link>;
  return <button type={type} className={cls} disabled={disabled} onClick={onClick} aria-label={ariaLabel} style={style}>{inner}</button>;
}

export function Eyebrow({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <p className={`eyebrow ${className}`} style={style}>{children}</p>;
}

/** A section head: eyebrow, title, one line, an optional action on the right. */
export function SectionHead({ eyebrow, title, lead, action, className = "", size = "h2" }: { eyebrow?: ReactNode; title: ReactNode; lead?: ReactNode; action?: { href: string; label: string }; className?: string; size?: "h1" | "h2" | "h3" }) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h2 className={`t-${size}`}>{title}</h2>
        {lead && <p className="t-lead mt-3">{lead}</p>}
      </div>
      {action && <Link href={action.href} className="link-row shrink-0">{action.label} <ArrowRightIcon size={16} aria-hidden /></Link>}
    </div>
  );
}

const TONES = {
  open: "success", active: "success", approved: "success", paid: "success", accepted: "success", completed: "success", published: "success", verified: "success", connected: "success", listed: "success", funded: "success", live: "success",
  draft: "neutral", idea: "neutral", unverified: "neutral", disconnected: "neutral", closed: "neutral", unlisted: "neutral", withdrawn: "neutral", cancelled: "neutral", ended: "neutral", archived: "neutral",
  pending: "info", submitted: "info", in_review: "info", review: "info", scheduled: "info", applied: "info", requested: "info", creating: "info", booked: "info", installed: "info",
  rejected: "alert", declined: "alert", failed: "alert", disputed: "alert", revision_requested: "warning", proof_required: "warning", needs_revision: "warning", expired: "alert", paused: "warning", waiting: "warning",
} as const;
type Tone = "success" | "neutral" | "info" | "alert" | "warning" | "red" | "ink" | "glass";

export function Badge({ tone = "neutral", children, className = "", dot = false }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return <span className={`badge is-${tone} ${className}`}>{dot && <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-current" />}{children}</span>;
}
export function statusTone(status: string): Tone { return (TONES as Record<string, Tone>)[status] ?? "neutral"; }
/** One short word per state, shared by both sides of the product. */
export const STATUS_LABEL: Record<string, string> = {
  open: "Open", active: "Live", live: "Live", full: "Full", closed: "Closed", ended: "Ended", draft: "Draft", idea: "Idea", archived: "Archived", paused: "Paused",
  applied: "Applied", accepted: "Accepted", declined: "Declined", withdrawn: "Withdrawn", cancelled: "Cancelled", requested: "Requested", sent: "Sent",
  submitted: "Submitted", under_review: "In review", in_review: "In review", review: "In review", pending: "Pending", waiting: "Waiting", creating: "In progress",
  revision_requested: "Revision", needs_revision: "Revision", proof_required: "Proof needed", approved: "Approved", rejected: "Rejected", paid: "Paid", failed: "Failed", disputed: "Disputed", expired: "Expired",
  scheduled: "Scheduled", published: "Posted", needs_approval: "Needs review", new: "New",
  creative_pending: "Creative", installation_pending: "Install", proof_pending: "Proof", booked: "Booked", installed: "Installed", completed: "Done", funded: "Funded",
  verified: "Verified", unverified: "Unverified", connected: "Connected", disconnected: "Off", listed: "Listed", unlisted: "Unlisted", planned: "Planned", done: "Done", delivered: "Delivered",
};
export function statusLabel(status: string): string { return STATUS_LABEL[status] ?? status.replaceAll("_", " "); }
export function StatusBadge({ status, label, className = "" }: { status: string; label?: string; className?: string }) {
  return <Badge tone={statusTone(status)} className={className} dot>{label ?? statusLabel(status)}</Badge>;
}

/** An icon only action: the label is read by assistive technology and shown as a tooltip on desktop. */
export function IconButton({ href, label, icon, size = "md", surface = false, className = "", onClick, type = "button", disabled, tipUp = false, external }: {
  href?: string; label: string; icon: ReactNode; size?: "sm" | "md" | "lg"; surface?: boolean; className?: string; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; tipUp?: boolean; external?: boolean;
}) {
  const cls = `iconbtn${size === "sm" ? " is-sm" : size === "lg" ? " is-lg" : ""}${surface ? " is-surface" : ""}${tipUp ? " tip-up" : ""} ${className}`;
  if (href) return external ? <a href={href} className={cls} aria-label={label} data-tip={label} target="_blank" rel="noreferrer">{icon}</a> : <Link href={href} className={cls} aria-label={label} data-tip={label}>{icon}</Link>;
  return <button type={type} className={cls} aria-label={label} data-tip={label} onClick={onClick} disabled={disabled}>{icon}</button>;
}

export function Chip({ href, active = false, children, className = "", icon }: { href?: string; active?: boolean; children: ReactNode; className?: string; icon?: ReactNode }) {
  const cls = `pill ${className}`;
  if (href) return <Link href={href} className={cls} aria-current={active ? "page" : undefined}>{icon}{children}</Link>;
  return <span className={cls} aria-pressed={active}>{icon}{children}</span>;
}

/** One number that matters, its label under it. */
export function Metric({ value, label, sub, className = "", tone }: { value: ReactNode; label: ReactNode; sub?: ReactNode; className?: string; tone?: "red" | "success" }) {
  return (
    <div className={`metric ${className}`}>
      <span className="metric-value" style={tone === "red" ? { color: "var(--tm-red)" } : tone === "success" ? { color: "var(--tm-success)" } : undefined}>{value}</span>
      <span className="metric-label">{label}</span>
      {sub && <span className="t-meta">{sub}</span>}
    </div>
  );
}

/** An honest empty state: what is missing, what fills it, one action. */
export function Empty({ icon, title, body, action, className = "" }: { icon?: ReactNode; title: ReactNode; body?: ReactNode; action?: { href: string; label: string; variant?: Variant }; className?: string }) {
  return (
    <div className={`card flex flex-col items-start gap-3 p-6 md:p-8 ${className}`}>
      {icon && <span className="icon-square">{icon}</span>}
      <p className="t-h3">{title}</p>
      {body && <p className="t-body max-w-md text-ink-soft">{body}</p>}
      {action && <Button href={action.href} variant={action.variant ?? "primary"} className="mt-2" arrow>{action.label}</Button>}
    </div>
  );
}

/** A glass information card. */
export function Glass({ children, className = "", dark = false, style }: { children: ReactNode; className?: string; dark?: boolean; style?: CSSProperties }) {
  return <div className={`glass-panel ${dark ? "is-dark" : ""} ${className}`} style={style}>{children}</div>;
}

/** A row that leads somewhere: a leading tile, a title, a line, a trailing status and a chevron. */
export function LinkRow({ href, icon, title, sub, trailing, className = "" }: { href: string; icon?: ReactNode; title: ReactNode; sub?: ReactNode; trailing?: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`row flex min-h-[72px] items-center gap-3 px-3.5 py-3 ${className}`}>
      {icon && <span className="icon-square">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-600 leading-5">{title}</span>
        {sub && <span className="block truncate text-[13px] leading-4 text-ink-soft">{sub}</span>}
      </span>
      {trailing}
      <ArrowRightIcon size={20} className="shrink-0 text-ink-faint" aria-hidden />
    </Link>
  );
}
