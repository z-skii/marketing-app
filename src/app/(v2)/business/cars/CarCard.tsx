import Link from "next/link";
import type { Car } from "@/lib/v2/marketplace";
import { formatCredit } from "@/lib/money";
import { Chip } from "@/components/v2/ui";
import { NoPhoto, placementLabel } from "@/components/v2/EarnCards";
import { VehicleStage } from "@/components/v2/vehicle/VehicleStage";

/**
 * One car a business can advertise on. Two sizes: `rail` is the compact
 * still for the horizontal rail on Business Home; the default puts the car
 * on stage (3D, photo turntable or a still). Vehicle, city, mileage, up to
 * three placements, one action.
 */
export function CarCard({ car, index = 0, rail = false }: { car: Car; index?: number; rail?: boolean }) {
  const name = `${car.year} ${car.make} ${car.model}`;
  const href = `/business/cars/${car.id}`;
  const still = car.stage.posterUrl ?? car.stage.photos[0]?.url ?? null;
  const meta = [car.city ?? "City not set", car.monthly_miles ? `~${car.monthly_miles.toLocaleString()} mi/month` : null].filter(Boolean).join("  ·  ");
  const money = car.from_cents != null ? (
    <span className="glass-tag absolute right-3 bottom-3 px-2.5 py-1 font-display text-xs font-700 text-ink">
      <span className="text-ink-soft">from </span><span className="tnum text-signal">{formatCredit(car.from_cents)}</span><span className="text-ink-soft"> / mo</span>
    </span>
  ) : null;

  return (
    <article className={`reveal ${rail ? "w-[16.5rem] shrink-0 snap-start" : ""}`} style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
      <Link href={href} aria-label={`View ${name}`} className="block">
        {rail || (!car.stage.glbUrl && car.stage.photos.length < 2) ? (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-card)] bg-surface-2">
            {still ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={still} alt="" className="absolute inset-0 h-full w-full object-cover" loading={index < 2 ? "eager" : "lazy"} decoding="async" />
            ) : (
              <NoPhoto name={`${car.make} ${car.model}`} logo={null} />
            )}
            {car.stage.label && <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">{car.stage.label}</span>}
            {money}
          </div>
        ) : (
          <VehicleStage glbUrl={car.stage.glbUrl} posterUrl={car.stage.posterUrl} photos={car.stage.photos} label={car.stage.label} compact>
            {money}
          </VehicleStage>
        )}
      </Link>
      <div className="mt-3 min-w-0">
        <p className="truncate font-display text-[1.125rem] leading-none font-800 tracking-[-0.02em]">{name}</p>
        <p className="mt-1.5 truncate text-sm text-ink-faint">{meta}</p>
        {car.zones.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {car.zones.slice(0, 3).map((z) => <Chip key={z.zone}>{placementLabel(z.zone)}</Chip>)}
          </div>
        )}
        <Link href={href} className="btn btn-sm mt-3 w-full">View car</Link>
      </div>
    </article>
  );
}
