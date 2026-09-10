import "server-only";
import { sql, sqlOne, transaction } from "@/lib/db";
import { notify } from "@/lib/v2/core";

/**
 * Direct requests: a business asks one specific person (or one of their
 * cars) instead of publishing to everyone. A direct request IS a campaign
 * (audience = 'direct', target_profile_id set) plus one campaign_invites row
 * that carries the offer and the answer. Everything after acceptance is the
 * normal Recreate, Story or Car workflow, so submissions, bookings, review
 * and pay are untouched.
 *
 *   business sends  -> campaigns (direct, open) + campaign_invites (sent) + notification
 *   person accepts  -> invite accepted; Story/Reel: the person submits on the campaign as usual;
 *                      Car: a car_offers row (status accepted) and a car_booking are created
 *   person declines -> invite declined, campaign closed, business notified
 */

export type InviteKind = "recreate_reel" | "instagram_story" | "car_ads";
export type InviteStatus = "sent" | "accepted" | "declined" | "cancelled" | "expired";

export type Invite = {
  id: string;
  campaign_id: string;
  profile_id: string;
  vehicle_id: string | null;
  business_id: string;
  kind: InviteKind;
  pay_cents: number;
  message: string | null;
  status: InviteStatus;
  created_at: string;
  decided_at: string | null;
};

const COLS = `i.id, i.campaign_id, i.profile_id, i.vehicle_id, i.business_id, i.kind::text as kind, i.pay_cents::int as pay_cents,
              i.message, i.status, i.created_at, i.decided_at`;

export const KIND_VERB: Record<InviteKind, string> = {
  recreate_reel: "wants you to recreate a Reel",
  instagram_story: "wants you to post a Story",
  car_ads: "wants to advertise on your car",
};

/** The invite for a campaign as seen by one person, if any. */
export async function getInviteFor(campaignId: string, profileId: string): Promise<Invite | null> {
  return sqlOne<Invite>(`select ${COLS} from campaign_invites i where i.campaign_id = $1 and i.profile_id = $2`, [campaignId, profileId]);
}

export async function listInvitesForProfile(profileId: string, status?: InviteStatus): Promise<Invite[]> {
  return sql<Invite>(
    `select ${COLS} from campaign_invites i where i.profile_id = $1 and ($2::text is null or i.status = $2) order by i.created_at desc limit 100`,
    [profileId, status ?? null],
  );
}

export async function listInvitesForBusiness(businessId: string): Promise<Invite[]> {
  return sql<Invite>(`select ${COLS} from campaign_invites i where i.business_id = $1 order by i.created_at desc limit 200`, [businessId]);
}

/**
 * Record the invite for a direct campaign that was just inserted, and tell
 * the person. The campaign row itself is created by the caller (it knows
 * the kind-specific details) with audience = 'direct'.
 */
export async function sendInvite(input: {
  campaignId: string; businessId: string; businessName: string; profileId: string;
  vehicleId?: string | null; kind: InviteKind; payCents: number; message?: string | null;
}): Promise<Invite> {
  const row = await sqlOne<Invite>(
    `insert into campaign_invites (campaign_id, profile_id, vehicle_id, business_id, kind, pay_cents, message)
     values ($1, $2, $3, $4, $5::campaign_kind, $6, $7)
     on conflict (campaign_id, profile_id) do update set pay_cents = excluded.pay_cents, message = excluded.message, status = 'sent', decided_at = null
     returning id, campaign_id, profile_id, vehicle_id, business_id, kind::text as kind, pay_cents::int as pay_cents, message, status, created_at, decided_at`,
    [input.campaignId, input.profileId, input.vehicleId ?? null, input.businessId, input.kind, input.payCents, input.message?.trim().slice(0, 900) || null],
  );
  await notify(input.profileId, "direct_request", `${input.businessName} ${KIND_VERB[input.kind]}`, {
    body: `$${Math.round(input.payCents / 100)}${input.kind === "car_ads" ? " a month" : ""}`,
    href: `/o/${input.campaignId}`,
  });
  return row!;
}

/**
 * The person answers. Accepting a car request creates the accepted offer and
 * the booking, so the existing booking pipeline (artwork, installation,
 * proof, monthly pay) takes over. Accepting a Story or Reel request only
 * flips the invite; the person then does the normal upload on the campaign.
 */
export async function respondToInvite(inviteId: string, profileId: string, answer: "accepted" | "declined"): Promise<{ ok: true; invite: Invite } | { ok: false; error: string }> {
  const invite = await sqlOne<Invite & { owner_id: string; business_name: string; created_by: string | null; zones: string[] | null; months: number | null }>(
    `select ${COLS}, b.owner_id, b.name as business_name, c.created_by,
            (select array_agg(z) from jsonb_array_elements_text(coalesce(c.details->'placements', '[]'::jsonb)) z) as zones,
            nullif(c.details->>'duration_months', '')::int as months
       from campaign_invites i join campaigns c on c.id = i.campaign_id join businesses b on b.id = i.business_id
      where i.id = $1`,
    [inviteId],
  );
  if (!invite) return { ok: false, error: "Request not found." };
  if (invite.profile_id !== profileId) return { ok: false, error: "This request was sent to someone else." };
  if (invite.status !== "sent") return { ok: false, error: "You already answered this request." };

  await transaction(async (tx) => {
    await tx.query(`update campaign_invites set status = $2, decided_at = now() where id = $1`, [inviteId, answer]);
    if (answer === "declined") {
      await tx.query(`update campaigns set status = 'closed' where id = $1 and audience = 'direct'`, [invite.campaign_id]);
      return;
    }
    if (invite.kind === "car_ads" && invite.vehicle_id) {
      const zones = (invite.zones ?? []).filter(Boolean);
      const offer = await tx.query<{ id: string }>(
        `insert into car_offers (vehicle_id, business_id, created_by, zones, monthly_cents, months, message, status, decided_at, campaign_id)
         values ($1, $2, $3, $4::vehicle_zone_kind[], $5, $6, $7, 'accepted', now(), $8) returning id`,
        [invite.vehicle_id, invite.business_id, invite.created_by, zones, invite.pay_cents, invite.months ?? 1, invite.message, invite.campaign_id],
      );
      const artwork = await tx.query<{ url: string | null }>(`select details->>'artwork_url' as url from campaigns where id = $1`, [invite.campaign_id]);
      const art = artwork.rows[0]?.url ?? null;
      await tx.query(
        `insert into car_bookings (offer_id, vehicle_id, business_id, campaign_id, zones, monthly_cents, status, artwork_url)
         values ($1, $2, $3, $4, $5::vehicle_zone_kind[], $6,
                 case when $7::text is null then 'creative_pending' else 'installation_pending' end::car_booking_status, $7)
         on conflict (offer_id) do nothing`,
        [offer.rows[0].id, invite.vehicle_id, invite.business_id, invite.campaign_id, zones, invite.pay_cents, art],
      );
    }
  });

  const who = invite.created_by ?? invite.owner_id;
  await notify(who, "direct_request",
    answer === "accepted" ? "Your request was accepted" : "Your request was declined",
    { href: `/business/campaigns/${invite.campaign_id}` });
  const updated = await sqlOne<Invite>(`select ${COLS} from campaign_invites i where i.id = $1`, [inviteId]);
  return { ok: true, invite: updated! };
}

/** Business withdraws a request that has not been answered. */
export async function cancelInvite(inviteId: string, businessId: string): Promise<boolean> {
  const r = await sqlOne<{ campaign_id: string }>(
    `update campaign_invites set status = 'cancelled', decided_at = now()
      where id = $1 and business_id = $2 and status = 'sent' returning campaign_id`,
    [inviteId, businessId],
  );
  if (!r) return false;
  await sql(`update campaigns set status = 'cancelled' where id = $1 and audience = 'direct'`, [r.campaign_id]);
  return true;
}
