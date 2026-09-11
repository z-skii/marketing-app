import Link from "next/link";
import type { Car } from "@/lib/v2/marketplace";
import { formatCredit } from "@/lib/money";
import { NoPhoto, placementLabel } from "@/components/v2/EarnCards";
import { VehicleStage } from "@/components/v2/vehicle/VehicleStage";

/**
 * The vehicle marketplace card from OpenAI's Business Home design: 4:3
 * media (the scanned 3D model when one exists, else the first real photo),
 * the "from" price and the car on the bottom scrim, and a 64px footer with
 * the placement summary and one View car secondary button.
 */
export function CarCard({ car, index = 0, rail = false }: { car: Car; index?: number; rail?: boolean }) {
  const name = `${car.year} ${car.make} ${car.model}`;
  const href = `/business/cars/${car.id}`;
  const still = car.stage.posterUrl ?? car.stage.photos[0]?.url ?? null;
  const placements = car.zones.map((z) => placementLabel(z.zone));
  const placementLine = placements.length > 2 ? `${placements.slice(0, 2).join(", ")} +${placements.length - 2}` : placements.join(", ");
  const meta = [car.city, car.monthly_miles ? `${car.monthly_miles.toLocaleString()} mi/mo` : null].filter(Boolean).join(" · ");
  const threeD = Boolean(car.stage.glbUrl);

  return (
    <article className={`card reveal min-w-0 overflow-hidden ${rail ? "w-[18rem] shrink-0 snap-start md:w-[24rem]" : ""}`} style={{ animationDelay: `${Math.min(index, 5) * 35}ms` }}>
      <Link href={href} aria-label={`View ${name}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#090c0e]">
          {threeD ? (
            <>
              <VehicleStage glbUrl={car.stage.glbUrl} posterUrl={car.stage.posterUrl} photos={car.stage.photos} label={null} fill />
              <span className="glass-tag is-glass absolute top-[14px] left-[14px]">3D model</span>
            </>
          ) : still ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={still} alt="" className="absolute inset-0 h-full w-full object-cover" loading={index < 3 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} decoding="async" />
          ) : (
            <NoPhoto name={`${car.make} ${car.model}`} logo={null} />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-[image:var(--tm-scrim)]" aria-hidden />
          <div className="absolute inset-x-[14px] bottom-[14px] min-w-0">
            {car.from_cents != null && (
              <p className="tnum font-display text-[24px] leading-7 font-[850] tracking-[-0.6px] text-signal">from {formatCredit(car.from_cents)}<span className="text-[13px] font-700 text-ink-2">/mo</span></p>
            )}
            <p className="truncate font-display text-[20px] leading-[25px] font-[760] tracking-[-0.35px] text-ink">{name}</p>
            {meta && <p className="truncate text-[13px] leading-[17px] font-600 text-ink-2">{meta}</p>}
          </div>
        </div>
      </Link>
      <div className="flex h-16 items-center justify-between gap-3 px-[14px]">
        <p className="min-w-0 truncate text-[12px] leading-4 text-ink-soft">{placementLine || "No placements listed"}</p>
        <Link href={href} className="btn h-11 min-h-11 shrink-0 px-4">View car</Link>
      </div>
    </article>
  );
}
