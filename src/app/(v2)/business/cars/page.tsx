import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { formatCredit } from "@/lib/money";
import { buildStage } from "@/lib/vehicles/stage";
import { Chip, ScreenHeader } from "@/components/v2/ui";
import { FilterBar } from "@/components/v2/FilterBar";
import { NoPhoto, placementLabel } from "@/components/v2/EarnCards";
import { VehicleStage, type StagePhoto } from "@/components/v2/vehicle/VehicleStage";

export const metadata = { title: "Cars near you" };
export const dynamic = "force-dynamic";

type Row = {
  id: string; owner_id: string; year: number; make: string; model: string; city: string | null;
  monthly_miles: number | null; model_glb_url: string | null; poster_url: string | null;
  same_city: boolean; zones: string[]; from_cents: number | null;
  photos: StagePhoto[]; scan_photos: StagePhoto[] | null; scan_label: string | null;
};

type Filter = "all" | "city" | "scan" | "photos";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "city", label: "My city" },
  { key: "scan", label: "Has 3D scan" },
  { key: "photos", label: "Has photos" },
];

/**
 * Listed cars a business can advertise on. Same city first, then the rest.
 * Each row is the car on stage, its name, where it drives and which areas
 * are open. One tap previews the business's artwork on that car.
 */
export default async function BusinessCarsPage({
  searchParams,
}: { searchParams: Promise<{ f?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/cars"), searchParams]);
  const business = ctx.activeBusiness;
  const filter: Filter = FILTERS.find((f) => f.key === params.f)?.key ?? "all";
  const city = (await sql<{ city: string | null }>(`select city from businesses where id = $1`, [business.id]))[0]?.city ?? ctx.city;

  const rows = await sql<Row>(
    `select v.id, v.owner_id, v.year, v.make, v.model, v.city, v.monthly_miles, v.model_glb_url, v.poster_url,
            ($1::text is not null and lower(coalesce(v.city, '')) = lower($1::text)) as same_city,
            coalesce((select array_agg(z.zone::text order by z.zone) from vehicle_zones z
                       where z.vehicle_id = v.id and z.available), '{}') as zones,
            (select min(z.asking_cents_monthly)::int from vehicle_zones z
              where z.vehicle_id = v.id and z.available) as from_cents,
            coalesce((select json_agg(json_build_object('angle', p.angle, 'url', p.url) order by p.created_at)
                        from vehicle_photos p where p.vehicle_id = v.id), '[]'::json) as photos,
            ls.capture->'photos' as scan_photos,
            ls.quality->>'label' as scan_label
       from vehicles v
       left join lateral (select s.capture, s.quality from vehicle_scans s
                           where s.vehicle_id = v.id order by s.created_at desc limit 1) ls on true
      where v.status = 'listed' and v.available
      order by same_city desc, v.created_at desc`,
    [city],
  );

  const stages = rows.map((r) => buildStage({
    glbUrl: r.model_glb_url, posterUrl: r.poster_url, photos: r.photos ?? [],
    scanPhotos: r.scan_photos, scanQualityLabel: r.scan_label,
  }));
  const shown = rows
    .map((r, k) => ({ r, stage: stages[k] }))
    .filter(({ r, stage }) =>
      filter === "city" ? r.same_city
      : filter === "scan" ? Boolean(r.model_glb_url)
      : filter === "photos" ? stage.photos.length > 0 || Boolean(stage.posterUrl)
      : true);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader bell={false} kicker={business.name} title="Cars near you" unread={ctx.unreadNotifications} showSearch={false} />

      <div className="mt-5">
        <FilterBar
          label="Filter cars"
          active={filter}
          items={FILTERS.map((f) => ({ key: f.key, label: f.label, href: f.key === "all" ? "/business/cars" : `/business/cars?f=${f.key}` }))}
        />
      </div>

      {shown.length === 0 ? (
        <div className="mt-8">
          <p className="text-sm text-ink-soft">
            {filter === "city" ? `No listed cars in ${city ?? "your city"} yet.`
              : filter === "scan" ? "No listed car has a 3D scan yet."
              : filter === "photos" ? "No listed car has photos yet."
              : "No cars are listed for ads yet."}
          </p>
          <Link href="/business/create/car" className="link-row mt-1">Post a car campaign instead<CaretRight size={16} aria-hidden /></Link>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-rule">
          {shown.map(({ r, stage }, k) => {
            const name = `${r.year} ${r.make} ${r.model}`;
            const own = r.owner_id === ctx.user.id;
            const hasMedia = stage.glbUrl || stage.photos.length > 0 || stage.posterUrl;
            return (
              <li key={r.id} className="reveal py-5 md:grid md:grid-cols-[17rem_minmax(0,1fr)] md:items-center md:gap-6" style={{ animationDelay: `${Math.min(k, 6) * 60}ms` }}>
                <Link href={`/business/cars/${r.id}`} aria-label={`Preview my ad on ${name}`} className="block">
                  {hasMedia ? (
                    <VehicleStage glbUrl={stage.glbUrl} posterUrl={stage.posterUrl} photos={stage.photos} label={stage.label} compact />
                  ) : (
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-card)]">
                      <NoPhoto name={`${r.make} ${r.model}`} logo={null} />
                    </div>
                  )}
                </Link>
                <div className="mt-4 min-w-0 md:mt-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 font-display text-[1.5rem] leading-none font-800 tracking-[-0.03em]">{name}</p>
                    {r.from_cents != null && (
                      <p className="tnum shrink-0 font-display text-[1.125rem] leading-none font-800 tracking-[-0.02em] text-signal">
                        <span className="mr-1 text-sm font-600 text-ink-soft">from</span>{formatCredit(r.from_cents)}<span className="ml-1 text-sm font-600 text-ink-soft">/ mo</span>
                      </p>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-ink-faint">
                    {[r.city ?? "City not set", r.monthly_miles ? `~${r.monthly_miles.toLocaleString()} mi/month` : null].filter(Boolean).join(" · ")}
                  </p>
                  {(r.zones.length > 0 || own) && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {own && <Chip tone="faint">Your car</Chip>}
                      {r.zones.slice(0, own ? 2 : 3).map((z) => <Chip key={z}>{placementLabel(z)}</Chip>)}
                    </div>
                  )}
                  <Link href={`/business/cars/${r.id}`} className="btn btn-sm mt-4">Preview my ad</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
