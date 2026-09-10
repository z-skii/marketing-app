"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import { runGoogleHealth, type GoogleHealth } from "@/lib/google/business";
import { addManualSnapshot, type ManualSnapshotInput, type Snapshot } from "@/lib/social/insights";

/** Google Business checks and manual growth numbers for the active business. */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function message(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

export async function runGoogleHealthAction(): Promise<Result<GoogleHealth>> {
  const ctx = await requireBusinessContext("/business/health");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id);
    const data = await runGoogleHealth(ctx.activeBusiness.id);
    revalidatePath("/business/health");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: message(e, "Could not run the Google checks.") };
  }
}

const PROVIDERS: ManualSnapshotInput["provider"][] = ["instagram", "facebook", "tiktok", "google_business"];

export async function addManualSnapshotAction(input: {
  provider: string;
  periodStart: string;
  periodEnd: string;
  reach?: number | null;
  followersDelta?: number | null;
  views?: number | null;
  engagementPct?: number | null;
  topPost?: { title: string; thumbnailUrl?: string | null; views?: number | null; href?: string | null } | null;
}): Promise<Result<Snapshot>> {
  const ctx = await requireBusinessContext("/business/health");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
    const provider = PROVIDERS.find((p) => p === input.provider);
    if (!provider) return { ok: false, error: "Pick a platform." };
    const data = await addManualSnapshot(ctx.activeBusiness.id, {
      provider,
      periodStart: input.periodStart.trim(),
      periodEnd: input.periodEnd.trim(),
      reach: input.reach ?? null,
      followersDelta: input.followersDelta ?? null,
      views: input.views ?? null,
      engagementPct: input.engagementPct ?? null,
      topPost: input.topPost ?? null,
    });
    revalidatePath("/business/health");
    revalidatePath("/business");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: message(e, "Could not save those numbers.") };
  }
}
