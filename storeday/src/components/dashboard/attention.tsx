import Link from "next/link";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { BriefItem, BriefItemKind, BriefSeverity } from "@/lib/brief/types";

/** Kinds that surface as small badges on the location cards. */
export const CARD_BADGE_KINDS: BriefItemKind[] = ["cash_short", "missing_closeout", "still_clocked_in", "outside_radius", "missing_closing_checklist", "store_not_opened"];

export const BADGE_LABELS: Partial<Record<BriefItemKind, string>> = {
  cash_short: "Cash short",
  missing_closeout: "Missing closeout",
  still_clocked_in: "Clocked in > 12h",
  outside_radius: "Outside radius",
  missing_closing_checklist: "No closing checklist",
  store_not_opened: "Not opened",
};

const toneFor: Record<BriefSeverity, BadgeTone> = { warn: "warn", info: "neutral", good: "success" };

export function AttentionBadges({ items, className }: { items: BriefItem[]; className?: string }) {
  const seen = new Set<string>();
  const badges = items.filter((i) => CARD_BADGE_KINDS.includes(i.kind)).filter((i) => { if (seen.has(i.kind)) return false; seen.add(i.kind); return true; });
  if (badges.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {badges.map((b) => (
        <Badge key={b.kind} tone={toneFor[b.severity]} className="normal-case tracking-normal font-medium">
          {BADGE_LABELS[b.kind] ?? b.message}
        </Badge>
      ))}
    </div>
  );
}

function SeverityIcon({ severity }: { severity: BriefSeverity }) {
  if (severity === "warn") return <AlertTriangle className="h-3.5 w-3.5 text-warn shrink-0 mt-0.5" />;
  if (severity === "good") return <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />;
  return <Info className="h-3.5 w-3.5 text-text-3 shrink-0 mt-0.5" />;
}

/** Compact list of attention items. Every row links to the place where it can be fixed. */
export function AttentionList({ items, emptyText = "Nothing needs your attention.", className }: { items: BriefItem[]; emptyText?: string; className?: string }) {
  if (items.length === 0) return <p className={cn("text-[13px] text-text-3 py-1", className)}>{emptyText}</p>;
  return (
    <ul className={cn("divide-y divide-border", className)}>
      {items.map((it, i) => {
        const body = (
          <span className="flex items-start gap-2 py-1.5 text-[13px]">
            <SeverityIcon severity={it.severity} />
            <span className={cn("min-w-0", it.severity === "warn" ? "text-text" : "text-text-2")}>{it.message}</span>
          </span>
        );
        return (
          <li key={`${it.kind}-${it.locationId ?? ""}-${it.shiftId ?? ""}-${i}`}>
            {it.href ? <Link href={it.href} className="block hover:bg-surface-2/60 -mx-1 px-1 rounded">{body}</Link> : body}
          </li>
        );
      })}
    </ul>
  );
}

/** OPEN / CLOSED / NOT OPENED pill derived from store_status. */
export function OpenStatusBadge({ openedAt, closedAt, working }: { openedAt: string | null; closedAt: string | null; working: number }) {
  if (working > 0 || (openedAt && !closedAt)) return <Badge tone="success">Open</Badge>;
  if (closedAt) return <Badge tone="neutral">Closed</Badge>;
  return <Badge tone="neutral">Not opened</Badge>;
}

export function CloseoutBadge({ status }: { status: "open" | "closed" | null | undefined }) {
  if (status === "closed") return <Badge tone="success">Completed ✓</Badge>;
  return <Badge tone="warn">Pending</Badge>;
}
