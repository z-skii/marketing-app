import "server-only";
import { sql, sqlOne } from "@/lib/db";

/**
 * The three ways a person earns on TapMart, and everything Home, Activity
 * and the detail screens need to show them. One campaign table, three kinds:
 *
 *   recreate_reel    recreate a reference video, get paid per approved version
 *   instagram_story  post a ready-made Story, keep it live, get paid
 *   car_ads          apply with your car, drive with the artwork, get paid monthly
 *
 * Type-specific facts live in campaigns.details (see migration 0021).
 */

export const EARN_KINDS = ["recreate_reel", "instagram_story", "car_ads"] as const;
export type EarnKind = (typeof EARN_KINDS)[number];

export function isEarnKind(kind: string): kind is EarnKind {
  return (EARN_KINDS as readonly string[]).includes(kind);
}

export const KIND_LABEL: Record<EarnKind, string> = {
  recreate_reel: "Recreate",
  instagram_story: "Story",
  car_ads: "Car ad",
};

/** What the person actually does, in three words. */
export const KIND_ACTION: Record<EarnKind, string> = {
  recreate_reel: "Recreate this Reel",
  instagram_story: "Post this to your Story",
  car_ads: "Drive with this campaign",
};

export type RecreateDetails = {
  reference_media_url?: string | null;
  duration_seconds?: [number, number] | null;
};
export type StoryDetails = {
  creative_url?: string | null;
  min_followers?: number | null;
  live_hours?: number | null;
};
export type CarDetails = {
  placements?: string[];
  duration_days?: number | null;
  vehicle_prefs?: { colors?: string[]; body_types?: string[] } | null;
  artwork_url?: string | null;
};
export type CampaignDetails = RecreateDetails & StoryDetails & CarDetails;

export type FeedTab = "for_you" | "nearby" | "top_pay";

export type Opportunity = {
  id: string;
  kind: EarnKind;
  title: string;
  brief: string;
  reference_url: string | null;
  requirements: string[];
  details: CampaignDetails;
  pay_cents: number;
  slots: number;
  approved_count: number;
  city: string | null;
  deadline: string | null;
  starts_on: string | null;
  published_at: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  business_logo: string | null;
  business_cover: string | null;
  business_verified: boolean;
  saved: boolean;
};

const SELECT = `
  select c.id, c.kind::text as kind, c.title, c.brief, c.reference_url, c.requirements, c.details,
         c.pay_cents::int as pay_cents, c.slots, c.city, c.deadline, c.starts_on, c.published_at,
         b.id as business_id, b.name as business_name, b.slug as business_slug,
         b.logo_url as business_logo, b.cover_url as business_cover,
         (b.verification = 'verified') as business_verified,
         (select count(*) from submissions s
           where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int as approved_count,
         exists (select 1 from saved_items si
                  where si.profile_id = $1 and si.item_type = 'campaign' and si.item_id = c.id) as saved`;

export async function getOpportunities(options: {
  viewerId: string;
  viewerCity: string | null;
  tab: FeedTab;
  kind?: EarnKind | null;
  limit?: number;
  offset?: number;
}): Promise<Opportunity[]> {
  const { viewerId, viewerCity, tab, kind } = options;
  const limit = Math.min(options.limit ?? 20, 50);
  const offset = Math.max(options.offset ?? 0, 0);
  const order =
    tab === "top_pay" ? "c.pay_cents desc, c.published_at desc"
    : tab === "nearby" ? "same_city desc, c.published_at desc"
    : "score desc, c.published_at desc";

  return sql<Opportunity>(
    `${SELECT},
         (case when $2::text is not null and lower(c.city) = lower($2) then 1 else 0 end) as same_city,
         -- freshness (halves each ~3 days) + pay + same city + a mix of all three kinds near the top
         (100.0 / (1 + extract(epoch from now() - c.published_at) / 260000)
          + least(c.pay_cents / 100.0, 400) / 4
          + case when $2::text is not null and lower(c.city) = lower($2) then 60 else 0 end
          + case when exists (select 1 from saved_items si2
                               where si2.profile_id = $1 and si2.item_type = 'business'
                                 and si2.item_id = c.business_id) then 40 else 0 end) as score
       from campaigns c
       join businesses b on b.id = c.business_id
      where c.status = 'open'
        and c.kind in ('recreate_reel', 'instagram_story', 'car_ads')
        and (c.deadline is null or c.deadline > now())
        and ($3::text is null or c.kind = $3::campaign_kind)
        and not exists (select 1 from blocks bl
                         where bl.blocker_id = $1 and bl.blocked_id = b.owner_id)
      order by ${order}
      limit $4 offset $5`,
    [viewerId, viewerCity, kind ?? null, limit, offset],
  );
}

export async function getOpportunity(id: string, viewerId: string): Promise<Opportunity | null> {
  const row = await sqlOne<Opportunity>(
    `${SELECT} from campaigns c join businesses b on b.id = c.business_id where c.id = $2`,
    [viewerId, id],
  );
  return row && isEarnKind(row.kind) ? row : null;
}

/** A business's open campaigns, for its public page. */
export async function getBusinessOpportunities(businessId: string, viewerId: string): Promise<Opportunity[]> {
  return sql<Opportunity>(
    `${SELECT} from campaigns c join businesses b on b.id = c.business_id
      where c.business_id = $2 and c.status = 'open'
        and c.kind in ('recreate_reel', 'instagram_story', 'car_ads')
        and (c.deadline is null or c.deadline > now())
      order by c.published_at desc limit 30`,
    [viewerId, businessId],
  );
}

export async function getSavedOpportunities(viewerId: string): Promise<Opportunity[]> {
  return sql<Opportunity>(
    `${SELECT} from saved_items si
       join campaigns c on c.id = si.item_id
       join businesses b on b.id = c.business_id
      where si.profile_id = $1 and si.item_type = 'campaign'
        and c.kind in ('recreate_reel', 'instagram_story', 'car_ads')
      order by si.created_at desc limit 50`,
    [viewerId],
  );
}

// -------------------------------------------------------------- vehicles

export type VehicleSummary = {
  id: string;
  year: number;
  make: string;
  model: string;
  color: string | null;
  body_type: string | null;
  city: string | null;
  status: string;
  verification: string;
  available: boolean;
  photo_url: string | null;
  zones: string[];
  /** Still from the scan (front photo, or the model's poster once built). */
  poster_url: string | null;
  /** Set only when a reconstruction provider actually built a model. */
  model_glb_url: string | null;
  /** Status of the newest scan attached to this vehicle, or null if never scanned. */
  scan_status: string | null;
  scan_id: string | null;
};

export async function getMyVehicles(ownerId: string): Promise<VehicleSummary[]> {
  return sql<VehicleSummary>(
    `select v.id, v.year, v.make, v.model, v.color, v.body_type, v.city, v.status,
            v.verification::text as verification, v.available,
            coalesce((select url from vehicle_photos p where p.vehicle_id = v.id
                       order by (p.angle = 'driver_side') desc, p.created_at limit 1),
                     v.poster_url) as photo_url,
            coalesce((select array_agg(z.zone::text order by z.zone) from vehicle_zones z
                       where z.vehicle_id = v.id and z.available), '{}') as zones,
            v.poster_url, v.model_glb_url,
            ls.status as scan_status,
            coalesce(ls.id, v.scan_id) as scan_id
       from vehicles v
       left join lateral (select s.id, s.status from vehicle_scans s
                           where s.vehicle_id = v.id order by s.created_at desc limit 1) ls on true
      where v.owner_id = $1 order by v.created_at`,
    [ownerId],
  );
}

export type Qualification = { ok: boolean; reasons: string[] };

/**
 * Does this car fit this campaign? Plain comparisons against the business's
 * stated preferences: colour, body type, city and the placements the driver
 * made available. Reasons are written for the driver.
 */
export function vehicleQualifies(vehicle: VehicleSummary, campaign: Opportunity): Qualification {
  const prefs = campaign.details.vehicle_prefs ?? {};
  const reasons: string[] = [];
  const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

  if (vehicle.status !== "listed") reasons.push("Your car isn't listed for ads yet.");
  if (!vehicle.available) reasons.push("Your car is marked unavailable.");
  if (campaign.city && vehicle.city && norm(campaign.city) !== norm(vehicle.city)) {
    reasons.push(`This campaign is in ${campaign.city}. Your car is in ${vehicle.city}.`);
  }
  const colors = (prefs.colors ?? []).map(norm).filter(Boolean);
  if (colors.length > 0 && !colors.includes(norm(vehicle.color))) {
    reasons.push(`They want ${prefs.colors!.join(" or ").toLowerCase()} vehicles.`);
  }
  const bodies = (prefs.body_types ?? []).map(norm).filter(Boolean);
  if (bodies.length > 0 && !bodies.includes(norm(vehicle.body_type))) {
    reasons.push(`They want ${prefs.body_types!.join(" or ").toLowerCase()}s.`);
  }
  const placements = campaign.details.placements ?? [];
  if (placements.length > 0 && !placements.some((p) => vehicle.zones.includes(p))) {
    reasons.push("None of the placements they need are available on your car.");
  }
  return { ok: reasons.length === 0, reasons };
}

// -------------------------------------------------------------- activity

export type ActivityItem = {
  id: string;
  kind: EarnKind;
  campaign_id: string;
  title: string;
  business_name: string;
  business_logo: string | null;
  cover: string | null;
  pay_cents: number;
  /** application | submission | booking */
  record: "application" | "submission" | "booking";
  status: string;
  created_at: string;
  ends_on: string | null;
  review_note: string | null;
  live_hours: number | null;
  posted_at: string | null;
};

/**
 * Everything a person has touched, newest first: applications (car and
 * recreate claims), submissions (recreated videos, story proofs) and car
 * bookings. The screen groups these into Active / Submitted / Completed.
 */
export async function getActivity(viewerId: string): Promise<ActivityItem[]> {
  return sql<ActivityItem>(
    `select * from (
       select a.id, c.kind::text as kind, c.id as campaign_id, c.title, b.name as business_name,
              b.logo_url as business_logo, coalesce(c.details->>'artwork_url', b.cover_url) as cover,
              c.pay_cents::int as pay_cents, 'application' as record, a.status::text as status,
              a.created_at, null::date as ends_on, null::text as review_note,
              null::int as live_hours, null::text as posted_at
         from applications a join campaigns c on c.id = a.campaign_id join businesses b on b.id = c.business_id
        where a.applicant_id = $1
          and not exists (select 1 from car_bookings k join car_offers o on o.id = k.offer_id
                           where o.campaign_id = c.id and k.vehicle_id = a.vehicle_id)
       union all
       select s.id, c.kind::text, c.id, c.title, b.name, b.logo_url,
              coalesce(c.details->>'creative_url', b.cover_url),
              c.pay_cents::int, 'submission', s.status::text, s.created_at, null::date, s.review_note,
              (c.details->>'live_hours')::int, s.meta->>'posted_at'
         from submissions s join campaigns c on c.id = s.campaign_id join businesses b on b.id = c.business_id
        where s.creator_id = $1
       union all
       select k.id, 'car_ads', coalesce(o.campaign_id, k.id), coalesce(c.title, b.name || ' car ad'), b.name, b.logo_url,
              coalesce(k.artwork_url, c.details->>'artwork_url', b.cover_url),
              k.monthly_cents::int, 'booking', k.status::text, k.created_at, k.ends_on, null::text,
              null::int, null::text
         from car_bookings k join vehicles v on v.id = k.vehicle_id
         join car_offers o on o.id = k.offer_id
         join businesses b on b.id = k.business_id
         left join campaigns c on c.id = o.campaign_id
        where v.owner_id = $1
     ) t
     where t.kind in ('recreate_reel', 'instagram_story', 'car_ads')
     order by t.created_at desc limit 100`,
    [viewerId],
  );
}

/** Which bucket an activity row belongs to on the Activity screen. */
export function activityBucket(item: ActivityItem): "active" | "submitted" | "completed" {
  if (item.record === "submission") {
    if (["submitted", "under_review"].includes(item.status)) return "submitted";
    if (["approved", "paid", "rejected"].includes(item.status)) return "completed";
    return "active"; // revision_requested: the person has work to do
  }
  if (item.record === "application") {
    if (["declined", "withdrawn"].includes(item.status)) return "completed";
    return "active";
  }
  if (["completed", "cancelled"].includes(item.status)) return "completed";
  return "active";
}

/** Plain language for the person, never the internal status name. */
export function activityLabel(item: ActivityItem): { label: string; sub: string } {
  const k = item.kind;
  if (item.record === "submission") {
    switch (item.status) {
      case "submitted":
      case "under_review":
        return { label: k === "instagram_story" ? "Proof sent" : "Submitted", sub: "Waiting for approval" };
      case "revision_requested":
        return { label: "Changes requested", sub: item.review_note ?? "Open it to see what to fix" };
      case "approved":
      case "paid":
        return { label: "Approved", sub: "Paid to your earnings" };
      case "rejected":
        return { label: "Not approved", sub: item.review_note ?? "" };
    }
  }
  if (item.record === "application") {
    switch (item.status) {
      case "applied": return { label: "Applied", sub: "Waiting for the business" };
      case "accepted": return { label: "Accepted", sub: k === "car_ads" ? "Artwork is being prepared" : "Recreate and submit your version" };
      case "declined": return { label: "Not selected", sub: "" };
      case "withdrawn": return { label: "Withdrawn", sub: "" };
    }
  }
  switch (item.status) {
    case "creative_pending": return { label: "Accepted", sub: "Artwork is being prepared" };
    case "installation_pending": return { label: "Installation next", sub: "The business will arrange it with you" };
    case "active": return { label: "Running", sub: item.ends_on ? `Until ${fmtDate(item.ends_on)}` : "Paid monthly" };
    case "proof_required": return { label: "Proof needed", sub: "Upload a photo of the car" };
    case "completed": return { label: "Completed", sub: "" };
    case "cancelled": return { label: "Cancelled", sub: "" };
    case "disputed": return { label: "Under review", sub: "TapMart is looking into it" };
  }
  return { label: item.status.replaceAll("_", " "), sub: "" };
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "Ends Friday", "Ends Sep 21", "Ends today" */
export function deadlineLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (days <= 0) return "Ends today";
  if (days === 1) return "Ends tomorrow";
  if (days < 7) return `Ends ${d.toLocaleDateString("en-US", { weekday: "long" })}`;
  return `Ends ${fmtDate(iso)}`;
}

export function isVideoUrl(url: string | null | undefined) {
  return Boolean(url && /\.(mp4|webm|mov)($|\?)/i.test(url));
}
