import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { searchVehicles } from "@/lib/v2/feed";
import { sql } from "@/lib/db";
import { Avatar, Chip, EmptyState, MetaLine, Money, SectionTitle, StatusChip } from "@/components/v2/ui";

export const metadata = { title: "Car Ads" };
export const dynamic = "force-dynamic";

type MyVehicle = {
  id: string; year: number; make: string; model: string; status: string;
  verification: string; photo_url: string | null; open_offers: number; active_bookings: number;
};

/**
 * Car Ads: drivers manage their listed cars, businesses browse cars to
 * advertise on. Both live here so the tab means one thing in the nav.
 */
export default async function CarsPage({
  searchParams,
}: { searchParams: Promise<{ tab?: string; city?: string; make?: string; max?: string; verified?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;

  const myVehicles = await sql<MyVehicle>(
    `select v.id, v.year, v.make, v.model, v.status, v.verification::text as verification,
            (select url from vehicle_photos p where p.vehicle_id = v.id order by created_at limit 1) as photo_url,
            (select count(*) from car_offers o where o.vehicle_id = v.id and o.status in ('sent', 'countered'))::int as open_offers,
            (select count(*) from car_bookings k where k.vehicle_id = v.id
              and k.status in ('creative_pending', 'installation_pending', 'active', 'proof_required'))::int as active_bookings
       from vehicles v where v.owner_id = $1 order by v.created_at desc`,
    [ctx.user.id],
  );

  const defaultTab = params.tab === "browse" || params.tab === "mine"
    ? params.tab
    : myVehicles.length > 0 && ctx.businesses.length === 0 ? "mine" : "browse";

  const maxDollars = params.max ? parseInt(params.max, 10) : NaN;
  const vehicles = defaultTab === "browse"
    ? await searchVehicles({
        city: params.city?.trim() || null,
        make: params.make?.trim() || null,
        maxCents: Number.isFinite(maxDollars) && maxDollars > 0 ? maxDollars * 100 : null,
        verifiedOnly: params.verified === "1",
        limit: 30,
      })
    : [];

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-900 tracking-[-0.03em]">Car Ads</h1>
        <Link href="/cars/new" className="btn btn-signal !px-4 !py-2 text-xs">+ List my car</Link>
      </div>

      <nav className="mt-4 flex gap-1 border-b border-rule" aria-label="Car tabs">
        {([["browse", "Find a car"], ["mine", `My cars${myVehicles.length ? ` (${myVehicles.length})` : ""}`]] as const).map(([key, label]) => (
          <Link
            key={key} href={`/cars?tab=${key}`}
            aria-current={defaultTab === key ? "page" : undefined}
            className={`px-4 py-2.5 font-mono text-[0.6875rem] font-600 tracking-[0.1em] uppercase ${
              defaultTab === key ? "border-b-2 border-signal text-ink" : "text-ink-faint hover:text-ink"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {defaultTab === "browse" && (
        <>
          <form className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4" action="/cars">
            <input type="hidden" name="tab" value="browse" />
            <input className="field !py-2 !text-xs" name="city" defaultValue={params.city ?? ""} placeholder="City" aria-label="City" />
            <input className="field !py-2 !text-xs" name="make" defaultValue={params.make ?? ""} placeholder="Make" aria-label="Make" />
            <input className="field !py-2 !text-xs" name="max" inputMode="numeric" defaultValue={params.max ?? ""} placeholder="Max $/mo" aria-label="Max monthly price" />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 font-mono text-[0.625rem] uppercase">
                <input type="checkbox" name="verified" value="1" defaultChecked={params.verified === "1"} />
                Verified
              </label>
              <button type="submit" className="btn ml-auto !min-h-0 !px-3 !py-2 !text-[0.625rem]">Filter</button>
            </div>
          </form>

          <div className="mt-4 flex flex-col gap-3">
            {vehicles.map((v) => (
              <Link key={v.id} href={`/cars/${v.id}`} className="flex gap-3 border border-rule p-3 hover:border-ink">
                {v.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.photo_url} alt="" className="h-20 w-28 shrink-0 border border-ink object-cover" />
                ) : (
                  <span className="flex h-20 w-28 shrink-0 items-center justify-center border border-rule font-mono text-[0.625rem] text-ink-faint">no photo</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-display text-base font-800">
                      {v.year} {v.make} {v.model}
                    </span>
                    {v.min_asking_cents != null && <Money cents={v.min_asking_cents} suffix="/mo+" />}
                  </span>
                  <MetaLine parts={[
                    v.city, v.color ?? undefined, v.body_type ?? undefined,
                    v.monthly_miles ? `${v.monthly_miles.toLocaleString()} mi/mo` : null,
                    `${v.zone_count} ad area${v.zone_count === 1 ? "" : "s"}`,
                  ]} />
                  <span className="mt-1.5 flex items-center gap-2">
                    <Avatar name={v.owner_name ?? v.owner_username} size={18} />
                    <span className="font-mono text-[0.625rem] text-ink-faint">@{v.owner_username}</span>
                    {v.verification === "verified" && <Chip tone="rise">verified</Chip>}
                  </span>
                </span>
              </Link>
            ))}
            {vehicles.length === 0 && (
              <EmptyState
                title="No cars match"
                body="Try a wider search — or fewer filters. Drivers list new cars all the time."
              />
            )}
          </div>
        </>
      )}

      {defaultTab === "mine" && (
        <section className="mt-4">
          {myVehicles.length === 0 ? (
            <EmptyState
              title="Your car could earn money while you drive"
              body="List it once, choose which areas you'd rent, and businesses send you offers."
              actionHref="/cars/new" actionLabel="Add vehicle"
            />
          ) : (
            <>
              <SectionTitle count={myVehicles.length}>My cars</SectionTitle>
              <ul className="mt-3 flex flex-col gap-2">
                {myVehicles.map((v) => (
                  <li key={v.id}>
                    <Link href={`/cars/${v.id}`} className="flex items-center gap-3 border border-rule p-3 hover:border-ink">
                      {v.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.photo_url} alt="" className="h-14 w-20 shrink-0 border border-ink object-cover" />
                      ) : (
                        <span className="flex h-14 w-20 shrink-0 items-center justify-center border border-rule font-mono text-[0.625rem] text-ink-faint">draft</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-base font-800">
                          {v.year} {v.make} {v.model}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-2">
                          <StatusChip status={v.status} />
                          <StatusChip status={v.verification} />
                          {v.open_offers > 0 && <Chip tone="signal">{v.open_offers} offer{v.open_offers === 1 ? "" : "s"}</Chip>}
                          {v.active_bookings > 0 && <Chip tone="rise">{v.active_bookings} active</Chip>}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  );
}
