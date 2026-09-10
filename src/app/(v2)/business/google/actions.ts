"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import { NotConnectedError, runGoogleHealth, type GoogleHealth } from "@/lib/google/business";
import { applyFix } from "@/lib/google/fixes";
import { disconnectGoogle } from "@/lib/google/oauth";

/** Google Business checks and fixes for the active business. */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function message(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

function revalidateGoogle() {
  for (const p of ["/business/google", "/business", "/business/settings", "/business/settings/connections"]) revalidatePath(p);
}

export async function runGoogleHealthAction(): Promise<Result<GoogleHealth>> {
  const ctx = await requireBusinessContext("/business/google");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id);
    const data = await runGoogleHealth(ctx.activeBusiness.id);
    revalidateGoogle();
    return { ok: true, data };
  } catch (e) {
    if (e instanceof NotConnectedError) return { ok: false, error: "Connect Google first." };
    return { ok: false, error: message(e, "Could not run the Google check.") };
  }
}

/** One approved change, sent to Google with the business's own token. Never runs on its own. */
export async function applyGoogleFix(key: string, proposed: string): Promise<Result> {
  const ctx = await requireBusinessContext("/business/google");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
    await applyFix(ctx.activeBusiness.id, key, proposed);
    revalidateGoogle();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Google did not accept the change.") };
  }
}

export async function disconnectGoogleAction(): Promise<Result> {
  const ctx = await requireBusinessContext("/business/google");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
    await disconnectGoogle(ctx.activeBusiness.id);
    revalidateGoogle();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Could not disconnect Google.") };
  }
}
