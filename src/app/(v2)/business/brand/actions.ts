"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import {
  approveBrandKit, discardProposal, researchBrand,
  type BrandKit, type BrandProposal, type BrandResearch, type BrandSource, type ExistingSignals,
} from "@/lib/business/brand";

/**
 * Brand kit actions for the active business. Research gathers only real
 * sources and writes a proposal; nothing changes the kit in use until
 * approveBrand runs.
 */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function message(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

async function editor() {
  const ctx = await requireBusinessContext("/business/brand");
  await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
  return ctx.activeBusiness.id;
}

export async function researchBrandAction(input: { photoUrls?: string[]; notes?: string }): Promise<Result<{
  research: BrandResearch; signals: ExistingSignals; proposal: BrandProposal; source: BrandSource;
}>> {
  try {
    const businessId = await editor();
    const data = await researchBrand(businessId, {
      photoUrls: (input.photoUrls ?? []).map((u) => u.trim().slice(0, 500)).filter(Boolean).slice(0, 8),
      notes: input.notes?.trim().slice(0, 1000) || null,
    });
    revalidatePath("/business/brand");
    revalidatePath("/business/settings");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: message(e, "Could not research the brand.") };
  }
}

const URL_RE = /^https?:\/\/[^\s]+$/i;

/** Save the website on the business profile so research (and Google fixes) can use it. */
export async function saveWebsite(website: string): Promise<Result<{ website: string | null }>> {
  try {
    const businessId = await editor();
    let clean = website.trim().slice(0, 200);
    if (clean && !/^https?:\/\//i.test(clean)) clean = `https://${clean}`;
    if (clean && !URL_RE.test(clean)) return { ok: false, error: "That does not look like a website address." };
    await sql(`update businesses set website = $2, updated_at = now() where id = $1`, [businessId, clean || null]);
    revalidatePath("/business/brand");
    revalidatePath("/business/edit");
    return { ok: true, data: { website: clean || null } };
  } catch (e) {
    return { ok: false, error: message(e, "Could not save the website.") };
  }
}

/** Save an uploaded logo on the business profile. */
export async function saveLogo(logoUrl: string): Promise<Result<{ logoUrl: string }>> {
  try {
    const businessId = await editor();
    const clean = logoUrl.trim().slice(0, 500);
    if (!clean) return { ok: false, error: "Upload a logo first." };
    await sql(`update businesses set logo_url = $2, updated_at = now() where id = $1`, [businessId, clean]);
    revalidatePath("/business/brand");
    revalidatePath("/business");
    return { ok: true, data: { logoUrl: clean } };
  } catch (e) {
    return { ok: false, error: message(e, "Could not save the logo.") };
  }
}

export async function approveBrand(): Promise<Result<BrandKit>> {
  try {
    const businessId = await editor();
    const kit = await approveBrandKit(businessId);
    revalidatePath("/business/brand");
    revalidatePath("/business");
    revalidatePath("/business/settings");
    return { ok: true, data: kit };
  } catch (e) {
    return { ok: false, error: message(e, "Could not approve the kit.") };
  }
}

export async function discardBrand(): Promise<Result> {
  try {
    const businessId = await editor();
    await discardProposal(businessId);
    revalidatePath("/business/brand");
    revalidatePath("/business/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Could not discard the proposal.") };
  }
}
