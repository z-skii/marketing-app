import { cn } from "@/lib/utils/cn";
import { formatPct } from "@/lib/utils/currency";

/** Compact KPI tile with a strong number. */
export function Stat({ label, value, sub, change, tone, className, size = "md" }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode; change?: number | null;
  tone?: "default" | "success" | "danger" | "warn"; className?: string; size?: "sm" | "md" | "lg";
}) {
  const toneCls = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "text-text";
  return (
    <div className={cn("card px-3.5 py-3 min-w-0", className)}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3 truncate">{label}</div>
      <div className={cn("tnum font-semibold leading-tight mt-1 truncate", size === "lg" ? "text-[26px]" : size === "sm" ? "text-[17px]" : "text-[22px]", toneCls)}>{value}</div>
      {(sub || change != null) && (
        <div className="mt-1 flex items-center gap-2 text-[12px] text-text-3">
          {change != null && <ChangePill value={change} />}
          {sub && <span className="truncate">{sub}</span>}
        </div>
      )}
    </div>
  );
}

export function ChangePill({ value, invert = false }: { value: number | null | undefined; invert?: boolean }) {
  if (value == null) return <span className="text-text-3">—</span>;
  const good = invert ? value < 0 : value > 0;
  const bad = invert ? value > 0 : value < 0;
  return (
    <span className={cn("tnum font-semibold", good && "text-success", bad && "text-danger", !good && !bad && "text-text-3")}>
      {formatPct(value, { signed: true })}
    </span>
  );
}

/** Label/value row used in summaries and confirmation panels. */
export function KV({ label, value, strong, className, tone }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean; className?: string; tone?: "success" | "danger" | "warn" }) {
  const toneCls = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : tone === "warn" ? "text-warn" : "";
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-1", className)}>
      <span className={cn("text-[13px]", strong ? "font-semibold text-text" : "text-text-2")}>{label}</span>
      <span className={cn("tnum", strong ? "text-[15px] font-semibold" : "text-[13.5px] font-medium", toneCls)}>{value}</span>
    </div>
  );
}
