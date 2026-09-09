import { Badge, StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

/** Verification status pill (Verified ✓ / Location issue / Missing photo / Needs review / ...). */
export function VerificationBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  return <StatusBadge kind="verification" value={status} className={className} />;
}

const FLAG_LABELS: Record<string, string> = {
  repeat_photo: "Repeat photo",
  low_accuracy: "Low GPS accuracy",
  no_location: "No location",
};

/** Small warn badges for verification flags such as repeat_photo / low_accuracy / no_location. */
export function FlagBadges({ flags, className }: { flags: string[] | null | undefined; className?: string }) {
  if (!flags || flags.length === 0) return null;
  return (
    <span className={cn("inline-flex flex-wrap gap-1", className)}>
      {flags.map((f) => (
        <Badge key={f} tone="warn">{FLAG_LABELS[f] ?? f.replace(/_/g, " ")}</Badge>
      ))}
    </span>
  );
}

/** Plain-language explanation of a verification status, for employees and managers. */
export function verificationHint(status: string | null | undefined): string | null {
  switch (status) {
    case "verified": return "Photo taken live and location inside the store radius.";
    case "location_issue": return "Location was outside the store radius or unavailable. A manager will review.";
    case "missing_photo": return "No live photo was captured. A manager will review.";
    case "needs_review": return "This photo matched an earlier one. A manager will review.";
    case "manager_adjusted": return "A manager corrected the times on this shift.";
    case "manual": return "Entered manually by a manager.";
    default: return null;
  }
}
