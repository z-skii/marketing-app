"use server";

import { requireBusinessContext } from "@/lib/v2/core";
import { makeCarOffer } from "../../cars/actions";

/**
 * A business sends an offer for a listed car from the ad preview. Money and
 * zones are validated by the shared offer action; this wrapper only adds the
 * active business and folds the chosen artwork into the message, since
 * car_offers has no artwork column and migrations are out of scope here.
 */

type Result = { ok: boolean; error?: string };

const ARTWORK_PREFIX = "Artwork: ";

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
  const monthlyDollars = Number(input.monthlyDollars);
  if (!Number.isFinite(monthlyDollars) || monthlyDollars <= 0) return { ok: false, error: "Add a monthly amount." };
  const months = Math.min(Math.max(Math.round(Number(input.months)) || 1, 1), 12);
  const zones = Array.isArray(input.zones) ? input.zones.filter((z) => typeof z === "string").slice(0, 10) : [];
  const artwork = cleanArtworkUrl(input.artworkUrl);
  const text = typeof input.message === "string" ? input.message.trim().slice(0, 900) : "";
  const message = artwork ? `${ARTWORK_PREFIX}${artwork}${text ? `\n\n${text}` : ""}` : text;
  return makeCarOffer({
    vehicleId, businessId: ctx.activeBusiness.id, zones, monthlyDollars, months, message,
  });
}
