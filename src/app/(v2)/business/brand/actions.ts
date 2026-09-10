"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import {
  approveBrandKit, discardProposal, proposeBrandKit, type BrandKit, type BrandProposal, type BrandSource,
} from "@/lib/business/brand";

/**
 * Brand kit actions for the active business. A proposal (from the model or
 * a template) never changes the kit in use until approveBrand runs.
 */

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function message(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback;
}

export async function proposeBrand(input: {
  mode: "build" | "refine";
  website?: string;
  instagram?: string;
  logoUrl?: string;
  imageUrls?: string[];
  notes?: string;
}): Promise<Result<{ proposal: BrandProposal; source: BrandSource }>> {
  const ctx = await requireBusinessContext("/business/brand");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
    const data = await proposeBrandKit(ctx.activeBusiness.id, {
      mode: input.mode === "refine" ? "refine" : "build",
      website: input.website?.trim().slice(0, 200) || null,
      instagram: input.instagram?.trim().slice(0, 200) || null,
      logoUrl: input.logoUrl?.trim().slice(0, 500) || null,
      imageUrls: (input.imageUrls ?? []).map((u) => u.trim().slice(0, 500)).filter(Boolean).slice(0, 8),
      notes: input.notes?.trim().slice(0, 1000) || null,
    });
    revalidatePath("/business/brand");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: message(e, "Could not build a proposal.") };
  }
}

export async function approveBrand(): Promise<Result<BrandKit>> {
  const ctx = await requireBusinessContext("/business/brand");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
    const kit = await approveBrandKit(ctx.activeBusiness.id);
    revalidatePath("/business/brand");
    revalidatePath("/business");
    return { ok: true, data: kit };
  } catch (e) {
    return { ok: false, error: message(e, "Could not approve the kit.") };
  }
}

export async function discardBrand(): Promise<Result> {
  const ctx = await requireBusinessContext("/business/brand");
  try {
    await requireBusinessMember(ctx.user.id, ctx.activeBusiness.id, ["owner", "manager"]);
    await discardProposal(ctx.activeBusiness.id);
    revalidatePath("/business/brand");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: message(e, "Could not discard the proposal.") };
  }
}
