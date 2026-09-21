import Link from "next/link";
import { ArrowSquareOut, CaretRight } from "@phosphor-icons/react/dist/ssr";

/**
 * Settings rows, the same in the creator and the business app. Groups are
 * rounded cards with a small uppercase title; each row is an icon, a
 * label, an optional current value or status at the end, and a caret when
 * it opens something. A sub line is used only for a real current state
 * that matters, never as a description.
 */
export type Tone = "confirmed" | "waiting" | "problem" | "neutral";

export type RowProps = {
  href?: string;
  title: string;
  sub?: React.ReactNode;
  status?: string;
  tone?: Tone;
  external?: boolean;
  disabled?: boolean;
  /** A real image or glyph on the left, 40px. */
  lead?: React.ReactNode;
  /** A 20px icon in a tinted 32px square on the left. */
  icon?: React.ReactNode;
  /** A short current value at the end, muted. */
  value?: React.ReactNode;
  end?: React.ReactNode;
};

export function SettingsGroup({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  const hid = id ?? `sg-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={hid} style={{ marginTop: 24 }}>
      <h2 id={hid} className="fs-settings-title">{title}</h2>
      <ul className="fs-settings-group">{children}</ul>
    </section>
  );
}

export function SettingsRow(r: RowProps) {
  const lead = r.lead ?? (r.icon ? <span className="fs-settings-icon" aria-hidden>{r.icon}</span> : null);
  const text = (
    <span className={lead ? `fs-settings-lead${r.icon && !r.lead ? " is-icon" : ""}` : undefined} style={{ minWidth: 0 }}>
      {lead}
      <span className="fs-settings-text" style={{ minWidth: 0 }}>
        <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>{r.title}</span>
        {r.sub && <span className="fs-t-meta fs-settings-sub">{r.sub}</span>}
      </span>
    </span>
  );
  const end = (
    <span className="fs-settings-end">
      {r.value && <span className="fs-settings-value">{r.value}</span>}
      {r.status && <span className={`fs-status is-${r.tone ?? "neutral"}`}>{r.status}</span>}
      {r.end}
      {r.href && !r.disabled && (r.external ? <ArrowSquareOut size={20} aria-hidden /> : <CaretRight size={20} aria-hidden />)}
    </span>
  );
  if (!r.href || r.disabled) {
    return <li><span className={`fs-settings-row${r.disabled ? " is-disabled" : ""}`} aria-disabled={r.disabled ? "true" : undefined}>{text}{end}</span></li>;
  }
  if (r.external) return <li><a href={r.href} target="_blank" rel="noreferrer" className="fs-settings-row">{text}{end}</a></li>;
  return <li><Link href={r.href} className="fs-settings-row">{text}{end}</Link></li>;
}

/** A page title with a back link above it; every utility screen starts this way. */
export function UtilityHead({ title, lede, back, action }: { title: string; lede?: string; back?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <>
      {back && <div className="fs-detail-top">{back}{action}</div>}
      <div className="fs-purpose-row" style={{ marginTop: back ? 4 : undefined }}>
        <h1 className="fs-t-page">{title}</h1>
        {!back && action}
      </div>
      {lede && <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>{lede}</p>}
    </>
  );
}
