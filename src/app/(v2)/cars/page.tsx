import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { searchVehicles, type VehicleCard } from "@/lib/v2/feed";
import { sql } from "@/lib/db";
import { Avatar, Chip, EmptyState, Money, ScreenHeader, SectionTitle, StatusChip } from "@/components/v2/ui";

export const metadata = { title: "Car Ads" };
export const dynamic = "force-dynamic";

type MyVehicle = {
  id: string; year: number; make: string; model: string; status: string;
  verification: string; photo_url: string | null; open_offers: number; active_bookings: number;
};

const BODY_PILLS = ["Sedan", "SUV", "Truck", "Coupe", "Van"];

/**
 * Car Ads: a vehicle marketplace first, a filter form second. Big photos,
 * the monthly price on the photo, a compact pill row to narrow, and the
 * detailed filters folded away until someone asks for them.
 */
export default async function CarsPage({
  searchParams,
}: { searchParams: Promise<{ tab?: string; city?: string; make?: string; max?: string; verified?: string; body?: string; near?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;

  const myVehicles = await sql<MyVehicle>(
    `select v.id, v.year, v.make, v.model, v.status, v.verification::text as verification,
            (select url from vehicle_photos p where p.vehicle_id = v.id order by (angle = 'driver_side') desc, created_at limit 1) as photo_url,
            (select count(*) from car_offers o where o.vehicle_id = v.id and o.status in ('sent', 'countered'))::int as open_offers,
            (select count(*) from car_bookings k where k.vehicle_id = v.id
              and k.status in ('creative_pending', 'installation_pending', 'active', 'proof_required'))::int as active_bookings
       from vehicles v where v.owner_id = $1 order by v.created_at desc`,
    [ctx.user.id],
  );

  const tab = params.tab === "browse" || params.tab === "mine"
    ? params.tab
    : myVehicles.length > 0 && ctx.businesses.length === 0 ? "mine" : "browse";

  const near = params.near === "1" && Boolean(ctx.city);
  const body = BODY_PILLS.find((b) => b.toLowerCase() === (params.body ?? "").toLowerCase()) ?? null;
  const maxDollars = params.max ? parseInt(params.max, 10) : NaN;
  const city = params.city?.trim() || (near ? ctx.city : null);
  const advancedActive = Boolean(params.city?.trim() || params.make?.trim() || params.max || params.verified === "1");

  const vehicles = tab === "browse"
    ? await searchVehicles({
        city,
        make: params.make?.trim() || null,
        bodyType: body,
        maxCents: Number.isFinite(maxDollars) && maxDollars > 0 ? maxDollars * 100 : null,
        verifiedOnly: params.verified === "1",
        limit: 30,
      })
    : [];

  const pillHref = (next: { near?: boolean; body?: string | null }) => {
    const usp = new URLSearchParams();
    usp.set("tab", "browse");
    const n = next.near ?? near;
    const b = next.body === undefined ? body : next.body;
    if (n) usp.set("near", "1");
    if (b) usp.set("body", b);
    if (params.city?.trim()) usp.set("city", params.city.trim());
    if (params.make?.trim()) usp.set("make", params.make.trim());
    if (params.max) usp.set("max", params.max);
    if (params.verified === "1") usp.set("verified", "1");
    return `/cars?${usp.toString()}`;
  };

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader
        title="Car Ads"
        kicker={tab === "browse" ? "Rent ad space on real cars" : "Your cars and what they earn"}
        unread={ctx.unreadNotifications}
        right={tab === "browse" && (
          <Link href="/cars/new" className="btn btn-signal hidden sm:inline-flex">
            + List my car
          </Link>
        )}
      />

      <nav className="mt-6 flex gap-5" aria-label="Car tabs">
        {([["browse", "Find a car"], ["mine", myVehicles.length ? `My cars (${myVehicles.length})` : "My cars"]] as const).map(([key, label]) => (
          <Link
            key={key} href={`/cars?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={`relative pb-2 font-display text-lg font-800 tracking-[-0.02em] transition-colors ${
              tab === key ? "text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:rounded-full after:bg-signal" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tab === "browse" && (
        <>
          <div className="pill-row mt-4" role="group" aria-label="Quick filters">
            {ctx.city && (
              <Link href={pillHref({ near: !near })} className="pill" aria-current={near ? "page" : undefined}>
                Near {ctx.city.split(",")[0]}
              </Link>
            )}
            <Link href={pillHref({ body: null })} className="pill" aria-current={!body ? "page" : undefined}>
              All
            </Link>
            {BODY_PILLS.map((b) => (
              <Link key={b} href={pillHref({ body: b === body ? null : b })} className="pill" aria-current={b === body ? "page" : undefined}>
                {b}
              </Link>
            ))}
          </div>

          <details className="group mt-3" open={advancedActive}>
            <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full px-1 py-1 font-display text-sm font-600 text-ink-soft hover:text-ink">
              <span className="transition-transform group-open:rotate-90" aria-hidden>›</span>
              More filters{advancedActive ? " (on)" : ""}
            </summary>
            <form className="card mt-2 grid grid-cols-2 gap-2 p-3 md:grid-cols-[1fr_1fr_1fr_auto]" action="/cars">
              <input type="hidden" name="tab" value="browse" />
              {near && <input type="hidden" name="near" value="1" />}
              {body && <input type="hidden" name="body" value={body} />}
              <input className="field" name="city" defaultValue={params.city ?? ""} placeholder="City" aria-label="City" />
              <input className="field" name="make" defaultValue={params.make ?? ""} placeholder="Make" aria-label="Make" />
              <input className="field" name="max" inputMode="numeric" defaultValue={params.max ?? ""} placeholder="Max $ per month" aria-label="Max monthly price" />
              <div className="flex items-center justify-between gap-3 px-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="verified" value="1" defaultChecked={params.verified === "1"} className="h-4 w-4 accent-signal" />
                  Verified only
                </label>
                <button type="submit" className="btn btn-sm">Apply</button>
              </div>
            </form>
          </details>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {vehicles.map((v, i) => <VehicleListing key={v.id} v={v} priority={i < 2} />)}
          </div>
          {vehicles.length === 0 && (
            <div className="mt-5">
              <EmptyState
                title="No cars match yet"
                body={near || body || advancedActive
                  ? "Widen the search. Drivers list new cars every week."
                  : "No cars listed yet. Be the first to list yours and businesses will find it here."}
                actionHref={near || body || advancedActive ? "/cars?tab=browse" : "/cars/new"}
                actionLabel={near || body || advancedActive ? "Show all cars" : "List my car"}
              />
            </div>
          )}
        </>
      )}

      {tab === "mine" && (
        <section className="mt-5">
          {myVehicles.length === 0 ? (
            <EmptyState
              title="Your car could earn money while you drive"
              body="List it once, choose which areas you would rent, and businesses send you offers."
              actionHref="/cars/new" actionLabel="Add my car"
            />
          ) : (
            <>
              <SectionTitle count={myVehicles.length} action={{ href: "/cars/new", label: "+ Add another" }}>My cars</SectionTitle>
              <ul className="row-list mt-3">
                {myVehicles.map((v) => (
                  <li key={v.id}>
                    <Link href={`/cars/${v.id}`} className="card flex items-center gap-4 p-3">
                      {v.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.photo_url} alt="" className="h-20 w-28 shrink-0 rounded-[10px] object-cover" />
                      ) : (
                        <span className="flex h-20 w-28 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-sm text-ink-faint">No photo</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-lg font-800 tracking-[-0.02em]">
                          {v.year} {v.make} {v.model}
                        </span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <StatusChip status={v.status} />
                          <StatusChip status={v.verification} />
                          {v.open_offers > 0 && <Chip tone="signal">{v.open_offers} offer{v.open_offers === 1 ? "" : "s"}</Chip>}
                          {v.active_bookings > 0 && <Chip tone="rise">{v.active_bookings} active</Chip>}
                        </span>
                      </span>
                      <span aria-hidden className="text-ink-faint">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === "browse" && (
        <Link href="/cars/new" className="btn btn-signal fixed right-4 bottom-24 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] sm:hidden">
          + List my car
        </Link>
      )}
    </main>
  );
}

/** The car is the card. Price on the photo, the rest reads in two lines. */
function VehicleListing({ v, priority }: { v: VehicleCard; priority: boolean }) {
  return (
    <Link href={`/cars/${v.id}`} className="card block overflow-hidden">
      <span className="relative block aspect-[4/3] overflow-hidden bg-surface-2">
        {v.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.photo_url} alt="" className="h-full w-full object-cover" loading={priority ? "eager" : "lazy"} />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-sm text-ink-faint">No photo yet</span>
        )}
        <span className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
        {v.verification === "verified" && (
          <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-rise">Verified</span>
        )}
        <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
          {v.min_asking_cents != null ? (
            <Money cents={v.min_asking_cents} size="xl" suffix="/ month" />
          ) : (
            <span className="font-display text-lg font-700 text-ink">Make an offer</span>
          )}
          <span className="font-display text-sm font-700 text-ink">{v.zone_count} area{v.zone_count === 1 ? "" : "s"}</span>
        </span>
      </span>
      <span className="block p-4 pt-3.5">
        <span className="block font-display text-[1.25rem] leading-[1.15] font-800 tracking-[-0.02em]">
          {v.year} {v.make} {v.model}
        </span>
        <span className="mt-1.5 block text-sm text-ink-faint">
          {[v.city, v.body_type, v.monthly_miles ? `${v.monthly_miles.toLocaleString()} miles a month` : null].filter(Boolean).join("  ·  ")}
        </span>
        <span className="mt-3 flex items-center gap-2">
          <Avatar name={v.owner_name ?? v.owner_username} size={24} />
          <span className="text-sm text-ink-soft">{v.owner_name ?? `@${v.owner_username}`}</span>
        </span>
      </span>
    </Link>
  );
}
