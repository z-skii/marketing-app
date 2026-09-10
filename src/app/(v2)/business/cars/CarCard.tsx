import Link from "next/link";
import type { Car } from "@/lib/v2/marketplace";
import { formatCredit } from "@/lib/money";
import { NoPhoto, placementLabel } from "@/components/v2/EarnCards";
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
  const meta = [car.city, car.monthly_miles ? `${car.monthly_miles.toLocaleString()} mi/mo` : null].filter(Boolean).join("  ·  ");
  const money = car.from_cents != null ? (
    <span className="absolute bottom-3 left-3.5 md:bottom-4 md:left-4">
      <span className="block text-xs text-ink-soft">From</span>
      <span className="tnum block font-display text-[1.375rem] leading-none font-600 tracking-[-0.02em] text-signal">
        {formatCredit(car.from_cents)}<span className="text-[0.9375rem] font-600 text-ink-soft"> / mo</span>
      </span>
    </span>
  ) : null;
  const threeD = Boolean(car.stage.glbUrl);

  return (
    <article className={`card reveal group min-w-0 overflow-hidden ${rail ? "w-[18rem] shrink-0 snap-start md:w-[24rem]" : ""}`} style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
      <Link href={href} aria-label={`View ${name}`} className="block">
        {threeD ? (
          <VehicleStage glbUrl={car.stage.glbUrl} posterUrl={car.stage.posterUrl} photos={car.stage.photos} label={car.stage.label} compact>
            {money}
          </VehicleStage>
        ) : (
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
            {still ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={still} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out can-hover:group-hover:scale-[1.03]" loading={index < 3 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" />
            ) : (
              <NoPhoto name={`${car.make} ${car.model}`} logo={null} />
            )}
            <div className="media-scrim absolute inset-x-0 bottom-0 h-3/5" aria-hidden />
            {money}
          </div>
        )}
      </Link>
      <div className="min-w-0 px-3.5 pt-3 pb-3.5">
        <p className="truncate font-display text-[1rem] leading-[1.3] font-600 tracking-[-0.01em]">{name}</p>
        {meta && <p className="tnum mt-0.5 truncate text-sm text-ink-soft">{meta}</p>}
        {car.zones.length > 0 && (
          <p className="mt-0.5 truncate text-[0.8125rem] text-ink-faint">
            {car.zones.slice(0, 3).map((z) => placementLabel(z.zone)).join("  ·  ")}
          </p>
        )}
        <Link href={href} className="btn btn-sm mt-3 w-full">View car</Link>
      </div>
    </article>
  );
}
