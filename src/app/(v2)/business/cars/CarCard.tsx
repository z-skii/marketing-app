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
      <span className="eyebrow block !text-[0.625rem] text-ink-soft">From</span>
      <span className="tnum block font-display text-[1.5rem] leading-none font-800 tracking-[-0.03em] text-signal md:text-[1.75rem]">
        {formatCredit(car.from_cents)}<span className="text-[0.9375rem] font-700 text-ink-soft"> / mo</span>
      </span>
    </span>
  ) : null;
  const threeD = Boolean(car.stage.glbUrl);

  return (
    <article className={`reveal group min-w-0 ${rail ? "w-[18rem] shrink-0 snap-start md:w-[24rem]" : ""}`} style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}>
      <Link href={href} aria-label={`View ${name}`} className="block">
        {threeD ? (
          <VehicleStage glbUrl={car.stage.glbUrl} posterUrl={car.stage.posterUrl} photos={car.stage.photos} label={car.stage.label} compact>
            {money}
          </VehicleStage>
        ) : (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-card)] bg-surface-2 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] can-hover:group-hover:-translate-y-1">
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
      <div className="mt-2.5 min-w-0 px-0.5">
        <p className="truncate font-display text-[1.125rem] leading-none font-800 tracking-[-0.02em] md:text-[1.25rem]">{name}</p>
        {meta && <p className="tnum mt-1.5 truncate text-[0.8125rem] text-ink-faint md:text-sm">{meta}</p>}
        {car.zones.length > 0 && (
          <p className="mt-1.5 truncate text-[0.8125rem] text-ink-soft md:text-sm">
            {car.zones.slice(0, 3).map((z) => placementLabel(z.zone)).join("  ·  ")}
          </p>
        )}
        <Link href={href} className="btn btn-sm mt-3 w-full bg-[color:var(--color-rule-strong)]">View car</Link>
      </div>
    </article>
  );
}
