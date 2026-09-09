import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "success" | "warn" | "danger" | "accent";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-text-2 border-border",
  success: "bg-success-soft text-success border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  accent: "bg-accent-soft text-accent border-transparent",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide leading-none whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

/** Maps domain statuses to badge tones + labels. */
export function statusBadge(kind: "report" | "shift" | "verification" | "expense" | "employment", value: string | null | undefined) {
  const v = value ?? "";
  const map: Record<string, { tone: BadgeTone; label: string }> = {
    "report:open": { tone: "warn", label: "Open" },
    "report:closed": { tone: "success", label: "Closed ✓" },
    "report:": { tone: "neutral", label: "No data" },
    "shift:active": { tone: "accent", label: "Working" },
    "shift:completed": { tone: "neutral", label: "Completed" },
    "shift:cancelled": { tone: "neutral", label: "Cancelled" },
    "verification:verified": { tone: "success", label: "Verified ✓" },
    "verification:location_issue": { tone: "warn", label: "Location issue" },
    "verification:missing_photo": { tone: "warn", label: "Missing photo" },
    "verification:needs_review": { tone: "warn", label: "Needs review" },
    "verification:manager_adjusted": { tone: "accent", label: "Manager adjusted" },
    "verification:manual": { tone: "neutral", label: "Manual entry" },
    "verification:unverified": { tone: "neutral", label: "Unverified" },
    "expense:paid": { tone: "success", label: "Paid" },
    "expense:expected": { tone: "warn", label: "Expected" },
    "employment:active": { tone: "success", label: "Active" },
    "employment:inactive": { tone: "neutral", label: "Inactive" },
    "employment:terminated": { tone: "danger", label: "Terminated" },
  };
  return map[`${kind}:${v}`] ?? { tone: "neutral" as BadgeTone, label: v || "—" };
}

export function StatusBadge({ kind, value, className }: { kind: Parameters<typeof statusBadge>[0]; value: string | null | undefined; className?: string }) {
  const s = statusBadge(kind, value);
  return <Badge tone={s.tone} className={className}>{s.label}</Badge>;
}
