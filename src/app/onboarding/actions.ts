"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { requireV2, setActiveBusiness } from "@/lib/v2/core";

/**
 * Onboarding writes everything in one shot: what the person wants to do,
 * their name and city, and optionally their first business. Instagram and
 * the car are added later from Profile, when a campaign needs them.
 */

export type OnboardingInput = {
  path: "earn" | "business" | "both";
  displayName: string;
  city: string;
  businessName?: string;
  businessCategory?: string;
  businessCity?: string;
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "business";
}

export async function completeOnboarding(input: OnboardingInput) {
  const ctx = await requireV2("/onboarding");
  const wantsEarn = input.path === "earn" || input.path === "both";
  const wantsBusiness = input.path === "business" || input.path === "both";
  const displayName = (input.displayName ?? "").trim().slice(0, 60);
  const city = (input.city ?? "").trim().slice(0, 60);
  const businessName = input.businessName?.trim().slice(0, 80);
  const businessCity = (input.businessCity ?? "").trim().slice(0, 60) || city;

  if (!wantsEarn && !wantsBusiness) return { ok: false, error: "Pick how you want to use TapMart." };
  if (displayName.length < 2) return { ok: false, error: "Add your name." };
  if (wantsBusiness && (!businessName || businessName.length < 2)) {
    return { ok: false, error: "Add your business name. You can fill in the rest later." };
  }

  await sql(
    `update profiles set wants_earn = $2, wants_business = $3, display_name = $4,
            city = nullif($5, ''), onboarded_at = coalesce(onboarded_at, now())
      where id = $1`,
    [ctx.user.id, wantsEarn, wantsBusiness, displayName, city],
  );

  let businessId: string | null = null;
  if (wantsBusiness && businessName) {
    // Slug collisions get a numeric suffix; the business page uses the slug.
    const base = slugify(businessName);
    for (let attempt = 0; attempt < 8; attempt++) {
      const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
      const existing = await sqlOne(`select 1 as x from businesses where lower(slug) = lower($1)`, [slug]);
      if (existing) continue;
      const business = await sqlOne<{ id: string }>(
        `insert into businesses (owner_id, name, slug, category, city)
         values ($1, $2, $3, nullif($4, ''), nullif($5, '')) returning id`,
        [ctx.user.id, businessName, slug, input.businessCategory?.trim().slice(0, 60) ?? "", businessCity],
      );
      await sql(
        `insert into business_members (business_id, profile_id, member_role)
         values ($1, $2, 'owner') on conflict do nothing`,
        [business!.id, ctx.user.id],
      );
      businessId = business!.id;
      break;
    }
  }

  // Business-only people land in Business mode. "Both" starts in user mode.
  if (businessId && !wantsEarn) {
    await setActiveBusiness(ctx.user.id, businessId);
    revalidatePath("/", "layout");
    redirect("/business");
  }
  redirect("/home");
}
