import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { Avatar, MetaLine, Money, SectionTitle } from "@/components/v2/ui";
import { placementLabel } from "@/components/v2/EarnCards";
import { fmtDate } from "@/lib/v2/opportunities";
import { OwnerSwitches, ProofForm, VerificationCard } from "./VehicleControls";

export const metadata = { title: "My vehicle" };
export const dynamic = "force-dynamic";

type Vehicle = {
  id: string; owner_id: string; year: number; make: string; model: string; trim: string | null;
  body_type: string | null; color: string | null; monthly_miles: number | null; city: string | null;
  radius_miles: number | null; status: string; verification: string; verification_note: string | null;
  available: boolean;
};

type Booking = {
  id: string; status: string; monthly_cents: number; zones: string[];
  starts_on: string | null; ends_on: string | null; campaign_id: string | null; campaign_title: string | null;
  business_name: string; business_logo: string | null; artwork_url: string | null; proof_count: number;
};

/** Plain words for where a car campaign is, written for the driver. */
function bookingState(b: Booking): { label: string; sub: string; tone: "signal" | "rise" | "ink" | "faint" } {
  switch (b.status) {
    case "creative_pending": return { label: "Accepted", sub: "The business is preparing the artwork.", tone: "rise" };
    case "installation_pending": return { label: "Installation next", sub: "The business will arrange it with you.", tone: "ink" };
    case "active": return { label: "Running", sub: b.ends_on ? `Paid monthly until ${fmtDate(b.ends_on)}.` : "Paid monthly to your earnings.", tone: "rise" };
    case "proof_required": return { label: "Proof needed", sub: "Upload a photo of the ad on your car.", tone: "signal" };
    case "completed": return { label: "Completed", sub: "Thanks for driving.", tone: "faint" };
    case "cancelled": return { label: "Cancelled", sub: "", tone: "faint" };
    case "disputed": return { label: "Under review", sub: "TapMart is looking into it.", tone: "signal" };
  }
  return { label: b.status.replaceAll("_", " "), sub: "", tone: "ink" };
}

/**
 * The owner's manage screen for one car. Photos, the facts, the two
 * switches, verification, placements, and every campaign this car is in.
 * Nobody else can open it: vehicles are private.
 */
export default async function ManageVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;

  const vehicle = await sqlOne<Vehicle>(
    `select id, owner_id, year, make, model, trim, body_type, color, monthly_miles, city, radius_miles,
            status, verification::text as verification, verification_note, available
       from vehicles where id = $1`,
    [id],
  );
  if (!vehicle) notFound();
  if (vehicle.owner_id !== ctx.user.id) redirect("/home");

  const [photos, zones, bookings] = await Promise.all([
    sql<{ angle: string; url: string }>(
      `select angle, url from vehicle_photos where vehicle_id = $1
        order by array_position(array['front', 'driver_side', 'rear', 'passenger_side'], angle), created_at`,
      [id],
    ),
    sql<{ zone: string; asking_cents_monthly: number | null }>(
      `select zone::text as zone, asking_cents_monthly::int as asking_cents_monthly
         from vehicle_zones where vehicle_id = $1 and available order by zone`,
      [id],
    ),
    sql<Booking>(
      `select k.id, k.status::text as status, k.monthly_cents::int as monthly_cents, k.zones::text[] as zones,
              k.starts_on, k.ends_on, coalesce(k.campaign_id, o.campaign_id) as campaign_id, c.title as campaign_title,
              b.name as business_name, b.logo_url as business_logo,
              coalesce(k.artwork_url, c.details->>'artwork_url') as artwork_url,
              (select count(*) from car_proofs cp where cp.booking_id = k.id)::int as proof_count
         from car_bookings k
         join businesses b on b.id = k.business_id
         left join car_offers o on o.id = k.offer_id
         left join campaigns c on c.id = coalesce(k.campaign_id, o.campaign_id)
        where k.vehicle_id = $1
        order by (k.status in ('completed', 'cancelled')), k.created_at desc`,
      [id],
    ),
  ]);

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const hero = photos.find((p) => p.angle === "driver_side") ?? photos[0] ?? null;
  const rest = photos.filter((p) => p !== hero);
  const minimum = zones.map((z) => z.asking_cents_monthly).filter((c): c is number => c != null);
  const available = vehicle.status === "listed" && vehicle.available;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me/vehicles" label="My vehicles" />

      <div className="card mt-3 overflow-hidden">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2 md:aspect-[16/9]">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.url} alt={`${title}, ${hero.angle.replaceAll("_", " ")} view`} className="h-full w-full object-cover" fetchPriority="high" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-ink-faint">No photo yet</div>
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {vehicle.verification === "verified" && (
              <span className="glass-tag px-2.5 py-1 font-display text-xs font-700 text-signal">Verified ✓</span>
            )}
            <span className={`glass-tag px-2.5 py-1 font-display text-xs font-700 ${available ? "text-signal" : "text-ink-soft"}`}>
              {vehicle.status === "listed" ? (vehicle.available ? "Available for ads" : "Unavailable") : "Not listed"}
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-4">
            <h1 className="font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em] md:text-[2rem]">{title}</h1>
          </div>
        </div>
        <div className="p-4 pt-3.5">
          <MetaLine parts={[
            vehicle.color, vehicle.body_type, vehicle.trim,
            vehicle.monthly_miles ? `${vehicle.monthly_miles.toLocaleString()} miles a month` : null,
            vehicle.city && `${vehicle.city}${vehicle.radius_miles ? `, ${vehicle.radius_miles} mile area` : ""}`,
          ]} />
          {rest.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {rest.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p.angle} src={p.url} alt={`${p.angle.replaceAll("_", " ")} view`}
                  className="h-20 w-28 shrink-0 rounded-[10px] object-cover" loading="lazy" />
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="mt-6">
        <SectionTitle>Availability</SectionTitle>
        <div className="mt-3">
          <OwnerSwitches vehicleId={vehicle.id} status={vehicle.status} available={vehicle.available} />
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle>Verification</SectionTitle>
        <div className="mt-3">
          <VerificationCard vehicleId={vehicle.id} verification={vehicle.verification} note={vehicle.verification_note} />
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle count={zones.length}>Placements you are open to</SectionTitle>
        <div className="card mt-3 px-4 py-3.5">
          {zones.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {zones.map((z) => (
                <span key={z.zone} className="rounded-md bg-surface-2 px-2 py-1 font-display text-xs font-700">{placementLabel(z.zone)}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-faint">No placements marked available.</p>
          )}
          <p className="mt-2.5 text-sm text-ink-faint">
            Pay is set by each campaign.{minimum.length > 0 ? ` Your minimum is $${Math.round(Math.min(...minimum) / 100)} a month.` : ""}
          </p>
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle count={bookings.length}>Campaigns with this car</SectionTitle>
        {bookings.length === 0 ? (
          <div className="card mt-3 px-4 py-5">
            <p className="font-display text-[1.0625rem] font-800 tracking-[-0.02em]">No campaigns yet</p>
            <p className="mt-1 text-sm text-ink-soft">Car campaigns show on Home. When your car qualifies, apply from the campaign.</p>
            <Link href="/home?f=cars" className="btn btn-signal mt-4">See car campaigns</Link>
          </div>
        ) : (
          <ul className="row-list mt-3">
            {bookings.map((b) => {
              const state = bookingState(b);
              const tone = state.tone === "signal" ? "text-signal" : state.tone === "rise" ? "text-rise" : state.tone === "faint" ? "text-ink-faint" : "text-ink";
              const head = (
                <div className="flex items-start gap-3">
                  {b.artwork_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.artwork_url} alt="Campaign artwork" className="h-14 w-20 shrink-0 rounded-[8px] bg-surface-2 object-cover" loading="lazy" />
                  ) : (
                    <Avatar src={b.business_logo} name={b.business_name} size={44} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">
                      {b.campaign_title ?? `${b.business_name} car ad`}
                    </span>
                    <span className="block truncate text-sm text-ink-faint">{b.business_name}</span>
                    <span className={`mt-1 block font-display text-sm font-700 ${tone}`}>{state.label}</span>
                  </span>
                  <Money cents={b.monthly_cents} size="md" suffix="/ mo" />
                </div>
              );
              return (
                <li key={b.id} className="card p-4">
                  {b.campaign_id ? <Link href={`/o/${b.campaign_id}`} className="block">{head}</Link> : head}
                  <MetaLine className="mt-2" parts={[
                    state.sub,
                    b.zones.map(placementLabel).join(" + "),
                    b.starts_on ? `Since ${fmtDate(b.starts_on)}` : null,
                    b.proof_count > 0 ? `${b.proof_count} proof${b.proof_count === 1 ? "" : "s"} sent` : null,
                  ]} />
                  {b.status === "proof_required" && <ProofForm bookingId={b.id} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
