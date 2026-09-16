import "server-only";
import { sql, sqlOne } from "@/lib/db";
import { EARN_KINDS } from "@/lib/v2/opportunities";

/**
 * Reads for the business side of campaigns: the list with what each one
 * is waiting on, one campaign with its participants, submissions, cars
 * and proofs. Every count is a real count; nothing here is estimated.
 */
export type CampaignListRow = {
  id: string; kind: string; title: string; status: string; pay_cents: number; slots: number; city: string | null; created_at: string;
  audience: "public" | "direct"; target_name: string | null; invite_status: string | null;
  media: string | null; vehicle: string | null; placements: string[] | null;
  approved: number; verified: number; cars_active: number; waiting: number; applications: number; artwork: number; needs_artwork: number; needs_install: number;
};

export async function listBusinessCampaigns(businessId: string): Promise<CampaignListRow[]> {
  return sql<CampaignListRow>(
    `select c.id, c.kind::text as kind, c.title, c.status::text as status, c.pay_cents::int as pay_cents, c.slots, c.city, c.created_at,
            c.audience, tp.username as target_name,
            (select i.status from campaign_invites i where i.campaign_id = c.id order by i.created_at desc limit 1) as invite_status,
            coalesce(c.details->>'reference_media_url', c.details->>'creative_url', c.details->>'artwork_url') as media,
            (select coalesce(v.poster_url, (select url from vehicle_photos p where p.vehicle_id = v.id order by (p.angle = 'driver_side') desc, p.created_at limit 1))
               from car_bookings k join vehicles v on v.id = k.vehicle_id
              where k.campaign_id = c.id and k.status in ('active', 'completed', 'installation_pending', 'creative_pending') order by k.created_at limit 1) as vehicle,
            (select array_agg(z) from jsonb_array_elements_text(coalesce(c.details->'placements', '[]'::jsonb)) z) as placements,
            (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int as approved,
            (select count(*) from submissions s where s.campaign_id = c.id and s.status = 'paid')::int as verified,
            (select count(*) from car_bookings k where k.campaign_id = c.id and k.status in ('active', 'completed'))::int as cars_active,
            (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('submitted', 'under_review'))::int as waiting,
            (select count(*) from applications a where a.campaign_id = c.id and a.status = 'applied')::int as applications,
            (select count(*) from car_bookings k where k.campaign_id = c.id and k.status in ('creative_pending', 'installation_pending'))::int as artwork,
            (select count(*) from car_bookings k where k.campaign_id = c.id and k.status = 'creative_pending')::int as needs_artwork,
            (select count(*) from car_bookings k where k.campaign_id = c.id and k.status = 'installation_pending')::int as needs_install
       from campaigns c
       left join profiles tp on tp.id = c.target_profile_id
      where c.business_id = $1
      order by (c.status in ('open', 'paused', 'draft')) desc, c.created_at desc`,
    [businessId],
  );
}

export const isDone = (r: { status: string }) => ["closed", "completed", "cancelled"].includes(r.status);
export const isLegacyKind = (r: { kind: string }) => !(EARN_KINDS as readonly string[]).includes(r.kind);
export const needsYou = (r: { waiting: number; applications: number; artwork: number }) => r.waiting > 0 || r.applications > 0 || r.artwork > 0;

export type BusinessCampaign = {
  id: string; business_id: string; kind: string; title: string; brief: string; status: string; audience: "public" | "direct";
  reference_url: string | null; requirements: string[]; details: Record<string, unknown> & {
    reference_media_url?: string | null; creative_url?: string | null; artwork_url?: string | null; placements?: string[]; duration_days?: number;
    live_hours?: number; min_followers?: number | null; duration_seconds?: [number, number] | null; vehicle_prefs?: { colors?: string[]; body_types?: string[] };
    brief?: { steps?: { n: number; text: string }[]; summary?: string } | null; guide?: { checklist?: string[]; rules?: string[] } | null;
  };
  pay_cents: number; slots: number; city: string | null; deadline: string | null; starts_on: string | null; published_at: string | null; created_at: string;
  approved: number; paid_count: number;
};

export async function getBusinessCampaign(id: string): Promise<BusinessCampaign | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return sqlOne<BusinessCampaign>(
    `select c.id, c.business_id, c.kind::text as kind, c.title, c.brief, c.status::text as status, c.audience,
            c.reference_url, c.requirements, c.details, c.pay_cents::int as pay_cents, c.slots, c.city,
            c.deadline, c.starts_on, c.published_at, c.created_at,
            (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int as approved,
            (select count(*) from submissions s where s.campaign_id = c.id and s.status = 'paid')::int as paid_count
       from campaigns c where c.id = $1`,
    [id],
  );
}

export type DriverApplication = {
  id: string; status: string; created_at: string; applicant_id: string; username: string; display_name: string | null; avatar_url: string | null;
  vehicle_id: string | null; year: number | null; make: string | null; model: string | null; color: string | null; body_type: string | null; vehicle_city: string | null;
  verification: string | null; photo_url: string | null; zones: string[];
};

export async function getDriverApplications(campaignId: string): Promise<DriverApplication[]> {
  return sql<DriverApplication>(
    `select a.id, a.status::text as status, a.created_at, a.applicant_id, p.username, p.display_name, p.avatar_url,
            v.id as vehicle_id, v.year, v.make, v.model, v.color, v.body_type, v.city as vehicle_city, v.verification::text as verification,
            (select url from vehicle_photos ph where ph.vehicle_id = v.id order by (ph.angle = 'driver_side') desc, ph.created_at limit 1) as photo_url,
            coalesce((select array_agg(z.zone::text order by z.zone) from vehicle_zones z where z.vehicle_id = v.id and z.available), '{}') as zones
       from applications a
       join profiles p on p.id = a.applicant_id
       left join vehicles v on v.id = a.vehicle_id
      where a.campaign_id = $1
      order by (a.status = 'applied') desc, a.created_at desc`,
    [campaignId],
  );
}

export type CarBooking = {
  id: string; status: string; monthly_cents: number; starts_on: string | null; ends_on: string | null; artwork_url: string | null; zones: string[]; created_at: string;
  vehicle_id: string; year: number; make: string; model: string; color: string | null; username: string; display_name: string | null; avatar_url: string | null; photo_url: string | null;
};

export async function getCarBookings(campaignId: string): Promise<CarBooking[]> {
  return sql<CarBooking>(
    `select k.id, k.status::text as status, k.monthly_cents::int as monthly_cents, k.starts_on, k.ends_on, k.artwork_url, k.zones::text[] as zones, k.created_at,
            v.id as vehicle_id, v.year, v.make, v.model, v.color, p.username, p.display_name, p.avatar_url,
            (select url from vehicle_photos ph where ph.vehicle_id = v.id order by (ph.angle = 'driver_side') desc, ph.created_at limit 1) as photo_url
       from car_bookings k join vehicles v on v.id = k.vehicle_id join profiles p on p.id = v.owner_id
      where k.campaign_id = $1 order by k.created_at`,
    [campaignId],
  );
}

export type CarProof = { id: string; booking_id: string; kind: string; media_url: string | null; odometer_miles: number | null; note: string | null; created_at: string };

export async function getCarProofs(bookingIds: string[]): Promise<CarProof[]> {
  if (bookingIds.length === 0) return [];
  return sql<CarProof>(
    `select id, booking_id, kind::text as kind, media_url, odometer_miles, note, created_at from car_proofs where booking_id = any($1::uuid[]) order by created_at desc`,
    [bookingIds],
  );
}

/** Months paid on a booking: the first month at installation plus each confirmed month, from the real ledger. */
export async function getBookingMonthsPaid(bookingIds: string[], businessId: string): Promise<Record<string, number>> {
  if (bookingIds.length === 0) return {};
  const rows = await sql<{ id: string; n: number }>(
    `select k.id, (select count(*) from credit_ledger l join businesses b on b.owner_id = l.user_id
                    where b.id = $2 and l.transaction_type = 'campaign_payment'
                      and l.related_entity_type = 'booking' and l.related_entity_id = k.id)::int as n
       from car_bookings k where k.id = any($1::uuid[])`,
    [bookingIds, businessId],
  );
  return Object.fromEntries(rows.map((r) => [r.id, r.n]));
}

export type LatestInvite = { id: string; status: string; profile_id: string; username: string; display_name: string | null; avatar_url: string | null; message: string | null; decided_at: string | null; created_at: string };

export async function getLatestInvite(campaignId: string): Promise<LatestInvite | null> {
  return sqlOne<LatestInvite>(
    `select i.id, i.status, i.profile_id, p.username, p.display_name, p.avatar_url, i.message, i.decided_at, i.created_at
       from campaign_invites i join profiles p on p.id = i.profile_id where i.campaign_id = $1 order by i.created_at desc limit 1`,
    [campaignId],
  );
}

/** Applications to a Recreate or Story campaign (people, not cars). */
export type PersonApplication = {
  id: string; applicant_id: string; status: string; message: string | null; created_at: string;
  username: string; display_name: string | null; avatar_url: string | null; city: string | null; verified: boolean; completed_jobs: number;
  instagram_status: string | null; instagram_followers: number | null; sample_url: string | null; sample_title: string | null;
};

export async function getPersonApplications(campaignId: string): Promise<PersonApplication[]> {
  return sql<PersonApplication>(
    `select a.id, a.applicant_id, a.status::text as status, a.message, a.created_at,
            p.username, p.display_name, p.avatar_url, p.city,
            coalesce(cp.verification = 'verified', false) as verified, coalesce(cp.completed_jobs, 0)::int as completed_jobs,
            sa.status::text as instagram_status, sa.follower_count::int as instagram_followers,
            (select s.media_urls[1] from submissions s where s.creator_id = a.applicant_id and s.status in ('approved', 'paid') and s.media_urls[1] is not null order by s.created_at desc limit 1) as sample_url,
            (select c2.title from submissions s join campaigns c2 on c2.id = s.campaign_id where s.creator_id = a.applicant_id and s.status in ('approved', 'paid') and s.media_urls[1] is not null order by s.created_at desc limit 1) as sample_title
       from applications a
       join profiles p on p.id = a.applicant_id
       left join creator_profiles cp on cp.profile_id = a.applicant_id
       left join social_accounts sa on sa.profile_id = a.applicant_id and sa.provider = 'instagram'
      where a.campaign_id = $1
      order by (a.status = 'applied') desc, a.created_at desc`,
    [campaignId],
  );
}

/** What is recorded about a person: verification, completed work, Instagram as connected, and their city. Nothing inferred. */
export type CreatorProvenance = { verified: boolean; completed_jobs: number; city: string | null; instagram_status: string | null; instagram_handle: string | null; instagram_followers: number | null };

export async function getCreatorProvenance(profileId: string): Promise<CreatorProvenance> {
  const row = await sqlOne<CreatorProvenance>(
    `select coalesce(cp.verification = 'verified', false) as verified, coalesce(cp.completed_jobs, 0)::int as completed_jobs, p.city,
            sa.status::text as instagram_status, sa.handle as instagram_handle, sa.follower_count::int as instagram_followers
       from profiles p
       left join creator_profiles cp on cp.profile_id = p.id
       left join social_accounts sa on sa.profile_id = p.id and sa.provider = 'instagram'
      where p.id = $1`,
    [profileId],
  );
  return row ?? { verified: false, completed_jobs: 0, city: null, instagram_status: null, instagram_handle: null, instagram_followers: null };
}
