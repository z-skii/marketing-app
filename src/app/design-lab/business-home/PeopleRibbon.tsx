import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Person } from "../mock";
import { InspectButton } from "../SourceInspector";

/**
 * The people opportunity ribbon: an open, source-ratio contact strip. Each
 * spread pairs a strong portrait with the person's actual work at its own
 * ratio, then one caption row, the recorded source title (an inspection
 * link) with literal provenance, and two 44px actions: View person and a
 * named Request. Native horizontal scrolling; the first three spreads
 * exactly fill the 1176px field (320 + 360 + 448 with 24px gaps).
 */
export type Spread = { person: Person; width: number; portrait: { w: number; h: number; y: number }; work: { w: number; h: number; x: number } | null };

const RATIO: Record<string, number> = { "9 / 16": 9 / 16, "4 / 5": 4 / 5, "3 / 2": 3 / 2, "1 / 1": 1 };

/** Spread geometry from the spec: Maya 320, Eli 360, Imani 448, Jules and Nora 360, Theo 240. */
export function spreads(people: Person[]): Spread[] {
  return people.map((p) => {
    const ratio = p.sample ? RATIO[p.sample.ratio] ?? 0.8 : 0;
    if (p.id === "p-imani") return { person: p, width: 448, portrait: { w: 144, h: 180, y: 52 }, work: { w: 288, h: 192, x: 160 } };
    if (!p.sample) return { person: p, width: 240, portrait: { w: 160, h: 200, y: 32 }, work: null };
    const h = 232; const w = Math.round(h * ratio * 10) / 10;
    const width = p.id === "p-maya" ? 320 : 360;
    return { person: p, width, portrait: { w: 160, h: 200, y: 32 }, work: { w, h, x: width - w } };
  });
}

/** Literal provenance from the recorded fields; nothing inferred. */
export function provenance(p: Person): string {
  if (p.qualification.startsWith("Instagram Manual")) return "Instagram manual";
  if (p.qualification.startsWith("Instagram connected")) return "Instagram connected";
  if (p.qualification === "Verified creator") return "Verified creator";
  return "Not verified";
}

export function PersonSpread({ s, onView }: { s: Spread; onView?: (id: string) => void }) {
  const p = s.person; const first = p.name.split(" ")[0];
  return (
    <article aria-label={p.name} style={{ width: s.width, flex: `0 0 ${s.width}px`, scrollSnapAlign: "start" }}>
      <div style={{ position: "relative", height: 232 }}>
        <div className="media" style={{ position: "absolute", left: 0, top: s.portrait.y, width: s.portrait.w, height: s.portrait.h, background: "var(--tm-underlay)", display: "grid", placeItems: "center" }}>
          {p.portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.portrait} alt={p.name} width={s.portrait.w} height={s.portrait.h} />
          ) : (
            <span aria-hidden className="t-display" style={{ fontWeight: 700, fontSize: 28, color: "var(--tm-ink)" }}>{p.initials}</span>
          )}
        </div>
        {s.work && p.sample ? (
          <InspectButton src={p.sample.src} alt={`${p.sample.title}, ${p.sample.kind} by ${p.name}`} label={`Inspect ${p.sample.title}`} className="media" style={{ position: "absolute", left: s.work.x, top: 0, width: s.work.w, height: s.work.h, display: "block" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.sample.src} alt="" width={s.work.w} height={s.work.h} />
          </InspectButton>
        ) : (
          <p className="t-meta" style={{ position: "absolute", left: s.portrait.w + 16, top: s.portrait.y + 8, margin: 0, maxWidth: 64 }}>No work samples shared.</p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8, height: 24 }}>
        <span className="t-task" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
        <span className="t-meta" style={{ whiteSpace: "nowrap" }}>{p.city}</span>
      </div>
      <div className="t-meta" style={{ margin: 0, height: 20, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {p.sample ? <InspectButton src={p.sample.src} alt={`${p.sample.title}, ${p.sample.kind} by ${p.name}`} label={p.sample.title} className="link-ink link-ul" icon={false} style={{ fontWeight: 500, fontSize: 14, lineHeight: "20px", minHeight: 20 }} /> : "No work samples shared"} · {provenance(p)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 44 }}>
        {onView ? (
          <button type="button" className="btn btn-quiet link-ink" style={{ paddingLeft: 0, minHeight: 44 }} onClick={() => onView(p.id)}>View person</button>
        ) : (
          <Link href={`#${p.id}`} className="btn btn-quiet link-ink" style={{ paddingLeft: 0, minHeight: 44 }}>View person</Link>
        )}
        {p.sample && <Link href={`#request-${p.id}`} className="btn btn-quiet" style={{ minHeight: 44 }}>Request {first} <ArrowRight size={18} aria-hidden /></Link>}
      </div>
    </article>
  );
}

/**
 * The work-to-request assembly for the public demonstration and phone
 * previews: the work sample leads at its intact ratio, the 104x130 portrait
 * anchors identity at the top right, and the identity and action region
 * starts one 24px source-to-decision step lower. No card, no shadow.
 */
export function PersonAssembly({ person: p, onView, width = 376, compact = false }: { person: Person; onView?: (id: string) => void; width?: number; compact?: boolean }) {
  const ratio = p.sample ? RATIO[p.sample.ratio] ?? 0.8 : 0;
  const first = p.name.split(" ")[0];
  const inspect = p.sample ? <InspectButton src={p.sample.src} alt={`${p.sample.title}, ${p.sample.kind} by ${p.name}`} label={`View work · ${p.sample.title}`} className="link-ink link-ul" icon={false} style={{ fontWeight: 500, fontSize: 14, lineHeight: "20px", minHeight: 44, textAlign: "left", whiteSpace: "normal" }} /> : "No work samples shared";
  const actions = (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, minHeight: 44 }}>
      {onView ? (
        <button type="button" className="btn btn-quiet link-ink" style={{ paddingLeft: 0, minHeight: 44 }} onClick={() => onView(p.id)}>View person</button>
      ) : (
        <Link href="/design-lab/business-home" className="btn btn-quiet link-ink" style={{ paddingLeft: 0, minHeight: 44 }}>View person</Link>
      )}
      {p.sample && (onView ? <button type="button" className="btn btn-quiet" style={{ minHeight: 44 }} onClick={() => onView(p.id)}>Request {first} <ArrowRight size={18} aria-hidden /></button> : <Link href="/design-lab/business-home" className="btn btn-quiet" style={{ minHeight: 44 }}>Request {first} <ArrowRight size={18} aria-hidden /></Link>)}
    </div>
  );
  const portrait = (
    <div className="media" style={{ width: 104, height: 130, background: "var(--tm-underlay)", display: "grid", placeItems: "center" }}>
      {p.portrait ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.portrait} alt={p.name} width={104} height={130} />
      ) : <span aria-hidden className="t-display" style={{ fontWeight: 700, fontSize: 24 }}>{p.initials}</span>}
    </div>
  );
  if (compact) {
    /* Phone: a 176px source column, a 12px gap, then identity (portrait, name, provenance) beside it; actions below. */
    const w = 176; const h = p.sample ? Math.round(w / ratio) : 0;
    return (
      <article aria-label={p.name} className="person-compact" style={{ width }}>
        <div style={{ display: "grid", gridTemplateColumns: "176px minmax(0, 1fr)", gap: 12, alignItems: "start" }}>
          {p.sample ? (
            <InspectButton src={p.sample.src} alt={`${p.sample.title}, ${p.sample.kind} by ${p.name}`} label={`Inspect ${p.sample.title}`} className="media" style={{ width: w, height: Math.min(h, 313), display: "block" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.sample.src} alt="" width={w} height={Math.min(h, 313)} style={{ objectFit: "contain", background: "var(--tm-underlay)" }} />
            </InspectButton>
          ) : <p className="t-meta" style={{ margin: 0 }}>No work samples shared.</p>}
          <div style={{ marginTop: "var(--tm-shift-phone)" }}>
            {portrait}
            <p className="t-section" style={{ margin: "8px 0 0", fontSize: 22, lineHeight: "28px" }}>{p.name}</p>
            <p className="t-meta" style={{ margin: "2px 0 0" }}>{p.city} · {provenance(p)}</p>
            <div className="t-meta" style={{ margin: 0 }}>{inspect}</div>
          </div>
        </div>
        {actions}
      </article>
    );
  }
  const maxW = width - 104 - 16; const maxH = 280;
  const w = p.sample ? Math.min(maxW, Math.round(maxH * ratio)) : 0; const h = p.sample ? Math.round(w / ratio) : 0;
  return (
    <article aria-label={p.name} style={{ width }}>
      {/* The source reservation: work at its ratio on the baseline; the portrait sits on the source-to-identity boundary, 24px below it. */}
      <div style={{ position: "relative", height: maxH }}>
        {p.sample ? (
          <InspectButton src={p.sample.src} alt={`${p.sample.title}, ${p.sample.kind} by ${p.name}`} label={`Inspect ${p.sample.title}`} className="media" style={{ position: "absolute", left: 0, bottom: 0, width: w, height: h, display: "block" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.sample.src} alt="" width={w} height={h} />
          </InspectButton>
        ) : <p className="t-meta" style={{ position: "absolute", left: 0, bottom: 8, margin: 0 }}>No work samples shared.</p>}
        <div style={{ position: "absolute", right: 0, bottom: -24 }}>{portrait}</div>
      </div>
      <div style={{ marginTop: 24, marginLeft: 24, width: "calc(100% - 24px)" }}>
        <p className="t-section" style={{ margin: 0, fontSize: 22, lineHeight: "28px", paddingRight: 112 }}>{p.name}</p>
        <p className="t-meta" style={{ margin: "2px 0 0", paddingRight: 112 }}>{p.city} · {provenance(p)}</p>
        <div className="t-meta" style={{ margin: 0 }}>{inspect}</div>
        {actions}
      </div>
    </article>
  );
}
