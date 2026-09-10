"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sqlOne } from "@/lib/db";
import { requireBusinessContext } from "@/lib/v2/core";
import { settingInt } from "@/lib/settings";
import { generateBrief } from "@/lib/ai/brief";
import { saveBrief } from "@/lib/ai/briefs";
import { addManualTrend, archiveTrend, getTrendForBusiness } from "@/lib/trends";

/**
 * The Trends screen: paste a link, dismiss one, or turn one into a Recreate
 * campaign. Turning a trend into a campaign generates a brief (Claude when
 * configured, else the template, labelled as such), stores it, and sends the
 * business to the wizard with the brief loaded for review.
 */

type Result = { ok: boolean; error?: string };
const fail = (error: string): Result => ({ ok: false, error });

export async function addTrendUrl(formData: FormData): Promise<Result> {
  const ctx = await requireBusinessContext("/business/trends");
  const url = String(formData.get("url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim() || null;
  if (!/^https?:\/\/\S+$/i.test(url)) return fail("Paste the full link, starting with https://");
  try {
    await addManualTrend(ctx.activeBusiness.id, ctx.user.id, { url, title });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not add that link.");
  }
  revalidatePath("/business/trends");
  return { ok: true };
}

export async function dismissTrend(id: string): Promise<Result> {
  const ctx = await requireBusinessContext("/business/trends");
  if (id.startsWith("fixture-")) return { ok: true };
  const done = await archiveTrend(id, ctx.activeBusiness.id);
  if (!done) return fail("Only links you added can be removed.");
  revalidatePath("/business/trends");
  return { ok: true };
}

/** Generate a brief from a trend and open the Recreate wizard with it. */
export async function startRecreateFromTrend(trendId: string): Promise<never> {
  const ctx = await requireBusinessContext("/business/trends");
  const business = ctx.activeBusiness;
  const trend = await getTrendForBusiness(trendId, business.id);
  if (!trend) redirect("/business/trends?error=trend");

  const row = await sqlOne<{ name: string; category: string | null; city: string | null }>(
    `select name, category, city from businesses where id = $1`, [business.id],
  );
  const payCents = await settingInt("recreate_default_pay_cents");
  const { brief, source } = await generateBrief({
    businessName: row?.name ?? business.name,
    category: row?.category ?? null,
    city: row?.city ?? ctx.city,
    referenceUrl: trend.reference_url,
    referenceMediaUrl: trend.media_url ?? trend.thumbnail_url,
    referenceTitle: trend.title,
    trend,
  }, { payCents: payCents > 0 ? payCents : undefined });

  const briefId = await saveBrief({
    businessId: business.id,
    userId: ctx.user.id,
    trendId: trend.source === "fixture" ? null : trend.id,
    brief,
    source,
  });
  redirect(`/business/create/recreate?brief=${briefId}`);
}
