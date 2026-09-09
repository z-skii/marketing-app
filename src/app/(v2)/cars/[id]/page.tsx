import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { Avatar, MetaLine, Money, SectionTitle, StatusChip } from "@/components/v2/ui";
import { ZONE_LABELS } from "../zones";
import {
  AcceptCounterButton, BookingControls, OfferForm, OfferResponse, OwnerControls,
} from "./CarActions";
import { ReviewStars } from "../../jobs/[id]/CampaignActions";

export const dynamic = "force-dynamic";

type Vehicle = {
  id: string; owner_id: string; year: number; make: string; model: string; trim: string | null;
  body_type: string | null; color: string | null; monthly_miles: number | null; city: string | null;
  radius_miles: number | null; status: string; verification: string;
  owner_username: string; owner_name: string | null; owner_avatar: string | null;
};

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const [ctx, { id }] = await Promise.all([getV2Context(), params]);
  if (!ctx) return null;

  const vehicle = await sqlOne<Vehicle>(
    `select v.id, v.owner_id, v.year, v.make, v.model, v.trim, v.body_type, v.color,
            v.monthly_miles, v.city, v.radius_miles, v.status, v.verification::text as verification,
            p.username as owner_username, p.display_name as owner_name, p.avatar_url as owner_avatar
       from vehicles v join profiles p on p.id = v.owner_id where v.id = $1`,
    [id],
  );
  if (!vehicle) notFound();
  const isOwner = vehicle.owner_id === ctx.user.id;
  if (!isOwner && vehicle.status === "draft" && ctx.user.role !== "admin") notFound();

  const [photos, zones, offers, bookings] = await Promise.all([
    sql<{ angle: string; url: string }>(
      `select angle, url from vehicle_photos where vehicle_id = $1 order by created_at`, [id],
    ),
    sql<{ zone: string; available: boolean; asking_cents_monthly: number | null }>(
      `select zone::text as zone, available, asking_cents_monthly::int as asking_cents_monthly
         from vehicle_zones where vehicle_id = $1 order by zone`, [id],
    ),
    sql<{
      id: string; business_id: string; business_name: string; zones: string[];
      monthly_cents: number; months: number; message: string | null; status: string;
      counter_cents: number | null; created_at: string; mine: boolean;
    }>(
      `select o.id, o.business_id, b.name as business_name, o.zones::text[] as zones,
              o.monthly_cents::int as monthly_cents, o.months, o.message, o.status::text as status,
              o.counter_cents::int as counter_cents, o.created_at,
              exists (select 1 from business_members m
                       where m.business_id = o.business_id and m.profile_id = $2) as mine
         from car_offers o join businesses b on b.id = o.business_id
        where o.vehicle_id = $1
          and ($3 or o.status in ('sent', 'countered', 'accepted')
               or exists (select 1 from business_members m2
                           where m2.business_id = o.business_id and m2.profile_id = $2))
        order by o.created_at desc`,
      [id, ctx.user.id, isOwner],
    ),
    sql<{
      id: string; status: string; monthly_cents: number; zones: string[];
      starts_on: string | null; business_name: string; business_id: string; mine: boolean;
      proof_count: number;
    }>(
      `select k.id, k.status::text as status, k.monthly_cents::int as monthly_cents,
              k.zones::text[] as zones, k.starts_on, b.name as business_name, k.business_id,
              exists (select 1 from business_members m
                       where m.business_id = k.business_id and m.profile_id = $2) as mine,
              (select count(*) from car_proofs cp where cp.booking_id = k.id)::int as proof_count
         from car_bookings k join businesses b on b.id = k.business_id
        where k.vehicle_id = $1
        order by k.created_at desc`,
      [id, ctx.user.id],
    ),
  ]);

  const visibleBookings = bookings.filter((b) => isOwner || b.mine || ctx.user.role === "admin");
  const availableZones = zones.filter((z) => z.available);
  const canOffer = !isOwner && ctx.businesses.length > 0 && vehicle.status === "listed";

  const hero = photos.find((p) => p.angle === "driver_side") ?? photos[0] ?? null;
  const rest = photos.filter((p) => p !== hero);
  const askingPrices = availableZones
    .map((z) => z.asking_cents_monthly)
    .filter((c): c is number => c != null);
  const lowestAsking = askingPrices.length > 0 ? Math.min(...askingPrices) : null;
  const ownerLabel = vehicle.owner_name ?? `@${vehicle.owner_username}`;
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/cars" label="Car Ads" />

      <div className="card mt-3 overflow-hidden">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2 md:aspect-[16/9]">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.url} alt={`${title}, ${hero.angle.replaceAll("_", " ")} view`} className="h-full w-full object-cover" fetchPriority="high" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,_var(--color-surface-2),_var(--color-surface)_70%)] text-sm text-ink-faint">
              No photo yet
            </div>
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="glass-tag px-2.5 py-1 font-display text-xs font-700 text-ink">
              {vehicle.status.replaceAll("_", " ")}
            </span>
            {vehicle.verification === "verified" && (
              <span className="glass-tag px-2.5 py-1 font-display text-xs font-700 text-rise">Verified</span>
            )}
          </div>
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
            {lowestAsking != null ? (
              <Money cents={lowestAsking} size="xl" suffix="/ month" />
            ) : (
              <span className="font-display text-lg font-700 text-ink">Make an offer</span>
            )}
            <span className="font-display text-sm font-700 text-ink">
              {availableZones.length} area{availableZones.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="p-4 pt-3.5">
          <h1 className="font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em] md:text-[2rem]">
            {title}
          </h1>
          <MetaLine className="mt-2" parts={[
            vehicle.color, vehicle.body_type, vehicle.trim,
            vehicle.monthly_miles ? `${vehicle.monthly_miles.toLocaleString()} miles a month` : null,
            vehicle.city && `${vehicle.city}${vehicle.radius_miles ? `, ${vehicle.radius_miles} mile radius` : ""}`,
          ]} />
        </div>
      </div>

      {rest.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {rest.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p.url} alt={`${p.angle.replaceAll("_", " ")} view`}
              className="h-24 w-32 shrink-0 rounded-[10px] object-cover" loading="lazy" />
          ))}
        </div>
      )}

      <Link href={`/u/${vehicle.owner_username}`} className="card mt-3 flex items-center gap-3 p-4">
        <Avatar src={vehicle.owner_avatar} name={vehicle.owner_name ?? vehicle.owner_username} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base font-700">{ownerLabel}</span>
          <span className="block text-sm text-ink-faint">Driver</span>
        </span>
        <span aria-hidden className="text-ink-faint">→</span>
      </Link>

      <section className="mt-6">
        <SectionTitle count={availableZones.length}>Ad areas</SectionTitle>
        <ul className="row-list mt-3">
          {availableZones.map((z) => (
            <li key={z.zone} className="card-2 flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-display text-[0.9375rem] font-600">{ZONE_LABELS[z.zone] ?? z.zone}</span>
              {z.asking_cents_monthly != null
                ? <Money cents={z.asking_cents_monthly} size="md" suffix="/ month" />
                : <span className="text-sm text-ink-faint">Make an offer</span>}
            </li>
          ))}
          {availableZones.length === 0 && (
            <li className="card-2 px-4 py-3 text-sm text-ink-faint">No areas marked available.</li>
          )}
        </ul>
      </section>

      {isOwner && (
        <section className="card mt-6 p-4">
          <h2 className="font-display text-[1.125rem] font-800 tracking-[-0.02em]">Your listing</h2>
          <div className="mt-3">
            <OwnerControls vehicleId={vehicle.id} status={vehicle.status} verification={vehicle.verification} />
          </div>
          {vehicle.verification === "pending" && (
            <p className="mt-3 text-sm text-ink-faint">
              Verification requested. An admin reviews your photos, usually within a day.
            </p>
          )}
        </section>
      )}

      {canOffer && (
        <section className="mt-6" id="offer">
          <OfferForm
            vehicleId={vehicle.id}
            businesses={ctx.businesses.map((b) => ({ id: b.id, name: b.name }))}
            availableZones={availableZones}
          />
        </section>
      )}

      {(isOwner || offers.some((o) => o.mine)) && offers.length > 0 && (
        <section className="mt-6">
          <SectionTitle count={offers.length}>Offers</SectionTitle>
          <ul className="row-list mt-3">
            {offers.map((o) => (
              <li key={o.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{o.business_name}</span>
                    <span className="mt-1.5 inline-flex"><StatusChip status={o.status} /></span>
                  </span>
                  <Money cents={o.monthly_cents} size="md" suffix="/ month" />
                </div>
                <MetaLine className="mt-2" parts={[
                  o.zones.map((z) => ZONE_LABELS[z] ?? z).join(" + "),
                  `${o.months} month${o.months === 1 ? "" : "s"}`,
                  o.counter_cents != null ? `Driver countered $${Math.round(o.counter_cents / 100)} a month` : null,
                ]} />
                {o.message && <p className="mt-2 text-sm text-ink-soft">{o.message}</p>}
                {isOwner && ["sent"].includes(o.status) && <OfferResponse offerId={o.id} />}
                {o.mine && o.status === "countered" && (
                  <div className="mt-3"><AcceptCounterButton offerId={o.id} /></div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {visibleBookings.length > 0 && (
        <section className="mt-6">
          <SectionTitle count={visibleBookings.length}>Campaigns on this car</SectionTitle>
          <ul className="row-list mt-3">
            {visibleBookings.map((b) => (
              <li key={b.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{b.business_name}</span>
                    <span className="mt-1.5 inline-flex"><StatusChip status={b.status} /></span>
                  </span>
                  <Money cents={b.monthly_cents} size="md" suffix="/ month" />
                </div>
                <MetaLine className="mt-2" parts={[
                  b.zones.map((z) => ZONE_LABELS[z] ?? z).join(" + "),
                  b.starts_on ? `Since ${new Date(b.starts_on).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Not started",
                  `${b.proof_count} proof${b.proof_count === 1 ? "" : "s"}`,
                ]} />
                <BookingControls bookingId={b.id} status={b.status} isBusiness={b.mine} isDriver={isOwner} />
                {b.status === "completed" && (isOwner || b.mine) && (
                  <div className="mt-3"><ReviewStars contextType="booking" contextId={b.id} /></div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
