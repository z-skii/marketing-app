/**
 * Every paid placement opens through /go/[placementId] so the click can be
 * qualified and billed server-side. We never link straight to the destination,
 * and we never let the browser prefetch or preconnect to it.
 *
 * Showcase rows have no placement — they carry `placementId: null` with a
 * `slug`, and leave through the free, unbilled /x/[slug] route instead.
 *
 * `label` may be empty for the compact icon-only form in dense rows — the link
 * still carries an accessible name naming what it opens. `surface` tags which
 * part of the live screen produced the click, for product learning only; it
 * never affects billing.
 */
import { OpenArrowIcon } from "@/components/icons";

export function OpenButton({
  placementId,
  slug,
  className = "btn",
  label = "Open",
  accessibleName,
  surface,
}: {
  placementId: string | null;
  /** Required when placementId can be null (a showcase row). */
  slug?: string;
  className?: string;
  label?: string;
  accessibleName?: string;
  surface?: "spot" | "top3" | "board" | "bar" | "surprise" | "profile";
}) {
  const name = accessibleName ?? (label ? undefined : "Open link");
  const base = placementId ? `/go/${placementId}` : `/x/${slug ?? ""}`;
  const href = surface ? `${base}?s=${surface}` : base;

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
