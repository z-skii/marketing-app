"use server";

import { revalidatePath } from "next/cache";
import { sqlOne } from "@/lib/db";
import { requireOnboarded } from "@/lib/v2/core";

/** The owner's vehicle switches. Listing and verification live in cars/actions.ts. */

type Result = { ok: boolean; error?: string };

/** "Available for ads" on / off. Unavailable cars never qualify for a campaign. */
export async function setVehicleAvailable(vehicleId: string, available: boolean): Promise<Result> {
  const ctx = await requireOnboarded();
  const updated = await sqlOne(
    `update vehicles set available = $3 where id = $1 and owner_id = $2 returning 1 as x`,
    [vehicleId, ctx.user.id, Boolean(available)],
  );
  if (!updated) return { ok: false, error: "Not your vehicle." };
  revalidatePath(`/me/vehicles/${vehicleId}`);
  revalidatePath("/me/vehicles");
  revalidatePath("/me");
  return { ok: true };
}
