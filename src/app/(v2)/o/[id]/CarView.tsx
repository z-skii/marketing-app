import Link from "next/link";
import { sqlOne } from "@/lib/db";
import type { V2Context } from "@/lib/v2/core";
import {
  fmtDate, getMyVehicles, vehicleQualifies, type Opportunity, type VehicleSummary,
} from "@/lib/v2/opportunities";
import { Avatar, Money } from "@/components/v2/ui";
import { NoPhoto, placementLabel } from "@/components/v2/EarnCards";
import { ApplyVehicleButton, BookingProofForm, WithdrawCarButton } from "./Controls";
import { BusinessRow, StateCard, StickyCta, TopBar, WhatToDo } from "./shared";

/**
 * Drive with a campaign: the artwork on the business's photo, the monthly
 * pay, then the person's own cars checked against what the business wants.
 * After applying, the booking's progress shows here in plain words.
 */
export async function CarView({ o, ctx, open }: { o: Opportunity; ctx: V2Context; open: boolean }) {
  const [vehicles, application] = await Promise.all([
    getMyVehicles(ctx.user.id),
    sqlOne<{ id: string; status: string; vehicle_id: string | null }>(
      `select id, status::text as status, vehicle_id from applications
        where campaign_id = $1 and applicant_id = $2`,
      [o.id, ctx.user.id],
    ),
  ]);
  // A booking exists after an accepted application, or after an accepted
  // direct request (which creates the booking without an application).
  const booking = await sqlOne<{ id: string; status: string; ends_on: string | null; starts_on: string | null; vehicle_id: string }>(
    `select k.id, k.status::text as status, k.ends_on, k.starts_on, k.vehicle_id
       from car_bookings k join vehicles v on v.id = k.vehicle_id
      where k.campaign_id = $1 and v.owner_id = $2
      order by k.created_at desc limit 1`,
    [o.id, ctx.user.id],
  );
  const direct = !application && booking ? { id: booking.id, status: "accepted", vehicle_id: booking.vehicle_id } : null;

  const art = o.details.artwork_url ?? null;
  const duration = o.details.duration_days ?? 30;
  const prefs = o.details.vehicle_prefs ?? {};
  const placements = (o.details.placements ?? []).map(placementLabel);
  const facts = [
    o.city,
    `${duration}-day campaign`,
    placements.length ? placements.join(", ") : null,
    prefs.colors?.length ? `${prefs.colors.join(" or ").toLowerCase()} vehicles preferred` : null,
    prefs.body_types?.length ? `${prefs.body_types.join(" or ").toLowerCase()} preferred` : null,
  ].filter(Boolean) as string[];

  // "withdrawn" behaves like no application: the person can apply again.
  const live = application && application.status !== "withdrawn" ? application : direct;
  const checks = vehicles.map((v) => ({ v, q: vehicleQualifies(v, o) }));
  const firstMatch = checks.find((c) => c.q.ok);
  const appliedWith = live ? vehicles.find((v) => v.id === live.vehicle_id) ?? null : null;

  const sticky = live || !open
    ? null
    : vehicles.length === 0
      ? { href: `/me/vehicles/new?return=${encodeURIComponent(`/o/${o.id}`)}`, label: "Add my car" }
      : firstMatch ? { href: "#apply", label: "Apply with my car" } : null;

  return (
    <main id="main" className={`mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8 ${sticky ? "pb-32 rail:pb-8" : ""}`}>
      <TopBar o={o} open={open} />

      {/* Hero: the business's photo with the artwork set into it. */}
      <div className="card mt-4 overflow-hidden">
        <div className="relative aspect-[4/3] w-full bg-surface-2 md:aspect-[2/1]">
          {o.business_cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={o.business_cover} alt="" className="h-full w-full object-cover" fetchPriority="high" />
          ) : (
            <NoPhoto name={o.business_name} logo={o.business_logo} />
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
          <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">Car ad</span>
          {art && (
            <span className="glass-tag absolute right-4 bottom-4 flex items-center gap-3 rounded-[12px] p-1.5 pr-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art} alt="The artwork that goes on the car" className="h-16 w-32 rounded-[8px] object-cover md:h-20 md:w-40" />
              <span className="font-display text-sm font-700 text-ink">The artwork</span>
            </span>
          )}
        </div>
        <div className="p-5">
          <Money cents={o.pay_cents} size="hero" suffix="/ month" />
          <h1 className="mt-2 font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em] md:text-[2rem]">
            Drivers wanted for this campaign
          </h1>
          <BusinessRow o={o} />
          <p className="mt-3 text-sm text-ink-faint">{facts.join("  ·  ")}</p>
        </div>
      </div>

      <WhatToDo items={o.requirements} />
      

      <section className="mt-8">
        {live?.status === "applied" && (
          <StateCard
            title={appliedWith ? `Applied with your ${appliedWith.make} ${appliedWith.model}` : "Applied"}
            body="Waiting for the business to pick drivers. You will hear back here and in Activity."
          >
            <div className="mt-3"><WithdrawCarButton campaignId={o.id} /></div>
          </StateCard>
        )}
        {live?.status === "declined" && (
          <StateCard title="Not selected this time" body="The business went with other drivers. Your car stays listed for the next campaign.">
            <Link href="/home?f=cars" className="btn btn-sm mt-3">Other car campaigns</Link>
          </StateCard>
        )}
        {live?.status === "accepted" && <BookingState booking={booking} vehicle={appliedWith} />}

        {!live && (
          vehicles.length === 0 ? (
            <StateCard title="To apply, add your vehicle" body="Year, make, model, four photos and the areas you would let a business use. Takes about five minutes, once.">
              <Link href={`/me/vehicles/new?return=${encodeURIComponent(`/o/${o.id}`)}`} className="btn btn-signal btn-lg mt-4 w-full md:w-auto">Add my car</Link>
            </StateCard>
          ) : (
            <>
              <h2 className="eyebrow">Your {vehicles.length === 1 ? "car" : "cars"}</h2>
              <ul className="row-list mt-2">
                {checks.map(({ v, q }, i) => (
                  <li key={v.id} className={`card p-4 ${q.ok && open ? "card-signal" : ""}`}>
                    <div className="flex items-center gap-3">
                      <VehicleThumb v={v} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-[1.0625rem] font-800 tracking-[-0.02em]">{v.year} {v.make} {v.model}</span>
                        {q.ok ? (
                          <span className="block text-sm font-600 text-signal">Your {v.make} {v.model} qualifies ✓</span>
                        ) : (
                          <span className="block text-sm text-ink-faint">Does not fit this campaign</span>
                        )}
                      </span>
                    </div>
                    {!q.ok && (
                      <ul className="mt-3 flex flex-col gap-1 text-sm text-ink-soft">
                        {q.reasons.map((r) => <li key={r}>{r}</li>)}
                      </ul>
                    )}
                    {!q.ok && v.status !== "listed" && (
                      <Link href={`/me/vehicles/${v.id}`} className="btn btn-sm mt-3">Finish my car</Link>
                    )}
                    {q.ok && open && (
                      <ApplyVehicleButton campaignId={o.id} vehicleId={v.id} first={firstMatch?.v.id === v.id && i >= 0} />
                    )}
                    {q.ok && !open && <p className="mt-3 text-sm text-ink-faint">This campaign is closed.</p>}
                  </li>
                ))}
              </ul>
            </>
          )
        )}
      </section>

      {sticky && <StickyCta cents={o.pay_cents} suffix="a month" href={sticky.href} label={sticky.label} />}
    </main>
  );
}

function VehicleThumb({ v }: { v: VehicleSummary }) {
  if (v.photo_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={v.photo_url} alt="" className="h-14 w-14 shrink-0 rounded-[12px] object-cover" />;
  }
  return <Avatar name={v.make} size={56} />;
}

const BOOKING_COPY: Record<string, { title: string; body: string }> = {
  creative_pending: { title: "Accepted. Artwork is being prepared", body: "The business is getting the decal ready. Installation comes next." },
  installation_pending: { title: "Installation is next", body: "The business arranges a time and place with you. Once it is on, the first month is paid." },
  active: { title: "Running, paid monthly", body: "Each month goes to your earnings. Send a photo of the decal when the business asks." },
  proof_required: { title: "Upload a photo of the car", body: "The business wants to see the decal is still on. One clear photo is enough." },
  completed: { title: "Completed", body: "This campaign is done. Thanks for driving with it." },
  cancelled: { title: "Cancelled", body: "This booking was cancelled." },
  disputed: { title: "Under review", body: "TapMart is looking into this booking." },
};

function BookingState({
  booking, vehicle,
}: { booking: { id: string; status: string; ends_on: string | null; starts_on: string | null } | null; vehicle: VehicleSummary | null }) {
  if (!booking) {
    return <StateCard title="Accepted" body="The business picked your car and is setting things up. Details follow here." />;
  }
  const copy = BOOKING_COPY[booking.status] ?? { title: booking.status.replaceAll("_", " "), body: "" };
  const dates = [
    booking.starts_on ? `Since ${fmtDate(booking.starts_on)}` : null,
    booking.ends_on ? `Until ${fmtDate(booking.ends_on)}` : null,
  ].filter(Boolean).join("  ·  ");
  return (
    <StateCard
      title={copy.title}
      body={[vehicle ? `Your ${vehicle.year} ${vehicle.make} ${vehicle.model}.` : null, copy.body].filter(Boolean).join(" ")}
      tone={booking.status === "proof_required" ? "signal" : "plain"}
    >
      {dates && <p className="mt-2 text-sm text-ink-faint">{dates}</p>}
      {booking.status === "proof_required" && <BookingProofForm bookingId={booking.id} />}
      {booking.status === "active" && (
        <Link href="/earnings" className="btn btn-sm mt-3">See earnings</Link>
      )}
    </StateCard>
  );
}
