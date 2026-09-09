"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { RANGE_PRESETS, type RangePreset } from "@/lib/utils/time";

function useSetParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return React.useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k); else next.set(k, v);
    }
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }, [router, pathname, params]);
}

/** Consistent date filter: presets + custom range. State lives in the URL (?range=&from=&to=). */
export function DateRangeBar({ presets = RANGE_PRESETS.map((p) => p.value), className }: { presets?: RangePreset[]; className?: string }) {
  const params = useSearchParams();
  const set = useSetParams();
  const current = (params.get("range") as RangePreset) || presets[0];
  const [from, setFrom] = React.useState(params.get("from") ?? "");
  const [to, setTo] = React.useState(params.get("to") ?? "");
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="inline-flex rounded-md border border-border bg-surface p-0.5 overflow-x-auto max-w-full scrollbar-thin">
        {RANGE_PRESETS.filter((p) => presets.includes(p.value)).map((p) => (
          <button key={p.value} type="button" onClick={() => set({ range: p.value })}
            className={cn("px-2.5 py-1 text-[12.5px] rounded whitespace-nowrap", current === p.value ? "bg-accent text-white font-medium" : "text-text-2 hover:bg-surface-2")}>
            {p.label}
          </button>
        ))}
      </div>
      {current === "custom" && (
        <form className="flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); set({ range: "custom", from, to }); }}>
          <input type="date" className="field w-auto py-1" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-text-3">–</span>
          <input type="date" className="field w-auto py-1" value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="h-7.5 px-2.5 rounded-md bg-accent text-white text-[12.5px]">Apply</button>
        </form>
      )}
    </div>
  );
}

/** Consistent store selector. ?location=<id> or all. */
export function StoreSelect({ locations, allowAll = true, paramKey = "location", className, value, onChange }: {
  locations: Array<{ id: string; name: string }>; allowAll?: boolean; paramKey?: string; className?: string;
  value?: string; onChange?: (id: string) => void;
}) {
  const params = useSearchParams();
  const set = useSetParams();
  const current = value ?? params.get(paramKey) ?? (allowAll ? "" : locations[0]?.id ?? "");
  return (
    <select className={cn("field w-auto py-1 pr-7", className)} value={current}
      onChange={(e) => (onChange ? onChange(e.target.value) : set({ [paramKey]: e.target.value || null }))}>
      {allowAll && <option value="">All stores</option>}
      {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
    </select>
  );
}

export function ParamSelect({ paramKey, options, className, placeholder }: { paramKey: string; options: Array<{ value: string; label: string }>; className?: string; placeholder?: string }) {
  const params = useSearchParams();
  const set = useSetParams();
  return (
    <select className={cn("field w-auto py-1 pr-7", className)} value={params.get(paramKey) ?? ""} onChange={(e) => set({ [paramKey]: e.target.value || null })}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/** Day stepper: ‹ Sep 8 › with a native date input. */
export function DateStepper({ date, onChange, className, max }: { date: string; onChange: (d: string) => void; className?: string; max?: string }) {
  const shift = (n: number) => {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + n);
    onChange(d.toISOString().slice(0, 10));
  };
  return (
    <div className={cn("inline-flex items-center rounded-md border border-border bg-surface", className)}>
      <button type="button" className="px-2 py-1 text-text-2 hover:bg-surface-2 rounded-l-md" onClick={() => shift(-1)} aria-label="Previous day">‹</button>
      <input type="date" className="bg-transparent px-1 py-1 text-[13px] focus:outline-none" value={date} max={max} onChange={(e) => e.target.value && onChange(e.target.value)} />
      <button type="button" className="px-2 py-1 text-text-2 hover:bg-surface-2 rounded-r-md disabled:opacity-40" onClick={() => shift(1)} disabled={!!max && date >= max} aria-label="Next day">›</button>
    </div>
  );
}
