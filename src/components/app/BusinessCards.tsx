import Link from "next/link";
import type { Car, Person } from "@/lib/v2/marketplace";
import { personName, provenance } from "@/components/fs/business/People";
import { carName, zoneLine } from "@/components/fs/business/Cars";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { formatMoney } from "@/components/fs/parts";
import { VerifiedIcon, InstagramIcon, CarIcon, StarIcon, ArrowRightIcon } from "@/ds/icons";

/**
 * People and cars as marketplace objects for a business: the portrait or
 * the car photograph is the card, their own work sits on it, the facts
 * and the two real actions (View, Request) follow. Every value is the
 * real record; nothing is counted that is not stored.
 */
function portraitSrc(p: Person) {
  return p.avatar_url ?? (p.instagram?.status === "connected" ? p.instagram.avatar_url : null) ?? null;
}

export function PersonCard({ p, canRequest, lead = false, priority = false }: { p: Person; canRequest: boolean; lead?: boolean; priority?: boolean }) {
  const name = personName(p);
  const stills = p.samples.slice(0, lead ? 3 : 2);
  const facts = [p.city, p.completed_jobs > 0 ? `${p.completed_jobs} completed` : null, p.rating_count > 0 && p.rating_avg != null ? `${p.rating_avg.toFixed(1)} · ${p.rating_count} review${p.rating_count === 1 ? "" : "s"}` : null].filter(Boolean);
  const src = portraitSrc(p);
  return (
    <article className={`ap-card ap-person ${lead ? "is-lead" : ""}`} aria-labelledby={`person-${p.id}-t`}>
      <div className="ap-card-media">
        {src ? <MediaPreview src={src} alt="" priority={priority} sizes={lead ? "(min-width: 1280px) 720px, 100vw" : "(min-width: 640px) 40vw, 100vw"} /> : <span className="ap-empty">No portrait</span>}
        <span className="glass-tag ap-card-tag">{p.verification === "verified" ? <><VerifiedIcon size={16} weight="fill" aria-hidden />Verified</> : p.instagram?.status === "connected" ? <><InstagramIcon size={16} aria-hidden />Instagram</> : "Creator"}</span>
        {p.has_listed_vehicle && <span className="glass-tag" style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}><CarIcon size={16} aria-hidden />Car listed</span>}
        {stills.length > 0 && <span className="ap-samples" aria-label={`${stills.length} work samples`}>{stills.map((s) => <span key={s.url} title={s.title}><MediaPreview src={s.url} alt="" sizes="44px" /></span>)}</span>}
      </div>
      <div className="ap-card-body">
        <h2 id={`person-${p.id}-t`} className="ap-card-title"><Link href={`/business/people/${p.username}`}>{name}</Link></h2>
        <p className="t-meta">{provenance(p)}</p>
        {facts.length > 0 && <p className="t-meta" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>{p.rating_count > 0 && <StarIcon size={16} weight="fill" aria-hidden style={{ color: "var(--tm-warning)" }} />}{facts.join(" · ")}</p>}
        <div className="ap-card-actions">
          <Link href={`/business/people/${p.username}`} className="btn btn-sm">View <ArrowRightIcon size={16} aria-hidden /></Link>
          {canRequest && <Link href={`/business/people/${p.username}?request=story`} className="btn btn-dark btn-sm">Request</Link>}
        </div>
      </div>
    </article>
  );
}

export function CarCard({ c, priority = false }: { c: Car; priority?: boolean }) {
  const still = c.stage.posterUrl ?? c.stage.photos[0]?.url ?? null;
  const priced = c.zones.filter((z) => z.asking_cents != null);
  const min = priced.length ? Math.min(...priced.map((z) => z.asking_cents as number)) : null;
  const name = carName(c);
  return (
    <article className="ap-card" aria-labelledby={`car-${c.id}-t`}>
      <div className="ap-card-media" style={{ aspectRatio: "16 / 10" }}>
        {still ? <MediaPreview src={still} alt="" priority={priority} sizes="(min-width: 640px) 40vw, 100vw" /> : <span className="ap-empty">No photo yet</span>}
        <span className="glass-tag ap-card-tag"><CarIcon size={16} aria-hidden />{zoneLine(c)}</span>
        {min != null && <span className="ap-card-money"><b>{formatMoney(min).replace(/\.00$/, "")}</b><span>{priced.length > 1 ? "from, a month" : "a month"}</span></span>}
        {c.stage.glbUrl && <span className="glass-tag" style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>3D model</span>}
      </div>
      <div className="ap-card-body">
        <h2 id={`car-${c.id}-t`} className="ap-card-title"><Link href={`/business/cars/${c.id}`}>{name}{c.color ? <span style={{ color: "var(--tm-muted)", fontWeight: 400 }}> · {c.color}</span> : null}</Link></h2>
        <p className="t-meta">{c.owner_name}{c.city ? ` · ${c.city}` : ""}{priced.length > 1 ? ` · ${priced.length} placements` : min == null ? " · Price to agree" : ""}</p>
        <div className="ap-card-actions"><Link href={`/business/cars/${c.id}`} className="btn btn-sm">View <ArrowRightIcon size={16} aria-hidden /></Link></div>
      </div>
    </article>
  );
}
