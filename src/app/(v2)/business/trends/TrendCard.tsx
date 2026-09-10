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
        <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">{PLATFORM[trend.platform] ?? "Web"}</span>
        {trend.source === "fixture" && <span className="glass-tag absolute top-3 right-3 px-2.5 py-1 text-xs text-ink-faint">Development fixture</span>}
        <div className="absolute inset-x-4 bottom-4">
          <h3 className="line-clamp-2 font-display text-[1.375rem] leading-[1.1] font-800 tracking-[-0.02em] text-ink">{trend.title}</h3>
          <p className="mt-1 flex items-center gap-x-3 text-sm text-ink-soft">
            {v && <span className="shrink-0 font-display font-700 text-ink">{v}</span>}
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
