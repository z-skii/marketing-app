import type { ReactNode } from "react";
import { CalendarBlank, Globe, InstagramLogo, MapPin, SealCheck, Storefront, Play } from "@phosphor-icons/react/dist/ssr";
import { InspectButton } from "@/components/fs/SourceInspector";
import { isVideo } from "@/components/fs/work/DetailKit";

/**
 * The business page pieces: a cover with the logo over its edge, the name
 * and the short facts; a quick info strip; a content gallery from the
 * business's real media; the compact about rows. Used by the public page
 * and the business's own page, which differ in what sits around them.
 */
export function BusinessHero({ cover, logo, name, slug, category, city, verified, description, accent, actions }: {
  cover: string | null; logo: string | null; name: string; slug: string; category: string | null; city: string | null; verified: boolean; description: string | null; accent?: string | null; actions?: ReactNode;
}) {
  const long = (description ?? "").length > 140;
  return (
    <header>
      <div className={`pf-cover${cover ? "" : " is-empty"}`} style={accent ? ({ "--pf-accent": accent } as React.CSSProperties) : undefined}>
        {cover
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={cover} alt={`${name}, cover photo`} loading="eager" fetchPriority="high" />
          : null}
        <div className="dt-hero-scrim" aria-hidden />
      </div>
      <div className="pf-biz-head">
        <span className="pf-biz-logo" style={accent && !logo ? { color: accent } : undefined}>{logo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={logo} alt={`${name} logo`} loading="eager" />
          : <span aria-hidden>{name.trim()[0]?.toUpperCase() ?? "?"}</span>}</span>
        <div style={{ minWidth: 0 }}>
          <h1 className="pf-name">{name}</h1>
          <p className="pf-handle">@{slug}</p>
        </div>
      </div>
      <div className="pf-biz-text">
        <p className="pf-line" style={{ marginTop: 8 }}>
          {category && <span><Storefront size={14} aria-hidden />{category}</span>}
          {city && <span><MapPin size={14} aria-hidden />{city}</span>}
          {verified && <span className="is-verified"><SealCheck size={14} weight="fill" aria-hidden />Verified</span>}
        </p>
        {description && (long
          ? <details className="pf-bio" style={{ marginTop: 10 }}><summary className="pf-more" style={{ listStyle: "none" }}><span className="pf-clamp" style={{ fontWeight: 400, color: "var(--tm-text2)" }}>{description}</span><span style={{ display: "block", marginTop: 4, fontSize: 13 }}>More</span></summary><p style={{ marginTop: 4 }}>{description}</p></details>
          : <p className="pf-bio" style={{ marginTop: 10 }}>{description}</p>)}
        {actions && <div className="pf-actions">{actions}</div>}
      </div>
    </header>
  );
}

export type GalleryItem = { url: string; title: string; tall?: boolean };
export function Gallery({ items, owner }: { items: GalleryItem[]; owner: string }) {
  if (items.length === 0) return null;
  return (
    <div className="pf-gallery" role="list" aria-label="Content">
      {items.map((g, i) => (
        <InspectButton key={`${g.url}-${i}`} src={g.url} alt={`${g.title}, ${owner}`} label={g.title} className={`pf-tile${g.tall ? " is-tall" : ""}`} icon={false}>
          {isVideo(g.url)
            ? <video src={g.url} muted playsInline preload="metadata" aria-hidden />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={g.url} alt="" loading={i < 4 ? "eager" : "lazy"} />}
          {isVideo(g.url) && <span className="dt-play is-sm" aria-hidden><span><Play size={16} weight="fill" /></span></span>}
        </InspectButton>
      ))}
    </div>
  );
}

export function AboutRows({ city, website, websiteHref, instagram, joined, category }: { city: string | null; website: string | null; websiteHref: string | null; instagram: string | null; joined: string; category: string | null }) {
  const rows: { icon: ReactNode; k: string; v: ReactNode }[] = [
    ...(city ? [{ icon: <MapPin size={20} aria-hidden />, k: "Location", v: city }] : []),
    ...(website && websiteHref ? [{ icon: <Globe size={20} aria-hidden />, k: "Website", v: <a href={websiteHref} target="_blank" rel="noopener noreferrer">{website}</a> }] : []),
    ...(instagram ? [{ icon: <InstagramLogo size={20} aria-hidden />, k: "Instagram", v: <a href={`https://instagram.com/${instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">@{instagram.replace(/^@/, "")}</a> }] : []),
    { icon: <CalendarBlank size={20} aria-hidden />, k: "Joined", v: joined },
    ...(category ? [{ icon: <Storefront size={20} aria-hidden />, k: "Type", v: category }] : []),
  ];
  return <ul className="pf-about">{rows.map((r) => <li key={r.k}>{r.icon}<span className="pf-about-k">{r.k}</span><span style={{ minWidth: 0 }}>{r.v}</span></li>)}</ul>;
}
