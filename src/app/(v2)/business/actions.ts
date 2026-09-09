"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { requireBusinessMember, requireOnboarded, setActiveBusiness } from "@/lib/v2/core";
import { refreshRecommendations } from "@/lib/v2/recommend";

/** Business management: profile, brand kit, calendar, connections, ideas. */

type Result = { ok: boolean; error?: string };
const fail = (error: string): Result => ({ ok: false, error });

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "business";
}

export async function createBusiness(input: { name: string; category?: string; city?: string }) {
  const ctx = await requireOnboarded();
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2) return { ok: false as const, error: "Give your business a name." };

  const base = slugify(name);
  for (let attempt = 0; attempt < 8; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await sqlOne(`select 1 as x from businesses where lower(slug) = lower($1)`, [slug]);
    if (taken) continue;
    const business = await sqlOne<{ id: string }>(
      `insert into businesses (owner_id, name, slug, category, city)
       values ($1, $2, $3, nullif($4, ''), nullif($5, '')) returning id`,
      [ctx.user.id, name, slug, input.category?.trim().slice(0, 60) ?? "", input.city?.trim().slice(0, 60) ?? ""],
    );
    await sql(
      `insert into business_members (business_id, profile_id, member_role)
       values ($1, $2, 'owner') on conflict do nothing`,
      [business!.id, ctx.user.id],
    );
    await sql(`update profiles set wants_business = true where id = $1`, [ctx.user.id]);
    await refreshRecommendations(business!.id);
    await setActiveBusiness(ctx.user.id, business!.id);
    redirect("/business");
  }
  return { ok: false as const, error: "Try a slightly different name." };
}

export type BusinessProfileInput = {
  businessId: string;
  name: string; category: string; description: string; address: string; city: string;
  phone: string; website: string; logoUrl: string; coverUrl: string;
  instagram: string; facebook: string; tiktok: string; google: string;
  brandColors: string; targetNote: string;
};

export async function updateBusinessProfile(input: BusinessProfileInput): Promise<Result> {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, input.businessId, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2) return fail("The business needs a name.");

  await sql(
    `update businesses set
       name = $2, category = nullif($3, ''), description = nullif($4, ''),
       address = nullif($5, ''), city = nullif($6, ''), phone = nullif($7, ''),
       website = nullif($8, ''), logo_url = nullif($9, ''), cover_url = nullif($10, ''),
       socials = jsonb_strip_nulls(jsonb_build_object(
         'instagram', nullif($11, ''), 'facebook', nullif($12, ''),
         'tiktok', nullif($13, ''), 'google', nullif($14, ''))),
       brand = jsonb_strip_nulls(jsonb_build_object('colors', nullif($15, ''))),
       target_note = nullif($16, ''),
       updated_at = now()
     where id = $1`,
    [
      input.businessId, name, input.category.trim().slice(0, 60),
      input.description.trim().slice(0, 2000), input.address.trim().slice(0, 200),
      input.city.trim().slice(0, 60), input.phone.trim().slice(0, 30),
      input.website.trim().slice(0, 200), input.logoUrl.trim().slice(0, 500),
      input.coverUrl.trim().slice(0, 500), input.instagram.trim().slice(0, 200),
      input.facebook.trim().slice(0, 200), input.tiktok.trim().slice(0, 200),
      input.google.trim().slice(0, 300), input.brandColors.trim().slice(0, 120),
      input.targetNote.trim().slice(0, 500),
    ],
  );
  revalidatePath("/business");
  return { ok: true };
}

// ------------------------------------------------------------------ calendar

const PLATFORMS = ["instagram", "facebook", "tiktok", "google_business", "other"];
const POST_STATUSES = ["idea", "draft", "needs_approval", "approved", "scheduled", "published", "failed"];

export async function upsertCalendarPost(input: {
  id?: string; businessId: string; platform: string; title: string;
  copy?: string; status: string; scheduledFor?: string;
}): Promise<Result> {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, input.businessId, ["owner", "manager", "member"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  if (!PLATFORMS.includes(input.platform)) return fail("Pick a platform.");
  if (!POST_STATUSES.includes(input.status)) return fail("Bad status.");
  const title = input.title.trim().slice(0, 200);
  if (!title) return fail("Give the post a short title.");
  const scheduled = input.scheduledFor ? new Date(input.scheduledFor) : null;

  if (input.id) {
    const updated = await sqlOne(
      `update calendar_posts set platform = $3, title = $4, copy = nullif($5, ''),
              status = $6::calendar_post_status, scheduled_for = $7,
              published_at = case when $6 = 'published' and published_at is null then now() else published_at end
        where id = $1 and business_id = $2 returning 1 as x`,
      [input.id, input.businessId, input.platform, title, input.copy?.trim().slice(0, 4000) ?? "", input.status, scheduled],
    );
    if (!updated) return fail("Post not found.");
  } else {
    await sql(
      `insert into calendar_posts (business_id, platform, title, copy, status, scheduled_for)
       values ($1, $2, $3, nullif($4, ''), $5::calendar_post_status, $6)`,
      [input.businessId, input.platform, title, input.copy?.trim().slice(0, 4000) ?? "", input.status, scheduled],
    );
  }
  revalidatePath("/business/content");
  return { ok: true };
}

export async function deleteCalendarPost(id: string, businessId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, businessId, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  await sql(`delete from calendar_posts where id = $1 and business_id = $2`, [id, businessId]);
  revalidatePath("/business/content");
  return { ok: true };
}

// --------------------------------------------------------------- connections

/**
 * Connected accounts. Real OAuth needs provider credentials that aren't
 * configured yet, so "connect" honestly records a pending request and the UI
 * shows exactly what's missing, never a fake "connected".
 */
export async function requestConnection(businessId: string, provider: string): Promise<Result> {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, businessId, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  if (!["google_business", "instagram", "facebook", "tiktok"].includes(provider)) return fail("Bad provider.");
  await sql(
    `insert into connected_accounts (business_id, provider, status)
     values ($1, $2, 'pending')
     on conflict (business_id, provider) do update set status = 'pending', updated_at = now()`,
    [businessId, provider],
  );
  revalidatePath("/business/connections");
  return { ok: true };
}

// ----------------------------------------------------------- recommendations

export async function regenerateIdeas(businessId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, businessId, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  await refreshRecommendations(businessId);
  revalidatePath("/business");
  revalidatePath("/business/trends");
  return { ok: true };
}

export async function dismissIdea(id: string, businessId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, businessId, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  await sql(
    `update marketing_recommendations set status = 'dismissed' where id = $1 and business_id = $2`,
    [id, businessId],
  );
  revalidatePath("/business");
  revalidatePath("/business/trends");
  return { ok: true };
}

/**
 * Ask TapMart to verify the business. An admin checks it by hand and sets
 * 'verified' or 'rejected'; nothing here is automatic. Owners and managers
 * can ask; a business already pending or verified is left alone.
 */
export async function requestBusinessVerification(businessId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, businessId, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  const updated = await sqlOne(
    `update businesses set verification = 'pending', updated_at = now()
      where id = $1 and verification in ('unverified', 'rejected') returning 1 as x`,
    [businessId],
  );
  if (!updated) return fail("Verification is already in progress or done.");
  revalidatePath("/business");
  revalidatePath("/business/settings");
  revalidatePath("/admin/market");
  return { ok: true };
}
