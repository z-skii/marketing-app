import { notFound } from "next/navigation";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getCarForBusiness } from "@/lib/v2/marketplace";
import { placementLabel } from "@/components/v2/EarnCards";
import { AdPreview } from "./AdPreview";

export const metadata = { title: "Car" };
export const dynamic = "force-dynamic";

/**
 * One listed car, large on stage. The facts that were measured (miles, open
 * placements and what the owner asks, the driver's rating), then one
 * action: make an ad offer. The artwork preview stays as a second section.
 */
export default async function BusinessCarPage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([requireBusinessContext("/business"), params]);
  const business = ctx.activeBusiness;

  const city = (await sqlOne<{ city: string | null }>(`select city from businesses where id = $1`, [business.id]))?.city ?? ctx.city;
  const car = await getCarForBusiness(id, city);
  if (!car) notFound();

  const [campaigns, existing, owner] = await Promise.all([
    sql<{ id: string; title: string; artwork_url: string }>(
      `select id, title, details->>'artwork_url' as artwork_url
         from campaigns
        where business_id = $1 and kind = 'car_ads' and status = 'open'
          and coalesce(details->>'artwork_url', '') <> ''
        order by published_at desc nulls last, created_at desc`,
      [business.id],
    ),
    sqlOne<{ campaign_id: string; status: string }>(
      `select campaign_id, status from campaign_invites
        where business_id = $1 and vehicle_id = $2 and status in ('sent', 'accepted')
        order by created_at desc limit 1`,
      [business.id, car.id],
    ),
    sqlOne<{ owner_id: string }>(`select owner_id from businesses where id = $1`, [business.id]),
  ]);

  const own = car.owner_id === ctx.user.id || car.owner_id === owner?.owner_id;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business?tab=cars" label="Cars" />
      <div className="mt-3">
        <AdPreview
          vehicleId={car.id}
          name={`${car.year} ${car.make} ${car.model}`}
          meta={[car.color, car.city ?? "City not set", car.monthly_miles ? `~${car.monthly_miles.toLocaleString()} mi/month` : null].filter(Boolean).join("  ·  ")}
          own={own}
          available={car.available}
          stage={car.stage}
          zones={car.zones.map((z) => ({ zone: z.zone, label: placementLabel(z.zone), askingCents: z.asking_cents }))}
          campaignArtwork={campaigns}
          businessName={business.name}
          driver={{
            username: car.owner_username, name: car.owner_name, avatar: car.owner_avatar,
            ratingAvg: car.rating_avg ?? car.owner_rating_avg, ratingCount: car.rating_avg != null ? car.rating_count : car.owner_rating_count,
          }}
          existing={existing}
        />
      </div>
    </main>
  );
}
