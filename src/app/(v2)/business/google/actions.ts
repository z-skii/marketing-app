"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import { runGoogleHealth, type GoogleHealth } from "@/lib/google/business";

/** Google Business checks for the active business. */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function message(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

export async function runGoogleHealthAction(): Promise<Result<GoogleHealth>> {
  const ctx = await requireBusinessContext("/business/google");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id);
    const data = await runGoogleHealth(ctx.activeBusiness.id);
    revalidatePath("/business/google");
    revalidatePath("/business");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: message(e, "Could not run the Google checks.") };
  }
}
