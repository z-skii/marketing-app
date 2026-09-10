"use client";

import { useState, useTransition } from "react";
import { ArrowSquareOut, TrendUp } from "@phosphor-icons/react";
import type { TrendItem } from "@/lib/trends/types";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { dismissTrend, startRecreateFromTrend } from "./actions";

const PLATFORM: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", other: "Web" };

function views(n: number | null) {
  if (n == null) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K views`;
  return `${n} views`;
}

/**
 * One trend: the media, a title, a real number when there is one, and one
 * button. "Recreate this" prepares a brief and opens the campaign wizard.
 */
export function TrendCard({ trend, large = false, index = 0 }: { trend: TrendItem; large?: boolean; index?: number }) {
  const [gone, setGone] = useState(false);
  const [pending, start] = useTransition();
  if (gone) return null;
  const media = trend.media_url ?? trend.thumbnail_url;
  const v = views(trend.views);

  return (
    <article className="reveal relative overflow-hidden rounded-[var(--radius-card)] bg-surface" style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}>
      <div className={`relative w-full overflow-hidden bg-surface-2 ${large && media ? "aspect-[4/5] lg:aspect-[16/10]" : media ? "aspect-[16/10]" : "aspect-[16/7]"}`}>
        {media ? (
          <MediaPreview src={media} className="absolute inset-0 h-full w-full object-cover" priority={large} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-faint"><TrendUp size={40} aria-hidden /></div>
        )}
        <div className="media-scrim absolute inset-x-0 bottom-0 h-3/5" aria-hidden />
        <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-600 text-ink">{PLATFORM[trend.platform] ?? "Web"}</span>
        {trend.source === "fixture" && <span className="glass-tag absolute top-3 right-3 px-2.5 py-1 text-xs text-ink-faint">Development fixture</span>}
        <div className="absolute inset-x-4 bottom-4">
          <h3 className="line-clamp-2 font-display text-[1.375rem] leading-[1.1] font-700 tracking-[-0.02em] text-ink">{trend.title}</h3>
          <p className="mt-1 flex items-center gap-x-3 text-sm text-ink-soft">
            {v && <span className="shrink-0 font-display font-600 text-ink">{v}</span>}
            {trend.growth_note && <span className="flex shrink-0 items-center gap-1"><TrendUp size={14} aria-hidden />{trend.growth_note}</span>}
            {trend.fit_note && <span className="truncate">{trend.fit_note}</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3">
        <button
          type="button" className="btn btn-signal flex-1" disabled={pending}
          onClick={() => start(() => startRecreateFromTrend(trend.id).catch(() => {}))}
        >
          {pending ? "Preparing your brief" : "Recreate this"}
        </button>
        {trend.reference_url && (
          <a href={trend.reference_url} target="_blank" rel="noreferrer" className="btn" aria-label="Open the original">
            <ArrowSquareOut size={20} aria-hidden />
          </a>
        )}
        {!trend.id.startsWith("fixture-") && (
          <button type="button" className="btn btn-ghost" onClick={() => { setGone(true); start(() => dismissTrend(trend.id).then(() => {})); }}>
            Not for me
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * A compact tile for a rail: the media, the platform chip, a two line
 * title. One tap prepares the brief and opens the Recreate wizard.
 */
export function TrendTile({ trend, index = 0 }: { trend: TrendItem; index?: number }) {
  const [pending, start] = useTransition();
  const media = trend.media_url ?? trend.thumbnail_url;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => startRecreateFromTrend(trend.id).catch(() => {}))}
      className="reveal relative block aspect-[3/4] w-[9.75rem] shrink-0 snap-start overflow-hidden rounded-[14px] bg-surface-2 text-left transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] can-hover:hover:-translate-y-1 disabled:opacity-70"
      style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}
      aria-label={`Recreate: ${trend.title}`}
    >
      {media ? (
        <MediaPreview src={media} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-ink-faint"><TrendUp size={32} aria-hidden /></span>
      )}
      <span className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
      <span className="glass-tag absolute top-2.5 left-2.5 px-2 py-0.5 font-display text-[0.6875rem] font-600 text-ink">{PLATFORM[trend.platform] ?? "Web"}</span>
      <span className="absolute inset-x-3 bottom-3 line-clamp-2 font-display text-[0.9375rem] leading-[1.15] font-700 tracking-[-0.01em] text-ink">
        {pending ? "Preparing your brief" : trend.title}
      </span>
    </button>
  );
}
