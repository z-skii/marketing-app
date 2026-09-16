import Link from "next/link";
import { ArrowSquareOut, CaretRight } from "@phosphor-icons/react/dist/ssr";

/**
 * Utility rows for Stage 5. One calm column: a title, the real current
 * state underneath, a literal status word at the end when there is one,
 * and a caret when the row opens something. No icons, no cards; the
 * dividers do the grouping.
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
  end?: React.ReactNode;
};

export function SettingsGroup({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  const hid = id ?? `sg-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={hid} style={{ marginTop: 24 }}>
      <h2 id={hid} className="fs-t-label" style={{ color: "var(--fs-muted)" }}>{title}</h2>
      <ul className="fs-settings-group">{children}</ul>
    </section>
  );
}

export function SettingsRow(r: RowProps) {
  const text = (
    <span className={r.lead ? "fs-settings-lead" : undefined} style={{ minWidth: 0 }}>
      {r.lead}
      <span className="fs-settings-text" style={{ minWidth: 0 }}>
        <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>{r.title}</span>
        {r.sub && <span className="fs-t-meta fs-settings-sub">{r.sub}</span>}
      </span>
    </span>
  );
  const end = (
    <span className="fs-settings-end">
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
