"use server";

import { redirect } from "next/navigation";
import { sql, sqlOne, transaction } from "@/lib/db";
import { requireV2 } from "@/lib/v2/core";

/**
 * Onboarding writes everything in one shot: capability flags, city,
 * earning interests (creator profile), and optionally the person's first
 * business. Advanced setup happens later, inside the product.
 */

export type OnboardingInput = {
  path: "earn" | "business" | "both";
  city: string;
  interests: string[]; // content, photography, videography, car_ads, ugc
  businessName?: string;
  businessCategory?: string;
};

const INTERESTS = ["content", "photography", "videography", "car_ads", "ugc"];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "business";
}

export async function completeOnboarding(input: OnboardingInput) {
  const ctx = await requireV2("/onboarding");
  const wantsEarn = input.path === "earn" || input.path === "both";
  const wantsBusiness = input.path === "business" || input.path === "both";
  const city = input.city.trim().slice(0, 60);
  const interests = (input.interests ?? []).filter((i) => INTERESTS.includes(i)).slice(0, 5);
  const businessName = input.businessName?.trim().slice(0, 80);

  if (!wantsEarn && !wantsBusiness) return { ok: false, error: "Pick what brings you here." };
  if (wantsBusiness && (!businessName || businessName.length < 2)) {
    return { ok: false, error: "Add your business name — you can fill in the rest later." };
  }

  await transaction(async (client) => {
    await client.query(
      `update profiles set wants_earn = $2, wants_business = $3,
              city = nullif($4, ''), onboarded_at = coalesce(onboarded_at, now())
        where id = $1`,
      [ctx.user.id, wantsEarn, wantsBusiness, city],
    );
    if (wantsEarn && interests.length > 0) {
      await client.query(
        `insert into creator_profiles (profile_id, categories)
         values ($1, $2)
         on conflict (profile_id) do update set categories = excluded.categories`,
        [ctx.user.id, interests],
      );
    }
  });

  if (wantsBusiness && businessName) {
    // Slug collisions get a numeric suffix; the business page uses the slug.
    const base = slugify(businessName);
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
      const existing = await sqlOne(`select 1 as x from businesses where lower(slug) = lower($1)`, [slug]);
      if (existing) continue;
      const business = await sqlOne<{ id: string }>(
        `insert into businesses (owner_id, name, slug, category, city)
         values ($1, $2, $3, nullif($4, ''), nullif($5, '')) returning id`,
        [ctx.user.id, businessName, slug, input.businessCategory?.trim().slice(0, 60) ?? "", city],
      );
      await sql(
        `insert into business_members (business_id, profile_id, member_role)
         values ($1, $2, 'owner') on conflict do nothing`,
        [business!.id, ctx.user.id],
      );
      break;
    }
  }

  redirect(wantsBusiness ? "/business" : "/home");
}
