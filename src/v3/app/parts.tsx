import type { ReactNode } from "react";
import { MediaPreview } from "@/components/v2/MediaPreview";

/**
 * The approved V3 object language on the signed in screens (docs/
 * design-lab-v3/screens/x-user-home.md and the propagation pass): a
 * photographic plane on the dark stage with the product identity tagged
 * on it, and its terms attached beneath as opaque paper. These parts
 * render real records only; every value comes from the caller.
 */

/** Whole dollars when the amount is whole, cents otherwise: "$75", "$12.50". */
export function moneyWhole(cents: number): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(cents / 100);
}

/** A plane: the media (still or short video preview) with its tags. `fallback` names what is missing when there is no file. */
export function PlaneMedia({ src, poster, alt, sizes, priority = false, tag, tagBr, fallback = "No media" }: { src: string | null; poster?: string | null; alt: string; sizes?: string; priority?: boolean; tag?: ReactNode; tagBr?: ReactNode; fallback?: string }) {
  return (
    <>
      {src ? <MediaPreview src={src} poster={poster ?? undefined} alt={alt} className="xs-plane-media" priority={priority} sizes={sizes} /> : <span className="xs-plane-empty" role="img" aria-label={`${alt}: ${fallback}`}>{fallback}</span>}
      {tag && <span className="x-tag xs-tag">{tag}</span>}
      {tagBr && <span className="x-tag xs-tag xs-tag-br">{tagBr}</span>}
    </>
  );
}
