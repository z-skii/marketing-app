import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Images, MapPin, Play, SealCheck, Star } from "@phosphor-icons/react/dist/ssr";
import { InspectButton } from "@/components/fs/SourceInspector";
import { Logo, isVideo } from "@/components/fs/work/DetailKit";

/**
 * Profile pieces shared by the creator's own profile, the public profile
 * and the business's view of a person: the identity head, the stats row,
 * skill chips, the work grid, recent work rows, the reputation module and
 * reviews. Every value is passed in from a real record; a module that
 * has nothing to show is not rendered.
 */
export function ProfileHead({ avatar, name, handle, city, verified, bio, actions, badges }: {
  avatar: string | null; name: string; handle: string; city: string | null; verified: boolean; bio: string | null; actions?: ReactNode; badges?: ReactNode;
}) {
  return (
    <header className="pf-side-inner">
      <div className="pf-head">
        <span className="pf-avatar">{avatar
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={avatar} alt={`${name}, profile photo`} loading="eager" fetchPriority="high" />
          : <span aria-hidden>{name.trim()[0]?.toUpperCase() ?? "?"}</span>}</span>
        <div style={{ minWidth: 0 }}>
          <h1 className="pf-name">{name}</h1>
          <p className="pf-handle">@{handle}</p>
          <p className="pf-line">
            {city && <span><MapPin size={14} aria-hidden />{city}</span>}
            {verified && <span className="is-verified"><SealCheck size={14} weight="fill" aria-hidden />Verified</span>}
            {badges}
          </p>
        </div>
      </div>
      {bio && <p className="pf-bio">{bio}</p>}
      {actions && <div className="pf-actions">{actions}</div>}
    </header>
  );
}

export type Stat = { v: string; l: string; star?: boolean };
export function StatsRow({ items }: { items: Stat[] }) {
  if (items.length === 0) return null;
  return (
    <dl className="pf-stats" aria-label="Stats">
      {items.map((s) => <div key={s.l} className="pf-stat"><dd><b>{s.v}{s.star && <Star size={16} weight="fill" aria-hidden />}</b></dd><dt><span>{s.l}</span></dt></div>)}
    </dl>
  );
}

export function Chips({ items }: { items: { label: string; icon?: ReactNode }[] }) {
  if (items.length === 0) return null;
  return <ul className="pf-chips" aria-label="Does">{items.map((c) => <li key={c.label} className="pf-chip">{c.icon}{c.label}</li>)}</ul>;
}

export type WorkTile = { url: string; title: string; kind: "approved" | "portfolio"; tag?: string };
/** The portfolio grid: the first tile large, video with a play mark, tap opens the file. */
export function WorkGrid({ items, owner, emptyHref, emptyLabel = "Add work" }: { items: WorkTile[]; owner: string; emptyHref?: string; emptyLabel?: string }) {
  if (items.length === 0) {
    return (
      <div className="pf-empty">
        <Images size={28} aria-hidden />
        <b>No work yet</b>
        <span>Approved work and portfolio pieces show here.</span>
        {emptyHref && <Link href={emptyHref} className="btn btn-sm" style={{ marginTop: 4 }}>{emptyLabel} <ArrowRight size={16} aria-hidden /></Link>}
      </div>
    );
  }
  return (
    <div className="pf-grid" role="list" aria-label="Work">
      {items.map((w, i) => (
        <InspectButton key={`${w.url}-${i}`} src={w.url} alt={`${w.title}, ${w.kind === "approved" ? "approved work" : "portfolio"} by ${owner}`} label={w.title} className={`pf-tile${i === 0 && items.length > 2 ? " is-lead" : ""}`} icon={false}>
          {isVideo(w.url)
            ? <video src={w.url} muted playsInline preload="metadata" aria-hidden />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={w.url} alt="" loading={i < 3 ? "eager" : "lazy"} />}
          {isVideo(w.url) && <span className="dt-play" aria-hidden><span><Play size={22} weight="fill" /></span></span>}
          {(w.tag ?? (w.kind === "approved" ? "Approved" : null)) && <span className="glass-tag">{w.tag ?? "Approved"}</span>}
        </InspectButton>
      ))}
    </div>
  );
}

export type RecentRow = { id: string; logo: string | null; business: string; kind: string; status: string; tone: "success" | "warning" | "info" | "alert" | "neutral"; amount: string; href?: string };
export function RecentWork({ rows }: { rows: RecentRow[] }) {
  if (rows.length === 0) return null;
  return (
    <ul className="pf-rows">
      {rows.map((r) => {
        const inner = (
          <>
            <Logo src={r.logo} name={r.business} />
            <span style={{ minWidth: 0 }}><b>{r.business}</b><span className="pf-row-sub">{r.kind} · <span className={r.tone === "neutral" ? undefined : `badge is-${r.tone}`} style={{ verticalAlign: "1px" }}>{r.status}</span></span></span>
            <span className="pf-row-amt">{r.amount}</span>
          </>
        );
        return <li key={r.id}>{r.href ? <Link href={r.href} className="pf-row">{inner}</Link> : <div className="pf-row">{inner}</div>}</li>;
      })}
    </ul>
  );
}

export function Reputation({ rating, reviews, completed }: { rating: number | null; reviews: number; completed: number }) {
  if (reviews === 0 || rating == null) return null;
  return (
    <div className="pf-rep" aria-label="Reputation">
      <div><b>{rating.toFixed(1)} <Star size={16} weight="fill" aria-hidden style={{ color: "var(--tm-warning)", verticalAlign: "-1px" }} /></b><span>Rating</span></div>
      <div><b>{reviews}</b><span>{reviews === 1 ? "Review" : "Reviews"}</span></div>
      <div><b>{completed}</b><span>Completed</span></div>
    </div>
  );
}

export function Reviews({ items }: { items: { rating: number; body: string | null; created_at: string; business_name: string | null }[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      {items.map((r, i) => (
        <div key={i} className="pf-review">
          <p className="pf-review-head"><b>{r.rating}<Star size={12} weight="fill" aria-hidden style={{ color: "var(--tm-warning)", marginLeft: 2, verticalAlign: "-1px" }} /></b>{r.business_name && <span>{r.business_name}</span>}<span>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></p>
          {r.body && <p>{r.body}</p>}
        </div>
      ))}
    </div>
  );
}

/** Skill chips derived from the record: the kinds of approved work, a listed car, a portfolio. Nothing invented. */
export function skillChips(input: { kinds: string[]; hasCar: boolean; hasPortfolio: boolean; instagram: boolean }, icons: { reel: ReactNode; story: ReactNode; car: ReactNode; photo: ReactNode; instagram: ReactNode }) {
  const out: { label: string; icon?: ReactNode }[] = [];
  if (input.kinds.includes("recreate_reel")) out.push({ label: "Reels", icon: icons.reel });
  if (input.kinds.includes("instagram_story")) out.push({ label: "Stories", icon: icons.story });
  if (input.kinds.includes("car_ads") || input.hasCar) out.push({ label: "Cars", icon: icons.car });
  if (input.hasPortfolio) out.push({ label: "Portfolio", icon: icons.photo });
  if (input.instagram) out.push({ label: "Instagram", icon: icons.instagram });
  return out;
}
