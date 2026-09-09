"use client";
import * as React from "react";
import { formatMoneyCompact } from "@/lib/utils/currency";

export interface SeriesPoint { label: string; date: string; sales: number; profit: number; expenses?: number }

/**
 * Sales / profit line chart. Plain SVG, no dependency. Reads the theme tokens so it works in dark mode.
 */
export function SalesProfitChart({ data, height = 220, currency = "USD" }: { data: SeriesPoint[]; height?: number; currency?: string }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const ref = React.useRef<SVGSVGElement>(null);
  if (data.length === 0) return <div className="h-[220px] flex items-center justify-center text-text-3 text-[13px]">No data for this period</div>;

  const W = 800, H = height, padL = 48, padR = 12, padT = 12, padB = 26;
  const max = Math.max(1, ...data.map((d) => Math.max(d.sales, d.profit, d.expenses ?? 0)));
  const min = Math.min(0, ...data.map((d) => d.profit));
  const x = (i: number) => padL + (i * (W - padL - padR)) / Math.max(1, data.length - 1);
  const y = (v: number) => padT + (H - padT - padB) * (1 - (v - min) / (max - min || 1));
  const path = (key: "sales" | "profit") => data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");
  const area = `${path("sales")} L${x(data.length - 1).toFixed(1)},${y(min)} L${x(0).toFixed(1)},${y(min)} Z`;
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => min + ((max - min) * i) / ticks);
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = ref.current; if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const px = ((clientX - rect.left) / rect.width) * W;
    let best = 0, bd = Infinity;
    data.forEach((_, i) => { const d = Math.abs(x(i) - px); if (d < bd) { bd = d; best = i; } });
    setHover(best);
  };
  const h = hover != null ? data[hover] : null;

  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" onMouseMove={onMove} onMouseLeave={() => setHover(null)} onTouchMove={onMove} onTouchEnd={() => setHover(null)}>
        <defs>
          <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {tickVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth="1" />
            <text x={padL - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--text-3)">{formatMoneyCompact(v, currency)}</text>
          </g>
        ))}
        <path d={area} fill="url(#salesFill)" />
        <path d={path("sales")} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
        <path d={path("profit")} fill="none" stroke="var(--success)" strokeWidth="2" strokeLinejoin="round" />
        {data.map((d, i) => (i % labelEvery === 0 || i === data.length - 1) && (
          <text key={d.date} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-3)">{d.label}</text>
        ))}
        {h && hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="var(--border-strong)" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(h.sales)} r="4" fill="var(--accent)" />
            <circle cx={x(hover)} cy={y(h.profit)} r="4" fill="var(--success)" />
          </g>
        )}
      </svg>
      <div className="flex items-center gap-4 text-[11.5px] text-text-3 px-1 mt-1">
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-accent" /> Sales</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-success" /> Profit</span>
        {h && <span className="ml-auto tnum text-text-2">{h.label}: <b>{formatMoneyCompact(h.sales, currency)}</b> sales · <b>{formatMoneyCompact(h.profit, currency)}</b> profit</span>}
      </div>
    </div>
  );
}

/** Horizontal bar list (rankings). */
export function BarList({ items, currency = "USD" }: { items: Array<{ label: string; value: number; sub?: string }>; currency?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.label}>
          <div className="flex justify-between text-[12.5px]"><span className="truncate">{it.label}</span><span className="tnum font-medium">{formatMoneyCompact(it.value, currency)}</span></div>
          <div className="h-1.5 rounded bg-surface-2 mt-1"><div className="h-1.5 rounded bg-accent" style={{ width: `${(Math.max(0, it.value) / max) * 100}%` }} /></div>
          {it.sub && <div className="text-[11px] text-text-3 mt-0.5">{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}
