import Link from "next/link";
import { ArrowRight, CaretDown } from "@phosphor-icons/react/dist/ssr";
import type { Person } from "@/lib/v2/marketplace";
import { compactCount } from "@/lib/v2/marketplace";
import { Avatar } from "@/components/fs/parts";
import { InspectButton } from "@/components/fs/SourceInspector";

/**
 * People a business can send a request to, in Frame Shift: an open,
 * source-ratio spread that pairs a strong portrait with the person's
 * actual work at its own ratio, one caption row, the recorded source
 * title with literal provenance, then View person and the named requests
 * the product actually supports: Request Story, Request Reel. Nothing on
 * the root is a count the record does not hold.
 */
export type PersonSpreadData = {
  person: Person;
  /** The work sample's real aspect ratio, or null when it could not be read. */
  ratio: number | null;
};

const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

/** Literal provenance from the recorded fields; nothing inferred. */
export function provenance(p: Person): string {
  const parts: string[] = [];
  if (p.instagram?.status === "connected") {
    parts.push(p.instagram.followers != null ? `Instagram connected · ${compactCount(p.instagram.followers)} followers` : "Instagram connected");
  } else if (p.instagram?.status === "pending") parts.push("Instagram not yet verified");
  if (p.verification === "verified") parts.push("Verified creator");
  else if (parts.length === 0) parts.push("Not verified");
  return parts.join(" · ");
}

function facts(p: Person): string | null {
  const out: string[] = [];
  if (p.completed_jobs > 0) out.push(`${p.completed_jobs} completed`);
  if (p.rating_count > 0 && p.rating_avg != null) out.push(`${p.rating_avg.toFixed(1)} rating · ${p.rating_count} review${p.rating_count === 1 ? "" : "s"}`);
  return out.length ? out.join(" · ") : null;
}

export function personName(p: Person) {
  return p.display_name ?? p.username;
}

function portraitSrc(p: Person) {
  return p.avatar_url ?? (p.instagram?.status === "connected" ? p.instagram.avatar_url : null) ?? null;
}

/** Desktop geometry: a 232px-tall work sample at its ratio beside a 160x200 portrait. */
function geometry(ratio: number | null, hasSample: boolean) {
  if (!hasSample) return { width: 240, portrait: { w: 160, h: 200, y: 32 }, work: null as null | { w: number; h: number } };
  const r = ratio ?? 0.8;
  if (r > 1.05) { const h = 192; const w = Math.min(Math.round(h * r), 300); return { width: 160 + 16 + w, portrait: { w: 144, h: 180, y: 52 }, work: { w, h } }; }
  const h = 232; const w = Math.round(h * r * 10) / 10;
  return { width: Math.max(320, Math.round(160 + 24 + w)), portrait: { w: 160, h: 200, y: 32 }, work: { w, h } };
}

function WorkFigure({ p, w, h }: { p: Person; w: number; h: number }) {
  const sample = p.samples[0] ?? null;
  if (!sample) return null;
  const name = personName(p);
  if (VIDEO.test(sample.url)) {
    return (
      <InspectButton src={sample.url} alt={`${sample.title}, ${sample.kind === "approved" ? "approved work" : "portfolio"} by ${name}`} label={`Inspect ${sample.title}`} className="fs-media" style={{ width: w, height: h, display: "block" }}>
        <span className="fs-video-fallback">Video<span className="fs-video-note">Inspect to play</span></span>
      </InspectButton>
    );
  }
  return (
    <InspectButton src={sample.url} alt={`${sample.title}, ${sample.kind === "approved" ? "approved work" : "portfolio"} by ${name}`} label={`Inspect ${sample.title}`} className="fs-media fs-contain" style={{ width: w, height: h, display: "block", background: "var(--fs-underlay)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sample.url} alt="" width={w} height={h} loading="lazy" />
    </InspectButton>
  );
}

function Portrait({ p, w, h }: { p: Person; w: number; h: number }) {
  const src = portraitSrc(p);
  const name = personName(p);
  return (
    <div className="fs-media" style={{ width: w, height: h, background: "var(--fs-underlay)", display: "grid", placeItems: "center" }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} width={w} height={h} loading="lazy" />
      ) : <span aria-hidden className="fs-display" style={{ fontWeight: 700, fontSize: 28, color: "var(--fs-ink)" }}>{(name.trim()[0] ?? "?").toUpperCase()}</span>}
    </div>
  );
}

function SourceLine({ p }: { p: Person }) {
  const sample = p.samples[0] ?? null;
  const name = personName(p);
  return (
    <span className="fs-t-meta" style={{ display: "block" }}>
      {sample ? (
        <>
          <InspectButton src={sample.url} alt={`${sample.title}, ${sample.kind === "approved" ? "approved work" : "portfolio"} by ${name}`} label={sample.title} className="fs-link-ink fs-link-ul" icon={false} style={{ fontWeight: 500, fontSize: 14, lineHeight: "20px", minHeight: 20, textAlign: "left" }} />
          {sample.kind === "approved" ? " · Approved work" : " · Portfolio"}
        </>
      ) : "No work samples shared"}
      {" · "}{provenance(p)}
    </span>
  );
}

/** View person, then the two named requests the product runs. Never a vague verb. */
function Actions({ p, canRequest }: { p: Person; canRequest: boolean }) {
  const href = `/business/people/${p.username}`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44, flexWrap: "wrap" }}>
      <Link href={href} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, minHeight: 44 }}>View person</Link>
      {canRequest && (
        <details className="fs-request">
          <summary className="fs-btn fs-btn-quiet" style={{ minHeight: 44 }} aria-haspopup="menu">Request <CaretDown size={14} aria-hidden /></summary>
          <div className="fs-menu" role="menu">
            <Link href={`${href}?request=story`} role="menuitem">Request Story <ArrowRight size={16} aria-hidden /></Link>
            <Link href={`${href}?request=reel`} role="menuitem">Request Reel <ArrowRight size={16} aria-hidden /></Link>
          </div>
        </details>
      )}
    </div>
  );
}

/** Desktop ribbon spread: portrait and work side by side at source ratio. */
export function PersonSpread({ s, canRequest = true }: { s: PersonSpreadData; canRequest?: boolean }) {
  const p = s.person;
  const g = geometry(s.ratio, p.samples.length > 0);
  const name = personName(p);
  const f = facts(p);
  return (
    <article aria-label={name} className="fs-person-spread" style={{ width: g.width, flex: `0 0 ${g.width}px` }}>
      <div style={{ position: "relative", height: 232 }}>
        <div style={{ position: "absolute", left: 0, top: g.portrait.y }}><Portrait p={p} w={g.portrait.w} h={g.portrait.h} /></div>
        {g.work ? (
          <div style={{ position: "absolute", right: 0, top: g.work.h < 232 ? 0 : 0 }}><WorkFigure p={p} w={g.work.w} h={g.work.h} /></div>
        ) : (
          <p className="fs-t-meta" style={{ position: "absolute", left: g.portrait.w + 16, top: g.portrait.y + 8, maxWidth: 64 }}>No work samples shared.</p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8, minHeight: 24 }}>
        <span className="fs-t-task" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
        {p.city && <span className="fs-t-meta" style={{ whiteSpace: "nowrap" }}>{p.city}</span>}
      </div>
      <SourceLine p={p} />
      {f && <span className="fs-t-meta" style={{ display: "block" }}>{f}</span>}
      <Actions p={p} canRequest={canRequest} />
    </article>
  );
}

/** Phone assembly: the work sample in a 176px column, identity beside it starting 12px lower, actions below. */
export function PersonAssembly({ s, canRequest = true }: { s: PersonSpreadData; canRequest?: boolean }) {
  const p = s.person;
  const name = personName(p);
  const sample = p.samples[0] ?? null;
  const w = 176;
  const h = sample ? Math.min(Math.round(w / (s.ratio ?? 0.8)), 313) : 0;
  const f = facts(p);
  return (
    <article aria-label={name} className="fs-person-assembly">
      <div style={{ display: "grid", gridTemplateColumns: "176px minmax(0, 1fr)", gap: 12, alignItems: "start" }}>
        {sample ? <WorkFigure p={p} w={w} h={h} /> : (
          <div className="fs-media" style={{ width: w, height: 160, background: "var(--fs-underlay)", display: "grid", placeItems: "center" }}><span className="fs-t-meta" style={{ textAlign: "center", padding: 12 }}>No work samples shared</span></div>
        )}
        <div className="fs-joint-phone">
          <Portrait p={p} w={104} h={130} />
          <p className="fs-t-section" style={{ marginTop: 8, fontSize: 22, lineHeight: "28px", overflowWrap: "anywhere" }}>{name}</p>
          {p.city && <p className="fs-t-meta" style={{ marginTop: 2 }}>{p.city}</p>}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <SourceLine p={p} />
        {f && <span className="fs-t-meta" style={{ display: "block" }}>{f}</span>}
      </div>
      <Actions p={p} canRequest={canRequest} />
    </article>
  );
}

/** Small square avatar for shells and rows. */
export function PersonAvatar({ p, size = 40 }: { p: Person; size?: number }) {
  return <Avatar src={portraitSrc(p)} name={personName(p)} size={size} />;
}
