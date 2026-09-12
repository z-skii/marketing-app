import Link from "next/link";
import { ArrowRight, CheckCircle, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import type { Opportunity } from "@/lib/v2/opportunities";
import type { CreatorStep } from "@/lib/ai/types";
import { SaveToggle } from "@/components/fs/SaveToggle";
import { BackLink } from "./BackLink";

/** Pieces the three opportunity compositions share. Server-renderable. */

export function DetailTop({ o, open }: { o: Opportunity; open: boolean }) {
  return (
    <div className="fs-detail-top">
      <BackLink fallback="/home" label="Home" />
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {!open && <span className="fs-status is-neutral">Closed</span>}
        <SaveToggle itemType="campaign" itemId={o.id} initialSaved={o.saved} />
      </span>
    </div>
  );
}

export function BusinessLine({ o }: { o: Opportunity }) {
  return (
    <p className="fs-t-meta" style={{ marginTop: 4 }}>
      <Link href={`/b/${o.business_slug}`} className="fs-link-ink fs-link-ul" style={{ fontWeight: 500 }}>{o.business_name}</Link>
      {o.business_verified && <CheckCircle size={16} weight="fill" aria-label="Verified business" style={{ display: "inline-block", verticalAlign: "-3px", marginLeft: 4, color: "var(--fs-confirmed)" }} />}
      {o.city ? ` · ${o.city}` : ""}
    </p>
  );
}

export function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section className="fs-section" aria-labelledby={id ? `${id}-h` : undefined} id={id}>
      <h2 id={id ? `${id}-h` : undefined} className="fs-t-section">{title}</h2>
      {children}
    </section>
  );
}

/** A white working plane. `decision` adds the cobalt edge for a choice the person is asked to make. */
export function Plane({ decision = false, children, style }: { decision?: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className={`fs-plane${decision ? " is-decision" : ""}`} style={style}>{children}</div>;
}

/** Numbered steps with the reference frame when the campaign stored one. */
export function Steps({ steps }: { steps: CreatorStep[] }) {
  if (steps.length === 0) return null;
  return (
    <ol className="fs-steps" style={{ marginTop: 4 }}>
      {steps.map((s) => (
        <li key={s.n}>
          <div className="fs-step">
            <span className="fs-step-frame" aria-hidden>
              {s.frame_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.frame_url} alt="" loading="lazy" />
              ) : String(s.n).padStart(2, "0")}
            </span>
            <span style={{ minWidth: 0 }}>
              <span className="fs-t-body" style={{ display: "block" }}>{s.n}. {s.text}</span>
              {s.timing && <span className="fs-t-meta" style={{ display: "block" }}>{s.timing}</span>}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PlainList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="fs-plain-list" style={{ marginTop: 4 }}>
      {items.map((r, i) => <li key={i} className="fs-t-body" style={{ padding: "6px 0", borderTop: i === 0 ? 0 : "1px solid var(--fs-divider)" }}>{r}</li>)}
    </ul>
  );
}

export function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="fs-facts" style={{ marginTop: 8 }}>
      {rows.map(([k, v]) => (<div key={k} style={{ display: "contents" }}><dt>{k}</dt><dd>{v}</dd></div>))}
    </dl>
  );
}

export function GoLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: 8 }}>{children} <ArrowRight size={18} aria-hidden /></Link>;
}

/** A submission thumbnail at source ratio: image, or an honest video fallback. */
export function WorkThumb({ src, alt, width = 104, height = 139 }: { src: string | null; alt: string; width?: number; height?: number }) {
  const video = Boolean(src && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src));
  return (
    <div className="fs-media fs-contain fs-thumb" style={{ width, height, flexShrink: 0 }}>
      {!src ? <div className="fs-video-fallback">No file</div>
        : video ? <div className="fs-video-fallback"><VideoCamera size={22} aria-hidden />Video<span className="fs-video-note">No preview available</span></div>
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={src} alt={alt} loading="lazy" />}
    </div>
  );
}

export function fmtLong(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
