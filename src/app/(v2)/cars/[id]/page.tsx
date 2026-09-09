import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { notFound } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { Avatar, Chip, MetaLine, Money, SectionTitle, StatusChip } from "@/components/v2/ui";
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

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <BackButton fallback="/cars" label="Car Ads" />

      <header className="mt-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl leading-[0.98] font-900 tracking-[-0.03em]">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <span className="flex items-center gap-2">
            <StatusChip status={vehicle.status} />
            {vehicle.verification === "verified" && <Chip tone="rise">verified</Chip>}
          </span>
        </div>
        <MetaLine parts={[
          vehicle.color, vehicle.body_type, vehicle.trim,
          vehicle.monthly_miles ? `${vehicle.monthly_miles.toLocaleString()} mi/month` : null,
          vehicle.city && `${vehicle.city}${vehicle.radius_miles ? ` + ${vehicle.radius_miles} mi` : ""}`,
        ]} />
        <Link href={`/u/${vehicle.owner_username}`} className="mt-2 inline-flex items-center gap-2">
          <Avatar src={vehicle.owner_avatar} name={vehicle.owner_name ?? vehicle.owner_username} size={24} />
          <span className="font-mono text-xs text-ink-faint">@{vehicle.owner_username}</span>
        </Link>
      </header>

      {photos.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p.url} alt={`${p.angle.replaceAll("_", " ")} view`}
              className="h-36 w-52 shrink-0 border border-ink object-cover" />
          ))}
        </div>
      )}

      <section className="mt-5">
        <SectionTitle>Ad areas</SectionTitle>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {availableZones.map((z) => (
            <li key={z.zone} className="flex items-center justify-between border border-rule px-3 py-2 text-sm">
              {ZONE_LABELS[z.zone] ?? z.zone}
              {z.asking_cents_monthly != null
                ? <Money cents={z.asking_cents_monthly} suffix="/mo" />
                : <span className="font-mono text-[0.625rem] text-ink-faint">make offer</span>}
            </li>
          ))}
          {availableZones.length === 0 && (
            <li className="col-span-2 font-mono text-xs text-ink-faint">No areas marked available.</li>
          )}
        </ul>
      </section>

      {isOwner && (
        <section className="rule mt-5 pt-4">
          <OwnerControls vehicleId={vehicle.id} status={vehicle.status} verification={vehicle.verification} />
          {vehicle.verification === "pending" && (
            <p className="mt-2 font-mono text-[0.625rem] text-ink-faint">
              Verification requested — an admin reviews your photos, usually within a day.
            </p>
          )}
        </section>
      )}

      {canOffer && (
        <section className="mt-6">
          <OfferForm
            vehicleId={vehicle.id}
            businesses={ctx.businesses.map((b) => ({ id: b.id, name: b.name }))}
            availableZones={availableZones}
          />
        </section>
      )}

      {(isOwner || offers.some((o) => o.mine)) && offers.length > 0 && (
        <section className="rule mt-6 pt-5">
          <SectionTitle count={offers.length}>Offers</SectionTitle>
          <ul className="mt-2 flex flex-col gap-2">
            {offers.map((o) => (
              <li key={o.id} className="border border-rule p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-600">{o.business_name}</span>
                  <StatusChip status={o.status} />
                  <span className="ml-auto"><Money cents={o.monthly_cents} suffix="/mo" /></span>
                </div>
                <MetaLine parts={[
                  o.zones.map((z) => ZONE_LABELS[z] ?? z).join(" + "),
                  `${o.months} month${o.months === 1 ? "" : "s"}`,
                  o.counter_cents != null ? `driver countered $${Math.round(o.counter_cents / 100)}/mo` : null,
                ]} />
                {o.message && <p className="mt-1.5 text-sm text-ink-faint">{o.message}</p>}
                {isOwner && ["sent"].includes(o.status) && <OfferResponse offerId={o.id} />}
                {o.mine && o.status === "countered" && (
                  <div className="mt-2"><AcceptCounterButton offerId={o.id} /></div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {visibleBookings.length > 0 && (
        <section className="rule mt-6 pt-5">
          <SectionTitle count={visibleBookings.length}>Campaigns on this car</SectionTitle>
          <ul className="mt-2 flex flex-col gap-2">
            {visibleBookings.map((b) => (
              <li key={b.id} className="border border-rule p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-600">{b.business_name}</span>
                  <StatusChip status={b.status} />
                  <span className="ml-auto"><Money cents={b.monthly_cents} suffix="/mo" /></span>
                </div>
                <MetaLine parts={[
                  b.zones.map((z) => ZONE_LABELS[z] ?? z).join(" + "),
                  b.starts_on ? `since ${new Date(b.starts_on).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "not started",
                  `${b.proof_count} proof${b.proof_count === 1 ? "" : "s"}`,
                ]} />
                <BookingControls bookingId={b.id} status={b.status} isBusiness={b.mine} isDriver={isOwner} />
                {b.status === "completed" && (isOwner || b.mine) && (
                  <div className="mt-2"><ReviewStars contextType="booking" contextId={b.id} /></div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
