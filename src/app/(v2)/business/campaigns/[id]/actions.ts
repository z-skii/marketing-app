"use server";

import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import { notifyMany, requireBusinessMember, requireOnboarded } from "@/lib/v2/core";
import { formatCredit } from "@/lib/money";

type Result = { ok: boolean; error?: string };
const fail = (error: string): Result => ({ ok: false, error });

/**
 * A saved draft goes live. Same rule as publishing from the wizard: the
 * business needs campaign credit for at least one payment, and people in
 * the campaign's city are told.
 */
export async function publishDraft(campaignId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  const campaign = await sqlOne<{ id: string; business_id: string; kind: string; status: string; pay_cents: string; city: string | null }>(
    `select id, business_id, kind::text as kind, status::text as status, pay_cents::text as pay_cents, city
       from campaigns where id = $1 and kind in ('recreate_reel', 'instagram_story', 'car_ads')`,
    [campaignId],
  );
  if (!campaign) return fail("Campaign not found.");
  try {
    await requireBusinessMember(ctx.user.id, campaign.business_id, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  if (campaign.status !== "draft") return fail("This campaign is not a draft.");

  const payCents = Number(campaign.pay_cents);
  const wallet = await sqlOne<{ cents: string }>(
    `select available_credit_cents::text as cents from wallets w
      join businesses b on b.owner_id = w.user_id where b.id = $1`,
    [campaign.business_id],
  );
  const available = Number(wallet?.cents ?? 0);
  if (available < payCents) {
    return fail(`Add credit first. Paying one person costs ${formatCredit(payCents)} and your campaign credit is ${formatCredit(available)}.`);
  }

  await sql(`update campaigns set status = 'open', published_at = now() where id = $1 and status = 'draft'`, [campaignId]);

  if (campaign.city) {
    const audience = await sql<{ id: string }>(
      `select id from profiles where wants_earn and not suspended and id <> $1 and lower(city) = lower($2) limit 200`,
      [ctx.user.id, campaign.city],
    );
    const headline =
      campaign.kind === "recreate_reel" ? `Make ${formatCredit(payCents)}: recreate a Reel`
      : campaign.kind === "instagram_story" ? `Earn ${formatCredit(payCents)}: post a Story`
      : `${formatCredit(payCents)}/month: drivers wanted in ${campaign.city}`;
    await notifyMany(audience.map((a) => a.id), "opportunity", headline, { body: `New in ${campaign.city}.`, href: `/o/${campaignId}` });
  }
  revalidatePath(`/business/campaigns/${campaignId}`);
  revalidatePath("/business/campaigns");
  return { ok: true };
}
