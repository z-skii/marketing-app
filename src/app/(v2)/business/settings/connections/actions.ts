"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import { disconnectGoogle, selectGoogleLocation } from "@/lib/google/oauth";
import { runGoogleHealth } from "@/lib/google/business";
import { disconnectInstagramBusiness, syncInstagramBusiness } from "@/lib/social/instagram-business";

/** Connection actions for the active business. Owners and managers only. */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function message(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

const PATHS = ["/business/settings/connections", "/business/settings", "/business", "/business/google", "/business/social", "/business/brand"];

function revalidateAll() {
  for (const p of PATHS) revalidatePath(p);
}

export async function disconnectConnection(provider: "google_business" | "instagram"): Promise<Result> {
  const ctx = await requireBusinessContext("/business/settings/connections");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
    if (provider === "google_business") await disconnectGoogle(ctx.activeBusiness.id);
    else await disconnectInstagramBusiness(ctx.activeBusiness.id);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Could not disconnect.") };
  }
}

/** The person picked a Google location; the connection becomes real and the first check runs. */
export async function chooseGoogleLocation(locationName: string): Promise<Result<{ title: string }>> {
  const ctx = await requireBusinessContext("/business/settings/connections/google");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
    const location = await selectGoogleLocation(ctx.activeBusiness.id, locationName);
    try {
      await runGoogleHealth(ctx.activeBusiness.id);
    } catch (e) {
      // The connection stands; the check can be run again from the Google screen.
      console.error("google: first check after connecting failed:", e);
    }
    revalidateAll();
    return { ok: true, data: { title: location.title } };
  } catch (e) {
    return { ok: false, error: message(e, "Could not use that location.") };
  }
}

export async function syncInstagramNow(): Promise<Result> {
  const ctx = await requireBusinessContext("/business/settings/connections");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
    await syncInstagramBusiness(ctx.activeBusiness.id);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Could not refresh Instagram.") };
  }
}
