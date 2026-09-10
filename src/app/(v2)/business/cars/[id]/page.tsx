import { notFound } from "next/navigation";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { buildStage } from "@/lib/vehicles/stage";
import { placementLabel } from "@/components/v2/EarnCards";
import type { StagePhoto } from "@/components/v2/vehicle/VehicleStage";
import { AdPreview } from "./AdPreview";

export const metadata = { title: "Preview my ad" };
export const dynamic = "force-dynamic";

type Vehicle = {
  id: string; owner_id: string; year: number; make: string; model: string; color: string | null;
  city: string | null; monthly_miles: number | null; status: string; available: boolean;
  model_glb_url: string | null; poster_url: string | null;
};

/**
 * One listed car, large on stage, with the business's artwork placed on it
 * approximately. Pick an area, pick artwork, send the offer. The owner gets
 * a notification and the thread.
 */
export default async function BusinessCarPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireBusinessContext("/business/cars"), params]);
  const business = ctx.activeBusiness;

  const vehicle = await sqlOne<Vehicle>(
    `select id, owner_id, year, make, model, color, city, monthly_miles, status, available, model_glb_url, poster_url
       from vehicles where id = $1`,
    [id],
  );
  if (!vehicle || vehicle.status !== "listed") notFound();

  const [photos, scan, zones, campaigns] = await Promise.all([
    sql<StagePhoto>(`select angle::text as angle, url from vehicle_photos where vehicle_id = $1 order by created_at`, [id]),
    sqlOne<{ photos: StagePhoto[] | null; label: string | null }>(
      `select s.capture->'photos' as photos, s.quality->>'label' as label
         from vehicle_scans s where s.vehicle_id = $1 order by s.created_at desc limit 1`,
      [id],
    ),
    sql<{ zone: string; asking_cents: number | null }>(
      `select zone::text as zone, asking_cents_monthly::int as asking_cents
         from vehicle_zones where vehicle_id = $1 and available order by zone`,
      [id],
    ),
    sql<{ id: string; title: string; artwork_url: string }>(
      `select id, title, details->>'artwork_url' as artwork_url
         from campaigns
        where business_id = $1 and kind = 'car_ads' and status = 'open'
          and coalesce(details->>'artwork_url', '') <> ''
        order by published_at desc nulls last, created_at desc`,
      [business.id],
    ),
  ]);

  const stage = buildStage({
    glbUrl: vehicle.model_glb_url, posterUrl: vehicle.poster_url, photos,
    scanPhotos: scan?.photos, scanQualityLabel: scan?.label,
  });
  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/cars" label="Cars near you" />
      <div className="mt-3">
        <AdPreview
          vehicleId={vehicle.id}
          name={name}
          meta={[vehicle.color, vehicle.city ?? "City not set", vehicle.monthly_miles ? `~${vehicle.monthly_miles.toLocaleString()} mi/month` : null].filter(Boolean).join(" · ")}
          own={vehicle.owner_id === ctx.user.id}
          stage={stage}
          zones={zones.map((z) => ({ zone: z.zone, label: placementLabel(z.zone), askingCents: z.asking_cents }))}
          campaignArtwork={campaigns}
          businessName={business.name}
        />
      </div>
    </main>
  );
}
