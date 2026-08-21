/**
 * Every paid placement opens through /go/[placementId] so the click can be
 * qualified and billed server-side. We never link straight to the destination,
 * and we never let the browser prefetch or preconnect to it.
 *
 * `label` may be empty for the compact icon-only form in dense rows — the link
 * still carries an accessible name naming what it opens.
 */
export function OpenButton({
  placementId,
  className = "btn",
  label = "Open",
  accessibleName,
}: {
  placementId: string;
  className?: string;
  label?: string;
  accessibleName?: string;
}) {
  const name = accessibleName ?? (label ? undefined : "Open link");

  return (
    <a
      href={`/go/${placementId}`}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      className={className}
      aria-label={name}
    >
      {label}
      <span aria-hidden="true">↗</span>
    </a>
  );
}
