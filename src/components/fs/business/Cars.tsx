import Link from "next/link";
import type { Car } from "@/lib/v2/marketplace";
import { placementLabel } from "@/components/v2/EarnCards";
import { formatMoney } from "@/components/fs/parts";

/**
 * Listed cars as physical advertising inventory, in Frame Shift: the real
 * photograph at 3:2, then a caption on the canvas stepped 12px in: the
 * vehicle, its city and named placements, and the recorded asking price.
 * Asking prices are what the owner asks; they are not campaign pay,
 * agreed offers or earnings. No installed artwork is ever drawn; a real
 * 3D model is only named here and opened in the car's own inspection.
 */
export function carName(c: Car) {
  return `${c.year} ${c.make} ${c.model}`;
}

export function askingLine(c: Car): string {
  const priced = c.zones.filter((z) => z.asking_cents != null);
  if (priced.length === 0) return "Asking price · to be agreed";
  if (priced.length === 1) return `Asking price · ${formatMoney(priced[0].asking_cents as number)} per month`;
  const min = Math.min(...priced.map((z) => z.asking_cents as number));
  return `Asking from ${formatMoney(min)} per month · ${priced.length} placements`;
}

export function zoneLine(c: Car): string {
  const zones = c.zones.map((z) => placementLabel(z.zone));
  if (zones.length === 0) return "No placement offered";
  if (zones.length <= 2) return zones.join(", ");
  return `${zones.slice(0, 2).join(", ")} +${zones.length - 2}`;
}

function Photo({ c, width, height, priority = false }: { c: Car; width: number | string; height: number | string; priority?: boolean }) {
  const still = c.stage.posterUrl ?? c.stage.photos[0]?.url ?? null;
  const name = carName(c);
  return (
    <span className="fs-media" style={{ display: "block", width, height, background: "var(--fs-underlay)" }}>
      {still ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={still} alt={`${c.owner_name}'s ${name}`} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : <span className="fs-video-fallback" style={{ background: "var(--fs-underlay)", color: "var(--fs-muted)" }}>No photo yet</span>}
      {c.stage.glbUrl && <span className="fs-media-caption">3D model</span>}
    </span>
  );
}

function Caption({ c }: { c: Car }) {
  const meta = [c.city, zoneLine(c)].filter(Boolean).join(" · ");
  return (
    <span style={{ display: "block", marginLeft: 12 }}>
      <span className="fs-t-task" style={{ display: "block", marginTop: 8 }}>{carName(c)}{c.color ? <span className="fs-t-meta"> · {c.color}</span> : null}</span>
      <span className="fs-t-meta" style={{ display: "block" }}>{meta}</span>
      <span className="fs-t-body fs-tnum" style={{ display: "block" }}>{askingLine(c)}</span>
      {c.stage.glbUrl && <span className="fs-t-meta" style={{ display: "block" }}>3D model available in the car&apos;s inspection</span>}
    </span>
  );
}

/** Desktop shelf item: 336x224 photo, caption stepped in. */
export function CarShelfItem({ c, priority }: { c: Car; priority?: boolean }) {
  return (
    <li style={{ flex: "0 0 336px", scrollSnapAlign: "start" }}>
      <Link href={`/business/cars/${c.id}`} style={{ display: "block" }} aria-label={`${carName(c)}, ${askingLine(c)}, open the car`}>
        <Photo c={c} width={336} height={224} priority={priority} />
        <Caption c={c} />
      </Link>
    </li>
  );
}

/** Phone or gallery item: the photo across the field at 3:2, caption stepped in. */
export function CarAssembly({ c, priority }: { c: Car; priority?: boolean }) {
  return (
    <li className="fs-car-assembly">
      <Link href={`/business/cars/${c.id}`} style={{ display: "block" }} aria-label={`${carName(c)}, ${askingLine(c)}, open the car`}>
        <Photo c={c} width="100%" height="auto" priority={priority} />
        <Caption c={c} />
      </Link>
    </li>
  );
}
