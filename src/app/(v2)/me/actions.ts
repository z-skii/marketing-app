"use server";

import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { requireOnboarded, requireV2 } from "@/lib/v2/core";

/** Profile, creator profile and portfolio management — always self-scoped. */

type Result = { ok: boolean; error?: string };

export async function updateProfile(input: {
  displayName: string; bio: string; city: string; avatarUrl: string;
}): Promise<Result> {
  const ctx = await requireV2();
  await sql(
    `update profiles set display_name = nullif($2, ''), bio = nullif($3, ''),
            city = nullif($4, ''), avatar_url = coalesce(nullif($5, ''), avatar_url)
      where id = $1`,
    [ctx.user.id, input.displayName.trim().slice(0, 60), input.bio.trim().slice(0, 500),
     input.city.trim().slice(0, 60), input.avatarUrl.trim().slice(0, 500)],
  );
  revalidatePath("/me");
  return { ok: true };
}

const CATEGORIES = ["content", "photography", "videography", "car_ads", "ugc", "drone", "editing", "social"];

export async function updateCreatorProfile(input: {
  categories: string[]; serviceRadius?: number; portfolioUrl: string;
  equipment: string; pricingNote: string;
}): Promise<Result> {
  const ctx = await requireOnboarded();
  const categories = (input.categories ?? []).filter((c) => CATEGORIES.includes(c)).slice(0, 8);
  await sql(
    `insert into creator_profiles (profile_id, categories, service_radius_miles, portfolio_url, equipment, pricing_note)
     values ($1, $2, $3, nullif($4, ''), nullif($5, ''), nullif($6, ''))
     on conflict (profile_id) do update set
       categories = excluded.categories,
       service_radius_miles = excluded.service_radius_miles,
       portfolio_url = excluded.portfolio_url,
       equipment = excluded.equipment,
       pricing_note = excluded.pricing_note`,
    [ctx.user.id, categories,
     input.serviceRadius ? Math.min(Math.max(Math.round(input.serviceRadius), 1), 500) : null,
     input.portfolioUrl.trim().slice(0, 300), input.equipment.trim().slice(0, 500),
     input.pricingNote.trim().slice(0, 500)],
  );
  await sql(`update profiles set wants_earn = true where id = $1`, [ctx.user.id]);
  revalidatePath("/me/creator");
  return { ok: true };
}

export async function requestCreatorVerification(): Promise<Result> {
  const ctx = await requireOnboarded();
  const updated = await sqlOne(
    `update creator_profiles set verification = 'pending'
      where profile_id = $1 and verification in ('unverified', 'rejected')
      returning 1 as x`,
    [ctx.user.id],
  );
  if (!updated) return { ok: false, error: "Save your creator profile first, or verification is already pending/done." };
  revalidatePath("/me/creator");
  return { ok: true };
}

export async function addPortfolioItem(mediaUrl: string, caption: string): Promise<Result> {
  const ctx = await requireOnboarded();
  if (!mediaUrl.trim()) return { ok: false, error: "Upload something first." };
  const count = await sqlOne<{ n: string }>(
    `select count(*)::text as n from portfolio_items where profile_id = $1`, [ctx.user.id],
  );
  if (Number(count?.n ?? 0) >= 24) return { ok: false, error: "Portfolio is full (24 items) — remove one first." };
  await sql(
    `insert into portfolio_items (profile_id, media_url, caption) values ($1, $2, nullif($3, ''))`,
    [ctx.user.id, mediaUrl.trim().slice(0, 500), caption.trim().slice(0, 200)],
  );
  revalidatePath("/me/portfolio");
  return { ok: true };
}

export async function removePortfolioItem(id: string): Promise<Result> {
  const ctx = await requireOnboarded();
  await sql(`delete from portfolio_items where id = $1 and profile_id = $2`, [id, ctx.user.id]);
  revalidatePath("/me/portfolio");
  return { ok: true };
}
