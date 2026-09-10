import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { CheckCircle, Cube, CaretRight, Car as CarIcon } from "@phosphor-icons/react/dist/ssr";
import { Avatar, MetaLine, Money, SectionTitle } from "@/components/v2/ui";
import { VehicleStage } from "@/components/v2/vehicle/VehicleStage";
import { placementLabel } from "@/components/v2/EarnCards";
import { fmtDate } from "@/lib/v2/opportunities";
import { OwnerSwitches, ProofForm, VerificationCard } from "./VehicleControls";

export const metadata = { title: "My vehicle" };
export const dynamic = "force-dynamic";

type Vehicle = {
  id: string; owner_id: string; year: number; make: string; model: string; trim: string | null;
  body_type: string | null; color: string | null; monthly_miles: number | null; city: string | null;
  radius_miles: number | null; status: string; verification: string; verification_note: string | null;
  available: boolean; model_glb_url: string | null; poster_url: string | null;
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
            status, verification::text as verification, verification_note, available, model_glb_url, poster_url
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
    const minimum = zones.map((z) => z.asking_cents_monthly).filter((c): c is number => c != null);
  const available = vehicle.status === "listed" && vehicle.available;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me/vehicles" label="My vehicles" />

      {/* ------------------------------------------------ name and status */}
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="icon-square"><CarIcon size={22} aria-hidden /></span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-[1.25rem] leading-[1.2] font-600 tracking-[-0.02em]">
              {title}
              {vehicle.verification === "verified" && <CheckCircle size={18} weight="fill" className="ml-1.5 inline-block align-[-2px] text-signal" aria-label="Verified" />}
            </h1>
            <p className="mt-0.5 truncate text-sm text-ink-soft">{vehicle.model_glb_url ? "3D model" : `${photos.length} ${photos.length === 1 ? "photo" : "photos"}`}{vehicle.color ? ` · ${vehicle.color}` : ""}</p>
          </div>
        </div>
        <span className={`mt-1 inline-flex shrink-0 items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-[0.8125rem] font-500 ${available ? "text-signal" : "text-ink-soft"}`}>
          {available && <span aria-hidden className="status-dot" />}
          {vehicle.status === "listed" ? (vehicle.available ? "Ready for Ads" : "Paused") : "Not listed"}
        </span>
      </div>

      {/* --------------------------------------------------------- stage */}
      <div className="mt-4">
        {hero || vehicle.model_glb_url ? (
          <VehicleStage glbUrl={vehicle.model_glb_url} posterUrl={vehicle.poster_url ?? hero?.url ?? null} photos={photos} label={null} />
        ) : (
          <div className="card flex aspect-[4/3] w-full items-center justify-center text-sm text-ink-faint">No photo yet</div>
        )}
      </div>
      <MetaLine className="mt-3" parts={[
        vehicle.monthly_miles ? `${vehicle.monthly_miles.toLocaleString()} miles a month` : null,
        vehicle.city && `${vehicle.city}${vehicle.radius_miles ? `, ${vehicle.radius_miles} mile area` : ""}`,
      ]} />

      {/* ------------------------------------------------- the model row */}
      <div className="row mt-4 flex items-center gap-3 px-3.5 py-3">
        <span className="icon-square"><Cube size={22} aria-hidden /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[1rem] leading-[1.3] font-600 tracking-[-0.01em]">
            {vehicle.model_glb_url ? "3D model from your scan" : `${photos.length} ${photos.length === 1 ? "photo" : "photos"} from your scan`}
          </span>
          <span className="block text-sm text-ink-soft">
            {vehicle.model_glb_url ? "From your TapMart scan." : "Businesses preview ads on these."}
          </span>
        </span>
        <Link href={`/me/vehicles/scan?vehicle=${vehicle.id}`} className="shrink-0 text-sm font-500 text-ink-soft">{photos.length > 0 ? "Rescan" : "Scan"}</Link>
      </div>

      {/* ------------------------------------------------------ ad zones */}
      <section className="mt-6" aria-labelledby="zones-title">
        <h2 id="zones-title" className="eyebrow">Available ad zones</h2>
        <p className="mt-0.5 text-sm text-ink-soft">
          {zones.length > 0 ? "Where a business can place its ad on your car." : "No placements marked available yet."}
          {minimum.length > 0 ? ` Your minimum is $${Math.round(Math.min(...minimum) / 100)} a month.` : ""}
        </p>
        {zones.length > 0 && (
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {zones.map((z) => (
              <li key={z.zone} className="card overflow-hidden">
                <div className="relative aspect-[4/3] w-full bg-surface-2">
                  {hero && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hero.url} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 px-2.5 py-2">
                  <span className="truncate font-display text-[0.8125rem] font-600">{placementLabel(z.zone)}</span>
                  {z.asking_cents_monthly != null && <span className="tnum shrink-0 text-xs text-ink-soft">${Math.round(z.asking_cents_monthly / 100)}/mo</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link href="/home?f=cars" className="btn btn-signal btn-lg mt-4 w-full">See car campaigns<CaretRight size={18} weight="bold" aria-hidden /></Link>
      </section>

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
        <SectionTitle count={bookings.length}>Campaigns with this car</SectionTitle>
        {bookings.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Car campaigns show on Home. When your car qualifies, apply from the campaign.</p>
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
                    <span className="block truncate font-display text-[1.125rem] leading-tight font-700 tracking-[-0.02em]">
                      {b.campaign_title ?? `${b.business_name} car ad`}
                    </span>
                    <span className="block truncate text-sm text-ink-faint">{b.business_name}</span>
                    <span className={`mt-1 block font-display text-sm font-600 ${tone}`}>{state.label}</span>
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
