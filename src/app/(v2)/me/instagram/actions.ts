"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireOnboarded } from "@/lib/v2/core";
import { connectInstagramManually, disconnectInstagram } from "@/lib/v2/instagram";
import { safeReturnPath } from "@/lib/v2/paths";

/**
 * A person's Instagram. The manual path records a handle that waits for a
 * TapMart check; the OAuth path lives in /api/oauth/instagram-user.
 */

type Result = { ok: boolean; error?: string };

export async function connectInstagram(input: { handle: string; followers: string; returnTo?: string }): Promise<Result> {
  const ctx = await requireOnboarded("/me/instagram");
  const followersClean = input.followers.replace(/[^\d]/g, "");
  const followers = followersClean ? Math.min(Number(followersClean), 500_000_000) : null;
  if (!input.handle.trim()) return { ok: false, error: "Add your Instagram handle." };
  try {
    await connectInstagramManually(ctx.user.id, input.handle, followers);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save that handle." };
  }
  revalidatePath("/me/instagram");
  revalidatePath("/me");
  const returnTo = safeReturnPath(input.returnTo);
  if (returnTo) redirect(returnTo);
  return { ok: true };
}

export async function disconnectMyInstagram(): Promise<Result> {
  const ctx = await requireOnboarded("/me/instagram");
  await disconnectInstagram(ctx.user.id);
  revalidatePath("/me/instagram");
  revalidatePath("/me");
  return { ok: true };
}
