/**
 * Every paid placement opens through /go/[placementId] so the click can be
 * qualified and billed server-side. We never link straight to the destination,
 * and we never let the browser prefetch or preconnect to it.
 *
 * `label` may be empty for the compact icon-only form in dense rows — the link
 * still carries an accessible name naming what it opens. `surface` tags which
 * part of the live screen produced the click, for product learning only; it
 * never affects billing.
 */
import { OpenArrowIcon } from "@/components/icons";

export function OpenButton({
  placementId,
  className = "btn",
  label = "Open",
  accessibleName,
  surface,
}: {
  placementId: string;
  className?: string;
  label?: string;
  accessibleName?: string;
  surface?: "spot" | "top3" | "board" | "bar" | "surprise" | "profile";
}) {
  const name = accessibleName ?? (label ? undefined : "Open link");
  const href = surface ? `/go/${placementId}?s=${surface}` : `/go/${placementId}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      className={className}
      aria-label={name}
    >
      {label}
      <OpenArrowIcon />
    </a>
  );
}
