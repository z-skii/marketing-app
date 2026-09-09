import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles } from "@/lib/v2/opportunities";
import { placementLabel } from "@/components/v2/EarnCards";

export const metadata = { title: "My vehicles" };
export const dynamic = "force-dynamic";

/**
 * The person's cars, private to them. One card per vehicle: the photo, the
 * name, whether it is available for ads, and what it is open to. Campaigns
 * that need a car are found on Home; this is where the car itself lives.
 */
export default async function MyVehiclesPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const vehicles = await getMyVehicles(ctx.user.id);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <div className="mt-3 flex items-end justify-between gap-3">
        <h1 className="font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">My vehicles</h1>
        {vehicles.length > 0 && (
          <Link href="/me/vehicles/new" className="btn btn-sm shrink-0">+ Add vehicle</Link>
        )}
      </div>

      {vehicles.length === 0 ? (
        <section className="card mt-6 overflow-hidden">
          <div className="relative aspect-[4/3] w-full bg-surface-2 md:aspect-[16/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/uploads/seed/demo-bmw.webp" alt="" className="h-full w-full object-cover" fetchPriority="high" />
            <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
            <p className="absolute inset-x-5 bottom-5 font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em] md:text-[2rem]">
              Make money with your car.
            </p>
          </div>
          <div className="p-5">
            <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
              List your vehicle and receive advertising opportunities. Businesses pay monthly, you keep driving the way you already do.
            </p>
            <Link href="/me/vehicles/new" className="btn btn-signal btn-lg mt-5 w-full md:w-auto">Add vehicle</Link>
          </div>
        </section>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {vehicles.map((v, i) => {
            const available = v.status === "listed" && v.available;
            return (
              <li key={v.id} className="card overflow-hidden">
                <Link href={`/me/vehicles/${v.id}`} className="block">
                  <div className="relative aspect-[16/9] w-full bg-surface-2">
                    {v.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.photo_url} alt="" className="h-full w-full object-cover" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-sm text-ink-faint">No photo yet</span>
                    )}
                    <div className="media-scrim absolute inset-x-0 bottom-0 h-2/3" aria-hidden />
                    {v.verification === "verified" && (
                      <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-signal">Verified ✓</span>
                    )}
                    <p className="absolute inset-x-4 bottom-3 font-display text-[1.5rem] leading-[1.1] font-800 tracking-[-0.02em]">
                      {v.year} {v.make} {v.model}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <span className="min-w-0">
                      <span className={`block font-display text-[0.9375rem] font-700 ${available ? "text-signal" : "text-ink-soft"}`}>
                        {v.status === "listed" ? (v.available ? "Available for ads" : "Unavailable") : "Not listed"}
                      </span>
                      <span className="block truncate text-sm text-ink-faint">
                        {v.zones.length > 0 ? v.zones.map(placementLabel).join("  ·  ") : "No placements marked available"}
                      </span>
                    </span>
                    <span className="btn btn-sm shrink-0">Manage</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
