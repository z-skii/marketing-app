import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight, ArrowSquareOut, CaretRight, CheckCircle, Play, SealCheck, VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import { formatMoney } from "@/components/fs/parts";

/**
 * The pieces every detail screen is built from: a media hero with the
 * kind, the business and the pay on it; a row of icon facts; the action
 * card (pay first, one primary control); short step and check lists; a
 * stage timeline; accordions for everything that does not decide the
 * next tap; the business card. Server renderable, no data of their own.
 */
export const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
export const isVideo = (u: string | null | undefined): boolean => Boolean(u && VIDEO_RE.test(u));

export function Logo({ src, name, className = "ap-logo" }: { src: string | null; name: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={className} loading="lazy" />;
  }
  return <span className="ap-logo-initial" aria-hidden>{name.trim()[0]?.toUpperCase() ?? "?"}</span>;
}

export function PlayBadge({ small = false }: { small?: boolean }) {
  return <span className={`dt-play${small ? " is-sm" : ""}`} aria-hidden><span><Play size={small ? 16 : 22} weight="fill" /></span></span>;
}

/** Media on a stage: a 9:16 file sits on a blurred copy of itself so the hero fills the width; a Story sits inside a phone. */
export function HeroMedia({ src, poster, kind, alt, priority = false }: { src: string | null; poster?: string | null; kind: "reel" | "story"; alt: string; priority?: boolean }) {
  const video = isVideo(src);
  const still = video ? poster ?? null : src;
  const inner = !src
    ? <div className="fs-video-fallback">No file yet</div>
    : video
      ? <video src={src} poster={poster ?? undefined} controls playsInline preload="metadata" aria-label={alt} />
      // eslint-disable-next-line @next/next/no-img-element
      : <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} />;
  return (
    <div className="dt-hero-media">
      {still && <div className="dt-hero-blur" aria-hidden style={{ backgroundImage: `url(${still})` }} />}
      <div className="dt-hero-frame">
        {kind === "story" ? (
          <div className="dt-phone"><div className="dt-phone-screen">{inner}<span className="dt-phone-bar" aria-hidden /></div><span className="dt-phone-notch" aria-hidden /></div>
        ) : <div>{inner}</div>}
      </div>
    </div>
  );
}

export function Hero({ kind, chip, business, title, pay, per, children, top }: {
  kind: "reel" | "story" | "car"; chip: ReactNode; business: { name: string; logo: string | null; verified: boolean }; title: string; pay: number; per: string; children: ReactNode; top?: ReactNode;
}) {
  return (
    <section className={`dt-hero is-${kind}`} aria-label={title}>
      {children}
      <div className="dt-hero-scrim" aria-hidden />
      <div className="dt-hero-top"><span className="glass-tag">{chip}</span>{top}</div>
      <div className="dt-hero-foot">
        <div style={{ minWidth: 0 }}>
          <div className="dt-biz-line"><Logo src={business.logo} name={business.name} /><span className="truncate">{business.name}</span>{business.verified && <SealCheck size={16} weight="fill" aria-label="Verified business" style={{ color: "#8FE3B0", flexShrink: 0 }} />}</div>
          <h1 className="dt-hero-title">{title}</h1>
        </div>
        <span className="dt-pay"><b>{formatMoney(pay).replace(/\.00$/, "")}</b><span>{per}</span></span>
      </div>
    </section>
  );
}

export type Fact = { icon: ReactNode; value: string; label: string };
export function Facts({ items }: { items: Fact[] }) {
  return (
    <dl className="dt-facts" aria-label="Quick facts">
      {items.map((f) => <div key={f.label} className="dt-fact">{f.icon}<dd><b>{f.value}</b></dd><dt><span>{f.label}</span></dt></div>)}
    </dl>
  );
}

export function DSection({ title, children, id, meta }: { title: string; children: ReactNode; id?: string; meta?: ReactNode }) {
  return (
    <section className="dt-section" id={id} aria-labelledby={id ? `${id}-h` : undefined}>
      <h2 id={id ? `${id}-h` : undefined} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>{title}{meta && <span className="t-meta" style={{ fontWeight: 400 }}>{meta}</span>}</h2>
      {children}
    </section>
  );
}

export type Step = { text: string; sub?: string | null; icon?: ReactNode; frame?: string | null };
export function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="dt-steps">
      {steps.map((s, i) => (
        <li key={i} className="dt-step">
          <span className="dt-step-n" aria-hidden>
            {s.frame
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={s.frame} alt="" loading="lazy" />
              : s.icon ?? String(i + 1).padStart(2, "0")}
          </span>
          <span style={{ minWidth: 0 }}><b>{s.text}</b>{s.sub && <span className="dt-step-sub">{s.sub}</span>}</span>
        </li>
      ))}
    </ol>
  );
}

export type Check = { text: string; state?: "ok" | "warn" | "off" };
export function Checks({ items }: { items: (string | Check)[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="dt-checks">
      {items.map((raw, i) => {
        const c = typeof raw === "string" ? { text: raw } : raw;
        return <li key={i}><div className={`dt-check${c.state === "warn" ? " is-warn" : c.state === "off" ? " is-off" : ""}`}><CheckCircle size={20} weight="fill" aria-hidden /><span>{c.text}</span></div></li>;
      })}
    </ul>
  );
}

/** Where the work stands. `now` is the current stage (0 based); stages before it are done; -1 means not started; past the end means all done. */
export function Timeline({ stages, now, warn = false, label = "Progress" }: { stages: string[]; now: number; warn?: boolean; label?: string }) {
  const current = Math.min(now, stages.length - 1);
  return (
    <div className="dt-timeline" role="img" aria-label={now >= stages.length ? `${label}: complete` : now < 0 ? `${label}: not started` : `${label}: ${stages[current]}, stage ${current + 1} of ${stages.length}`}>
      {stages.map((s, i) => <span key={s} className={`dt-tl${i < now ? " is-done" : i === now ? (warn ? " is-warn" : " is-now") : ""}`}><i aria-hidden />{s}</span>)}
    </div>
  );
}

export function Accordion({ title, meta, children, open = false }: { title: string; meta?: ReactNode; children: ReactNode; open?: boolean }) {
  return (
    <details className="dt-acc" open={open}>
      <summary>{title}{meta && <span className="dt-acc-meta">{meta}</span>}<span className="dt-acc-caret" aria-hidden><CaretRight size={16} weight="bold" /></span></summary>
      <div className="dt-acc-body">{children}</div>
    </details>
  );
}

export function BizCard({ name, logo, sub, href, verified = false, external = false }: { name: string; logo: string | null; sub: string; href: string; verified?: boolean; external?: boolean }) {
  return (
    <Link href={href} className="dt-biz" aria-label={`${name}, view profile`}>
      <Logo src={logo} name={name} />
      <span style={{ minWidth: 0 }}><b className="truncate" style={{ display: "flex", alignItems: "center", gap: 4 }}>{name}{verified && <SealCheck size={16} weight="fill" aria-label="Verified" style={{ color: "var(--tm-success)" }} />}</b><span className="dt-biz-sub">{sub}</span></span>
      <span className="dt-biz-go btn btn-sm">View {external ? <ArrowSquareOut size={16} aria-hidden /> : <ArrowRight size={16} aria-hidden />}</span>
    </Link>
  );
}

/** The action card: the pay, what is kept after the fee, three mini facts and the one control the state allows. */
export function ActionCard({ pay, per, net, feePct, facts, children, note, id = "work", status }: {
  pay: number; per: string; net: number; feePct: number; facts: { v: string; l: string }[]; children?: ReactNode; note?: ReactNode; id?: string; status?: ReactNode;
}) {
  return (
    <section className="dt-action" id={id} aria-label="Take this on" style={{ scrollMarginTop: 88 }}>
      {status && <div className="dt-state" style={{ marginBottom: 10 }}>{status}</div>}
      <div className="dt-action-pay"><b>{formatMoney(pay).replace(/\.00$/, "")}</b><span>{per}</span></div>
      <p className="dt-action-net">{formatMoney(net)} to you after the {feePct}% fee</p>
      {children}
      {note && <p className="dt-action-note">{note}</p>}
      {facts.length > 0 && <div className="dt-mini-facts">{facts.map((f) => <div key={f.l}><b>{f.v}</b><span>{f.l}</span></div>)}</div>}
    </section>
  );
}

/** A 9:16 thumbnail of the person's own file with a play mark for video. */
export function WorkThumbV({ src, alt }: { src: string | null; alt: string }) {
  return (
    <span className="dt-work-thumb">
      {!src ? <span className="fs-video-fallback" style={{ fontSize: 12 }}>No file</span>
        : isVideo(src) ? <><video src={src} muted playsInline preload="metadata" aria-label={alt} /><PlayBadge small /></>
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={src} alt={alt} loading="lazy" />}
    </span>
  );
}

export function RefRow({ src, poster, alt, originalHref, children }: { src: string | null; poster?: string | null; alt: string; originalHref?: string | null; children?: ReactNode }) {
  return (
    <div className="dt-ref">
      <span className="dt-ref-thumb">
        {!src ? <span className="fs-video-fallback" style={{ fontSize: 12 }}><VideoCamera size={20} aria-hidden />None</span>
          : isVideo(src)
            ? <><video src={src} poster={poster ?? undefined} muted playsInline preload="metadata" aria-label={alt} /><PlayBadge small /></>
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={src} alt={alt} loading="lazy" />}
      </span>
      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
        {children}
        {originalHref && <a href={originalHref} target="_blank" rel="noopener noreferrer" className="btn btn-sm">Open original <ArrowSquareOut size={16} aria-hidden /></a>}
      </div>
    </div>
  );
}
