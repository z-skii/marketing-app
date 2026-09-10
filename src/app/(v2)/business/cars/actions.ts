"use server";

import { sqlOne } from "@/lib/db";
import { requireBusinessContext } from "@/lib/v2/core";
import { listInvitesForBusiness, sendInvite } from "@/lib/v2/requests";
import { formatCredit } from "@/lib/money";
import { ZONES } from "@/app/(v2)/cars/zones";

/**
 * A business makes an ad offer for one listed car. The offer is a direct
 * car_ads campaign (one slot, the owner as target, the car as target
 * vehicle) plus an invite. When the owner accepts, the requests library
 * creates the accepted car_offers row and the booking, so the existing
 * artwork, installation, proof and monthly-pay pipeline takes over.
 */

type Result = { ok: true; campaignId: string } | { ok: false; error: string };
const fail = (error: string): Result => ({ ok: false, error });

function cleanArtworkUrl(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const u = url.trim();
  if (!u || u.length > 2048) return null;
  if (u.startsWith("/uploads/") || u.startsWith("https://")) return u;
  return null;
}

export async function sendCarOffer(
  vehicleId: string,
  input: { zones: string[]; monthlyDollars: number; months: number; message?: string; artworkUrl?: string | null },
): Promise<Result> {
  const ctx = await requireBusinessContext(`/business/cars/${vehicleId}`);
  const business = ctx.activeBusiness;
  if (!["owner", "manager"].includes(business.member_role) && ctx.user.role !== "admin") return fail("Only owners and managers can send offers.");
  if (!/^[0-9a-f-]{36}$/i.test(vehicleId)) return fail("Pick a car first.");

  const vehicle = await sqlOne<{
    owner_id: string; status: string; available: boolean; year: number; make: string; model: string; city: string | null;
    suspended: boolean; business_owner: string; open_zones: string[] | null;
  }>(
    `select v.owner_id, v.status, v.available, v.year, v.make, v.model, v.city, p.suspended,
            (select owner_id from businesses where id = $2) as business_owner,
            (select array_agg(z.zone::text) from vehicle_zones z where z.vehicle_id = v.id and z.available) as open_zones
       from vehicles v join profiles p on p.id = v.owner_id where v.id = $1`,
    [vehicleId, business.id],
  );
  if (!vehicle || vehicle.status !== "listed") return fail("This car is not listed.");
  if (!vehicle.available) return fail("This car is not available right now.");
  if (vehicle.suspended) return fail("This account is suspended.");
  if (vehicle.owner_id === ctx.user.id || vehicle.owner_id === vehicle.business_owner) return fail("That is your own car.");

  const open = new Set(vehicle.open_zones ?? []);
  const zones = Array.from(new Set((Array.isArray(input.zones) ? input.zones : [])
    .filter((z): z is string => typeof z === "string" && (ZONES as readonly string[]).includes(z) && open.has(z)))).slice(0, 10);
  if (zones.length === 0) return fail("Pick at least one placement the owner has opened.");

  const monthlyCents = Math.round(Number(input.monthlyDollars) * 100);
  if (!Number.isFinite(monthlyCents) || monthlyCents < 2500 || monthlyCents > 500_000) return fail("Monthly pay must be between $25 and $5,000.");
  const months = Math.min(Math.max(Math.round(Number(input.months)) || 1, 1), 12);
  const artwork = cleanArtworkUrl(input.artworkUrl);
  const message = typeof input.message === "string" ? input.message.trim().slice(0, 900) : "";

  const pending = (await listInvitesForBusiness(business.id)).find((i) => i.vehicle_id === vehicleId && i.kind === "car_ads" && i.status === "sent");
  if (pending) return fail("You already sent an offer for this car. Wait for the answer or cancel it from the campaign.");

  const wallet = await sqlOne<{ cents: string }>(
    `select available_credit_cents::text as cents from wallets w join businesses b on b.owner_id = w.user_id where b.id = $1`,
    [business.id],
  );
  const available = Number(wallet?.cents ?? 0);
  if (available < monthlyCents) {
    return fail(`Add credit first. Paying one person costs ${formatCredit(monthlyCents)} and your campaign credit is ${formatCredit(available)}.`);
  }

  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const details = {
    placements: zones,
    duration_months: months,
    duration_days: months * 30,
    vehicle_prefs: { colors: [], body_types: [] },
    artwork_url: artwork,
  };
  const requirements = [`${months} month${months === 1 ? "" : "s"} campaign`, "One photo of the artwork each week"];
  const brief = message.length >= 20 ? message
    : `An ad for ${business.name} on your ${name}: ${zones.length} placement${zones.length === 1 ? "" : "s"} for ${months} month${months === 1 ? "" : "s"}, paid monthly.${message ? ` ${message}` : ""}`;

  const campaign = await sqlOne<{ id: string }>(
    `insert into campaigns
       (business_id, created_by, kind, title, brief, requirements, pay_cents, slots, city, details,
        status, published_at, audience, target_profile_id, target_vehicle_id)
     values ($1, $2, 'car_ads', $3, $4, $5, $6, 1, $7, $8::jsonb, 'open', now(), 'direct', $9, $10)
     returning id`,
    [business.id, ctx.user.id, `Car ad on ${name}`.slice(0, 120), brief, requirements, monthlyCents, vehicle.city, JSON.stringify(details), vehicle.owner_id, vehicleId],
  );
  if (!campaign) return fail("Could not create the offer.");

  await sendInvite({
    campaignId: campaign.id, businessId: business.id, businessName: business.name, profileId: vehicle.owner_id,
    vehicleId, kind: "car_ads", payCents: monthlyCents, message: message || null,
  });
  return { ok: true, campaignId: campaign.id };
}
