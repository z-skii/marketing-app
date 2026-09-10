"use server";

import { respondToInvite } from "@/lib/v2/requests";

import { revalidatePath } from "next/cache";
import { sqlOne } from "@/lib/db";
import { notify, requireOnboarded } from "@/lib/v2/core";

/**
 * Small actions the opportunity screen needs beyond o/actions.ts and
 * jobs/[id]/actions.ts. Everything here re-checks the viewer server-side.
 */

type Result = { ok: boolean; error?: string };

/** A driver takes back a car application the business has not decided yet. */
export async function withdrawCarApplication(campaignId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  const row = await sqlOne<{ owner_id: string; title: string }>(
    `update applications a set status = 'withdrawn', decided_at = now()
       from campaigns c join businesses b on b.id = c.business_id
      where a.campaign_id = $1 and a.applicant_id = $2 and a.status = 'applied' and c.id = a.campaign_id
      returning b.owner_id, c.title`,
    [campaignId, ctx.user.id],
  );
  if (!row) return { ok: false, error: "There is nothing to withdraw." };
  await notify(row.owner_id, "application", `A driver withdrew from "${row.title}"`, {
    href: `/business/campaigns/${campaignId}`,
  });
  revalidatePath(`/o/${campaignId}`);
  revalidatePath("/activity");
  return { ok: true };
}

/** The person answers a direct request from a business. */
export async function respondToInviteAction(inviteId: string, answer: "accepted" | "declined"): Promise<Result> {
  const ctx = await requireOnboarded();
  const r = await respondToInvite(inviteId, ctx.user.id, answer);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath(`/o/${r.invite.campaign_id}`);
  revalidatePath("/activity");
  return { ok: true };
}
