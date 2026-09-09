"use server";

import { sql } from "@/lib/db";
import { requireBusinessMember, requireOnboarded } from "@/lib/v2/core";

/**
 * A trend or idea that became a campaign is marked used so it leaves the
 * overview. Called by the wizards right before createEarnCampaign when the
 * person arrived through "Turn into a campaign".
 */
export async function markIdeaUsed(recId: string, businessId: string): Promise<void> {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, businessId, ["owner", "manager"]);
  } catch {
    return;
  }
  await sql(
    `update marketing_recommendations set status = 'used'
      where id = $1 and business_id = $2 and status = 'new'`,
    [recId, businessId],
  );
}
