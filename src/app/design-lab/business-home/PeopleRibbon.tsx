import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Person } from "../mock";

/**
 * The people opportunity ribbon: an open, source-ratio contact strip. Each
 * spread pairs a strong portrait with the person's actual work at its own
 * ratio, no enclosing fill or letterbox, then one caption row, one
 * source-and-fit line and two 44px actions: View person and a named
 * Request. Native horizontal scrolling; the first three spreads exactly
 * fill the 1176px field (320 + 360 + 448 with 24px gaps).
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

export function PersonSpread({ s, onView, compact = false }: { s: Spread; onView?: (id: string) => void; compact?: boolean }) {
  const p = s.person;
  const width = compact ? 358 : s.width;
  return (
    <article aria-label={p.name} style={{ width, flex: `0 0 ${width}px`, scrollSnapAlign: "start" }}>
      <div style={{ position: "relative", height: compact ? 200 : 232 }}>
        <div className="media" style={{ position: "absolute", left: 0, top: compact ? 0 : s.portrait.y, width: s.portrait.w, height: s.portrait.h, background: "var(--tm-underlay)", display: "grid", placeItems: "center" }}>
          {p.portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.portrait} alt={p.name} width={s.portrait.w} height={s.portrait.h} />
          ) : (
            <span aria-hidden className="t-display" style={{ fontWeight: 700, fontSize: 28, color: "var(--tm-ink)" }}>{p.initials}</span>
          )}
        </div>
        {s.work && p.sample ? (
          <div className="media" style={{ position: "absolute", left: compact ? Math.min(s.work.x, 358 - s.work.w) : s.work.x, top: 0, width: s.work.w, height: s.work.h }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.sample.src} alt={`Work by ${p.name}`} width={s.work.w} height={s.work.h} />
          </div>
        ) : (
          <p className="t-meta" style={{ position: "absolute", left: s.portrait.w + 16, top: s.portrait.y + 8, margin: 0, maxWidth: 64 }}>No work samples shared.</p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8, height: 24 }}>
        <span className="t-task" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
        <span className="t-meta" style={{ whiteSpace: "nowrap" }}>{p.city}</span>
      </div>
      <p className="t-meta" style={{ margin: 0, height: 20, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.fit}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 0, height: 44 }}>
        {onView ? (
          <button type="button" className="btn btn-quiet link-ink" style={{ paddingLeft: 0, minHeight: 44, textDecoration: "underline", textUnderlineOffset: 3 }} onClick={() => onView(p.id)}>View person</button>
        ) : (
          <Link href={`#${p.id}`} className="btn btn-quiet link-ink" style={{ paddingLeft: 0, minHeight: 44, textDecoration: "underline", textUnderlineOffset: 3 }}>View person</Link>
        )}
        {p.sample && <Link href={`#request-${p.id}`} className="btn btn-quiet" style={{ minHeight: 44 }}>Request <ArrowRight size={18} aria-hidden /></Link>}
      </div>
    </article>
  );
}
