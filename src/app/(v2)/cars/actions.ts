"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql, sqlOne, transaction } from "@/lib/db";
import {
  ensureConversation, notify, requireBusinessMember, requireOnboarded, systemMessage,
} from "@/lib/v2/core";
import { payMarketplaceWork, InsufficientCreditError } from "@/lib/v2/money";
import { formatCredit } from "@/lib/money";
import { safeReturnPath } from "@/lib/v2/paths";
import { ZONES } from "./zones";

/**
 * Car advertising marketplace. Drivers own their vehicles; businesses make
 * offers; every workflow move re-checks who's allowed to make it and writes a
 * system line into the shared thread.
 */

type Result = { ok: boolean; error?: string };
const fail = (error: string): Result => ({ ok: false, error });

const ANGLES = ["front", "driver_side", "rear", "passenger_side"] as const;

// -------------------------------------------------------------- driver side

export type VehicleInput = {
  year: number; make: string; model: string; trim?: string; bodyType?: string;
  color?: string; monthlyMiles?: number; city: string; radiusMiles?: number;
  photos: { angle: string; url: string }[];
  zones: { zone: string; available: boolean; askingDollars?: number }[];
  publish: boolean;
  /** Where to land after creation (a campaign the person came from). Same-origin paths only. */
  returnTo?: string;
};

export async function createVehicle(input: VehicleInput) {
  const ctx = await requireOnboarded();
  const year = Math.round(input.year);
  const make = input.make.trim().slice(0, 40);
  const model = input.model.trim().slice(0, 40);
  if (year < 1960 || year > 2035 || !make || !model) {
    return { ok: false as const, error: "Add the year, make and model." };
  }
  const photos = (input.photos ?? [])
    .filter((p) => (ANGLES as readonly string[]).includes(p.angle) && typeof p.url === "string")
    .slice(0, 8);
  if (input.publish && photos.length < 4) {
    return { ok: false as const, error: "Add all four photos before listing: front, both sides, rear." };
  }
  const zones = (input.zones ?? []).filter((z) => (ZONES as readonly string[]).includes(z.zone));
  if (input.publish && !zones.some((z) => z.available)) {
    return { ok: false as const, error: "Mark at least one advertising area as available." };
  }

  const vehicleId = await transaction(async (client) => {
    const v = await client.query(
      `insert into vehicles (owner_id, year, make, model, trim, body_type, color,
                             monthly_miles, city, radius_miles, status)
       values ($1, $2, $3, $4, nullif($5, ''), nullif($6, ''), nullif($7, ''),
               $8, nullif($9, ''), $10, $11)
       returning id`,
      [
        ctx.user.id, year, make, model, input.trim?.trim().slice(0, 40) ?? "",
        input.bodyType?.trim().slice(0, 30) ?? "", input.color?.trim().slice(0, 30) ?? "",
        input.monthlyMiles ? Math.min(Math.round(input.monthlyMiles), 20000) : null,
        input.city.trim().slice(0, 60),
        input.radiusMiles ? Math.min(Math.round(input.radiusMiles), 500) : null,
        input.publish ? "listed" : "draft",
      ],
    );
    const id = v.rows[0].id as string;
    for (const p of photos) {
      await client.query(
        `insert into vehicle_photos (vehicle_id, angle, url) values ($1, $2, $3)`,
        [id, p.angle, p.url],
      );
    }
    for (const z of zones) {
      const asking = z.askingDollars && z.askingDollars > 0
        ? Math.round(z.askingDollars * 100) : null;
      await client.query(
        `insert into vehicle_zones (vehicle_id, zone, available, asking_cents_monthly)
         values ($1, $2::vehicle_zone_kind, $3, $4)
         on conflict (vehicle_id, zone) do update
           set available = excluded.available, asking_cents_monthly = excluded.asking_cents_monthly`,
        [id, z.zone, z.available, asking],
      );
    }
    return id;
  });

  const returnTo = safeReturnPath(input.returnTo);
  redirect(returnTo ?? `/me/vehicles/${vehicleId}`);
}

export async function setVehicleListed(vehicleId: string, listed: boolean): Promise<Result> {
  const ctx = await requireOnboarded();
  const updated = await sqlOne(
    `update vehicles set status = $3 where id = $1 and owner_id = $2 returning 1 as x`,
    [vehicleId, ctx.user.id, listed ? "listed" : "unlisted"],
  );
  if (!updated) return fail("Not your vehicle.");
  revalidatePath(`/me/vehicles/${vehicleId}`);
  return { ok: true };
}

export async function requestVehicleVerification(vehicleId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  const updated = await sqlOne(
    `update vehicles set verification = 'pending'
      where id = $1 and owner_id = $2 and verification in ('unverified', 'rejected')
      returning 1 as x`,
    [vehicleId, ctx.user.id],
  );
  if (!updated) return fail("Verification is already in progress or done.");
  revalidatePath(`/me/vehicles/${vehicleId}`);
  return { ok: true };
}

// ------------------------------------------------------------ business side

export async function makeCarOffer(input: {
  vehicleId: string; businessId: string; zones: string[];
  monthlyDollars: number; months: number; message?: string;
}): Promise<Result> {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, input.businessId, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  const vehicle = await sqlOne<{ owner_id: string; status: string; make: string; model: string; year: number }>(
    `select owner_id, status, make, model, year from vehicles where id = $1`,
    [input.vehicleId],
  );
  if (!vehicle || vehicle.status !== "listed") return fail("This vehicle isn't listed.");
  if (vehicle.owner_id === ctx.user.id) return fail("That's your own vehicle.");
  const zones = input.zones.filter((z) => (ZONES as readonly string[]).includes(z));
  if (zones.length === 0) return fail("Pick at least one placement.");
  const monthlyCents = Math.round(input.monthlyDollars * 100);
  if (!Number.isFinite(monthlyCents) || monthlyCents < 1000) return fail("Offer at least $10/month.");
  const months = Math.min(Math.max(Math.round(input.months) || 1, 1), 24);

  const offer = await sqlOne<{ id: string }>(
    `insert into car_offers (vehicle_id, business_id, created_by, zones, monthly_cents, months, message)
     values ($1, $2, $3, $4::vehicle_zone_kind[], $5, $6, nullif($7, '')) returning id`,
    [input.vehicleId, input.businessId, ctx.user.id, zones, monthlyCents, months,
     input.message?.trim().slice(0, 1000) ?? ""],
  );
  const business = await sqlOne<{ name: string }>(`select name from businesses where id = $1`, [input.businessId]);
  const conversation = await ensureConversation("offer", offer!.id, [ctx.user.id, vehicle.owner_id]);
  await systemMessage(conversation,
    `${business?.name ?? "A business"} offered ${formatCredit(monthlyCents)}/month for ${zones.length} placement${zones.length === 1 ? "" : "s"}.`);
  await notify(
    vehicle.owner_id, "car_offer",
    `${business?.name ?? "A business"} offered ${formatCredit(monthlyCents)}/month`,
    { body: `For your ${vehicle.year} ${vehicle.make} ${vehicle.model}.`, href: `/me/vehicles/${input.vehicleId}` },
  );
  revalidatePath(`/me/vehicles/${input.vehicleId}`);
  return { ok: true };
}

export async function respondToOffer(
  offerId: string,
  response: "accepted" | "declined" | "countered",
  counterDollars?: number,
): Promise<Result> {
  const ctx = await requireOnboarded();
  const offer = await sqlOne<{
    id: string; vehicle_id: string; business_id: string; owner_id: string;
    status: string; zones: string[]; monthly_cents: string; months: number; created_by: string | null;
  }>(
    `select o.id, o.vehicle_id, o.business_id, v.owner_id, o.status::text as status,
            o.zones::text[] as zones, o.monthly_cents::text as monthly_cents, o.months, o.created_by
       from car_offers o join vehicles v on v.id = o.vehicle_id where o.id = $1`,
    [offerId],
  );
  if (!offer) return fail("Offer not found.");
  if (offer.owner_id !== ctx.user.id) return fail("Only the vehicle's owner can respond.");
  if (!["sent", "countered"].includes(offer.status)) return fail("This offer was already decided.");

  if (response === "countered") {
    const cents = Math.round((counterDollars ?? 0) * 100);
    if (cents < 1000) return fail("Counter with at least $10/month.");
    await sql(
      `update car_offers set status = 'countered', counter_cents = $2 where id = $1`,
      [offerId, cents],
    );
    const conv = await ensureConversation("offer", offerId, [ctx.user.id, offer.created_by ?? ctx.user.id]);
    await systemMessage(conv, `Driver countered at ${formatCredit(cents)}/month.`);
    if (offer.created_by) {
      await notify(offer.created_by, "car_offer", `Counter-offer: ${formatCredit(cents)}/month`, {
        href: `/me/vehicles/${offer.vehicle_id}`,
      });
    }
    revalidatePath(`/me/vehicles/${offer.vehicle_id}`);
    return { ok: true };
  }

  await sql(
    `update car_offers set status = $2, decided_at = now() where id = $1`,
    [offerId, response],
  );

  if (response === "accepted") {
    const monthly = Number(offer.monthly_cents);
    await sqlOne(
      `insert into car_bookings (offer_id, vehicle_id, business_id, zones, monthly_cents)
       values ($1, $2, $3, $4::vehicle_zone_kind[], $5)
       on conflict (offer_id) do nothing returning id`,
      [offerId, offer.vehicle_id, offer.business_id, offer.zones, monthly],
    );
  }
  const conv = await ensureConversation("offer", offerId, [ctx.user.id, offer.created_by ?? ctx.user.id]);
  await systemMessage(conv, response === "accepted" ? "Offer accepted." : "Offer declined.");
  if (offer.created_by) {
    await notify(offer.created_by, "car_offer",
      response === "accepted" ? "Your car ad offer was accepted" : "Your car ad offer was declined",
      { href: `/me/vehicles/${offer.vehicle_id}` });
  }
  revalidatePath(`/me/vehicles/${offer.vehicle_id}`);
  return { ok: true };
}

/**
 * Booking counter-acceptance: when a driver counters, the business can accept
 * the counter (which rewrites the offer price) or walk away.
 */
export async function acceptCounter(offerId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  const offer = await sqlOne<{ business_id: string; vehicle_id: string; counter_cents: string | null; status: string; owner_id: string; zones: string[]; months: number }>(
    `select o.business_id, o.vehicle_id, o.counter_cents::text as counter_cents,
            o.status::text as status, v.owner_id, o.zones::text[] as zones, o.months
       from car_offers o join vehicles v on v.id = o.vehicle_id where o.id = $1`,
    [offerId],
  );
  if (!offer) return fail("Offer not found.");
  try {
    await requireBusinessMember(ctx.user.id, offer.business_id, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  if (offer.status !== "countered" || !offer.counter_cents) return fail("No counter to accept.");
  const cents = Number(offer.counter_cents);
  await sql(
    `update car_offers set monthly_cents = $2, status = 'accepted', decided_at = now() where id = $1`,
    [offerId, cents],
  );
  await sqlOne(
    `insert into car_bookings (offer_id, vehicle_id, business_id, zones, monthly_cents)
     values ($1, $2, $3, $4::vehicle_zone_kind[], $5)
     on conflict (offer_id) do nothing returning id`,
    [offerId, offer.vehicle_id, offer.business_id, offer.zones, cents],
  );
  const conv = await ensureConversation("offer", offerId, [ctx.user.id, offer.owner_id]);
  await systemMessage(conv, `Counter accepted at ${formatCredit(cents)}/month. Booking created.`);
  await notify(offer.owner_id, "car_offer", "Your counter was accepted", { href: `/me/vehicles/${offer.vehicle_id}` });
  revalidatePath(`/me/vehicles/${offer.vehicle_id}`);
  return { ok: true };
}

// --------------------------------------------------------- booking workflow

const BOOKING_MOVES: Record<string, { to: string; by: "business" | "driver" | "either" }> = {
  creative_pending: { to: "installation_pending", by: "business" }, // artwork ready
  installation_pending: { to: "active", by: "business" },           // installed, pays first month
  active: { to: "completed", by: "business" },
  proof_required: { to: "active", by: "driver" },
};

export async function advanceBooking(bookingId: string, artworkUrl?: string): Promise<Result> {
  const ctx = await requireOnboarded();
  const booking = await sqlOne<{
    id: string; status: string; business_id: string; vehicle_id: string; campaign_id: string | null;
    owner_id: string; monthly_cents: string; offer_id: string; business_owner: string;
  }>(
    `select k.id, k.status::text as status, k.business_id, k.vehicle_id, k.campaign_id, v.owner_id,
            k.monthly_cents::text as monthly_cents, k.offer_id, b.owner_id as business_owner
       from car_bookings k
       join vehicles v on v.id = k.vehicle_id
       join businesses b on b.id = k.business_id
      where k.id = $1`,
    [bookingId],
  );
  if (!booking) return fail("Booking not found.");
  const move = BOOKING_MOVES[booking.status];
  if (!move) return fail("Nothing to advance.");

  const isDriver = booking.owner_id === ctx.user.id;
  let isBusiness = false;
  try {
    await requireBusinessMember(ctx.user.id, booking.business_id, ["owner", "manager"]);
    isBusiness = true;
  } catch { /* not a member */ }
  if (move.by === "business" && !isBusiness) return fail("Only the business can do this step.");
  if (move.by === "driver" && !isDriver) return fail("Only the driver can do this step.");
  if (!isDriver && !isBusiness) return fail("Not your booking.");

  // Going active bills the first month into the driver's earnings.
  if (booking.status === "installation_pending" && move.to === "active") {
    try {
      await payMarketplaceWork({
        payerId: booking.business_owner,
        workerId: booking.owner_id,
        amountCents: Number(booking.monthly_cents),
        source: "booking",
        sourceId: booking.id,
        memo: "Car ad, first month",
      });
    } catch (e) {
      if (e instanceof InsufficientCreditError) return fail(e.message);
      if (e instanceof Error && e.message.includes("already been paid")) { /* re-activation */ }
      else throw e;
    }
  }

  await sql(
    `update car_bookings set status = $2::car_booking_status,
            artwork_url = coalesce(nullif($3, ''), artwork_url),
            starts_on = case when $2 = 'active' and starts_on is null then current_date else starts_on end
      where id = $1`,
    [bookingId, move.to, artworkUrl ?? ""],
  );
  const conv = await ensureConversation("offer", booking.offer_id, [booking.owner_id, booking.business_owner]);
  const line =
    move.to === "installation_pending" ? "Artwork is ready. Installation next."
    : move.to === "active" ? "Campaign is live. First month paid."
    : move.to === "completed" ? "Campaign completed."
    : "Booking updated.";
  await systemMessage(conv, line);
  await notify(
    isDriver ? booking.business_owner : booking.owner_id,
    "car_booking", line,
    { href: isDriver
        ? (booking.campaign_id ? `/business/campaigns/${booking.campaign_id}` : "/business")
        : `/me/vehicles/${booking.vehicle_id}` },
  );
  revalidatePath(`/me/vehicles/${booking.vehicle_id}`);
  return { ok: true };
}

export async function payBookingMonth(bookingId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  const booking = await sqlOne<{
    status: string; business_id: string; owner_id: string; monthly_cents: string;
    vehicle_id: string; business_owner: string;
  }>(
    `select k.status::text as status, k.business_id, v.owner_id, k.monthly_cents::text as monthly_cents,
            k.vehicle_id, b.owner_id as business_owner
       from car_bookings k join vehicles v on v.id = k.vehicle_id
       join businesses b on b.id = k.business_id where k.id = $1`,
    [bookingId],
  );
  if (!booking) return fail("Booking not found.");
  try {
    await requireBusinessMember(ctx.user.id, booking.business_id, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  if (booking.status !== "active") return fail("The booking isn't active.");
  try {
    await payMarketplaceWork({
      payerId: booking.business_owner,
      workerId: booking.owner_id,
      amountCents: Number(booking.monthly_cents),
      source: "booking",
      sourceId: null, // repeat months are separate ledger entries
      memo: "Car ad, monthly payment",
    });
  } catch (e) {
    if (e instanceof InsufficientCreditError) return fail(e.message);
    throw e;
  }
  await notify(booking.owner_id, "car_booking", "Car ad month paid", { href: "/earnings" });
  revalidatePath(`/me/vehicles/${booking.vehicle_id}`);
  return { ok: true };
}

export async function addProof(
  bookingId: string,
  input: { kind: string; mediaUrl?: string; odometerMiles?: number; note?: string },
): Promise<Result> {
  const ctx = await requireOnboarded();
  const booking = await sqlOne<{ owner_id: string; vehicle_id: string; business_owner: string; campaign_id: string | null }>(
    `select v.owner_id, k.vehicle_id, k.campaign_id, b.owner_id as business_owner
       from car_bookings k join vehicles v on v.id = k.vehicle_id
       join businesses b on b.id = k.business_id where k.id = $1`,
    [bookingId],
  );
  if (!booking || booking.owner_id !== ctx.user.id) return fail("Not your booking.");
  if (!["installation", "periodic", "odometer"].includes(input.kind)) return fail("Bad proof type.");
  if (!input.mediaUrl && !input.odometerMiles) return fail("Add a photo or an odometer reading.");

  await sql(
    `insert into car_proofs (booking_id, kind, media_url, odometer_miles, note)
     values ($1, $2::car_proof_kind, $3, $4, nullif($5, ''))`,
    [bookingId, input.kind, input.mediaUrl ?? null,
     input.odometerMiles ? Math.round(input.odometerMiles) : null,
     input.note?.trim().slice(0, 500) ?? ""],
  );
  await notify(booking.business_owner, "car_booking", "New proof uploaded", {
    href: booking.campaign_id ? `/business/campaigns/${booking.campaign_id}` : "/business",
  });
  revalidatePath(`/me/vehicles/${booking.vehicle_id}`);
  return { ok: true };
}
