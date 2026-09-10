import Link from "next/link";
import type { Car } from "@/lib/v2/marketplace";
import { NoPhoto, placementLabel } from "@/components/v2/EarnCards";
import { Money } from "@/components/v2/ui";
import { VehicleStage } from "@/components/v2/vehicle/VehicleStage";

/**
 * One car a business can advertise on. The car is the tile at 4:3: the
 * reconstructed model when one exists, else the owner's best photo. Money
 * sits on the picture. Under it: the car, city and miles, up to three
 * placements, one action. No box around it.
 */
export function CarCard({ car, index = 0, rail = false }: { car: Car; index?: number; rail?: boolean }) {
  const name = `${car.year} ${car.make} ${car.model}`;
  const href = `/business/cars/${car.id}`;
  const still = car.stage.posterUrl ?? car.stage.photos[0]?.url ?? null;
  const zones = car.zones.slice(0, 3).map((z) => placementLabel(z.zone)).join(" / ");
  const metaLine = [car.city, car.monthly_miles ? `~${car.monthly_miles.toLocaleString()} mi/mo` : null, zones || null].filter(Boolean).join(" · ");
  const copy = (
    <div className="absolute inset-x-4 bottom-[15px] z-[2] min-w-0">
      {car.from_cents != null && <div className="mb-px"><Money cents={car.from_cents} size="lg" suffix="/mo" /></div>}
      <h3 className="mb-1 truncate font-display text-[20px] leading-[1.15] font-[760] tracking-[-0.6px] text-ink">{name}</h3>
      {metaLine && <p className="truncate text-[13px] text-meta">{metaLine}</p>}
    </div>
  );
  const threeD = Boolean(car.stage.glbUrl);

  return (
    <article className={`card reveal group min-w-0 overflow-hidden ${rail ? "w-[18rem] shrink-0 snap-start md:w-[24rem]" : ""}`} style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
      <Link href={href} aria-label={`View ${name}`} className="block">
        <div className="relative h-[215px] w-full overflow-hidden bg-surface-2 lg:h-[260px]">
          {threeD ? (
            <VehicleStage glbUrl={car.stage.glbUrl} posterUrl={car.stage.posterUrl} photos={car.stage.photos} label={car.stage.label} fill />
          ) : still ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={still} alt="" className="hero-media absolute inset-0 h-full w-full object-cover" loading={index < 3 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" />
          ) : (
            <NoPhoto name={`${car.make} ${car.model}`} logo={null} />
          )}
          <div className="media-scrim pointer-events-none absolute inset-0" aria-hidden />
          {copy}
        </div>
      </Link>
    </article>
  );
}
