import Link from "next/link";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AttentionItem } from "./types";

export function AttentionList({ items, className, emptyLabel }: { items: AttentionItem[]; className?: string; emptyLabel?: string }) {
  if (items.length === 0) {
    return emptyLabel ? <div className={cn("text-[12.5px] text-success", className)}>✓ {emptyLabel}</div> : null;
  }
  return (
    <ul className={cn("space-y-1", className)}>
      {items.map((a, i) => (
        <li key={`${a.kind}-${a.shift_id ?? i}`} className={cn("flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-[12.5px]",
          a.severity === "warn" ? "border-warn/30 bg-warn-soft text-warn" : "border-border bg-surface-2 text-text-2")}>
          {a.severity === "warn" ? <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
          <span className="min-w-0 flex-1">{a.message}</span>
          {a.shift_id && <Link href={`/shifts/${a.shift_id}`} className="shrink-0 underline underline-offset-2 hover:opacity-80">View shift</Link>}
        </li>
      ))}
    </ul>
  );
}
