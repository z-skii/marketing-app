import "server-only";
import { sql } from "@/lib/db";

/**
 * The discovery feed. Deterministic, explainable ranking — no pretend ML:
 * open campaigns score on freshness, pay, a same-city boost, and a boost for
 * businesses the viewer follows/saves. Everything filters and pages in SQL.
 */

export type FeedTab = "for_you" | "nearby" | "top_pay" | "new";

export type FeedCard = {
  id: string;
  kind: string;
  title: string;
  brief: string;
  pay_cents: number;
  slots: number;
  approved_count: number;
  city: string | null;
  deadline: string | null;
  verified_only: boolean;
  published_at: string;
  business_id: string;
  business_name: string;
  business_slug: string;
  business_logo: string | null;
  saved: boolean;
};

export async function getFeed(options: {
  viewerId: string;
  viewerCity: string | null;
  tab: FeedTab;
  kind?: string | null;
  limit?: number;
  offset?: number;
}): Promise<FeedCard[]> {
  const { viewerId, viewerCity, tab, kind } = options;
  const limit = Math.min(options.limit ?? 20, 50);
  const offset = Math.max(options.offset ?? 0, 0);

  const order =
    tab === "top_pay" ? "c.pay_cents desc, c.published_at desc"
    : tab === "new" ? "c.published_at desc"
    : tab === "nearby" ? "same_city desc, c.published_at desc"
    : "score desc, c.published_at desc";

  return sql<FeedCard>(
    `select c.id, c.kind::text as kind, c.title, c.brief, c.pay_cents::int as pay_cents,
            c.slots, c.city, c.deadline, c.verified_only, c.published_at,
            b.id as business_id, b.name as business_name, b.slug as business_slug,
            b.logo_url as business_logo,
            (select count(*) from submissions s
              where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int as approved_count,
            exists (select 1 from saved_items si
                     where si.profile_id = $1 and si.item_type = 'campaign' and si.item_id = c.id) as saved,
            (case when $2::text is not null and lower(c.city) = lower($2) then 1 else 0 end) as same_city,
            -- freshness (halves each ~3 days) + pay weight + city + followed business
            (100.0 / (1 + extract(epoch from now() - c.published_at) / 260000)
             + least(c.pay_cents / 100.0, 400) / 4
             + case when $2::text is not null and lower(c.city) = lower($2) then 60 else 0 end
             + case when exists (select 1 from saved_items si2
                                  where si2.profile_id = $1 and si2.item_type = 'business'
                                    and si2.item_id = c.business_id) then 40 else 0 end) as score
       from campaigns c
       join businesses b on b.id = c.business_id
      where c.status = 'open'
        and (c.deadline is null or c.deadline > now())
        and ($3::text is null or c.kind = $3::campaign_kind)
        and not exists (select 1 from blocks bl
                         where bl.blocker_id = $1 and bl.blocked_id = b.owner_id)
      order by ${order}
      limit $4 offset $5`,
    [viewerId, viewerCity, kind ?? null, limit, offset],
  );
}

export type VehicleCard = {
  id: string;
  year: number;
  make: string;
  model: string;
  body_type: string | null;
  color: string | null;
  monthly_miles: number | null;
  city: string | null;
  radius_miles: number | null;
  verification: string;
  photo_url: string | null;
  zone_count: number;
  min_asking_cents: number | null;
  owner_username: string;
  owner_name: string | null;
};

export async function searchVehicles(options: {
  city?: string | null;
  make?: string | null;
  maxCents?: number | null;
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<VehicleCard[]> {
  const limit = Math.min(options.limit ?? 20, 50);
  return sql<VehicleCard>(
    `select v.id, v.year, v.make, v.model, v.body_type, v.color, v.monthly_miles,
            v.city, v.radius_miles, v.verification::text as verification,
            (select url from vehicle_photos p
              where p.vehicle_id = v.id order by (angle = 'driver_side') desc, created_at limit 1) as photo_url,
            (select count(*) from vehicle_zones z
              where z.vehicle_id = v.id and z.available)::int as zone_count,
            (select min(z.asking_cents_monthly) from vehicle_zones z
              where z.vehicle_id = v.id and z.available)::int as min_asking_cents,
            pr.username as owner_username, pr.display_name as owner_name
       from vehicles v
       join profiles pr on pr.id = v.owner_id
      where v.status = 'listed'
        and ($1::text is null or lower(v.city) like lower($1) || '%')
        and ($2::text is null or lower(v.make) = lower($2))
        and ($3::bigint is null or exists
              (select 1 from vehicle_zones z where z.vehicle_id = v.id and z.available
                 and z.asking_cents_monthly is not null and z.asking_cents_monthly <= $3))
        and (not $4 or v.verification = 'verified')
      order by (v.verification = 'verified') desc, v.created_at desc
      limit $5 offset $6`,
    [
      options.city ?? null,
      options.make ?? null,
      options.maxCents ?? null,
      options.verifiedOnly ?? false,
      limit,
      Math.max(options.offset ?? 0, 0),
    ],
  );
}

export type SearchHit = {
  type: "campaign" | "business" | "profile" | "vehicle";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  image_url: string | null;
};

export async function globalSearch(q: string, limit = 8): Promise<SearchHit[]> {
  const like = `%${q.trim()}%`;
  if (q.trim().length < 2) return [];
  const [campaigns, businesses, people, vehicles] = await Promise.all([
    sql<SearchHit>(
      `select 'campaign' as type, c.id, c.title, b.name as subtitle,
              '/jobs/' || c.id as href, b.logo_url as image_url
         from campaigns c join businesses b on b.id = c.business_id
        where c.status = 'open' and (c.title ilike $1 or c.brief ilike $1)
        order by c.published_at desc limit $2`,
      [like, limit],
    ),
    sql<SearchHit>(
      `select 'business' as type, id, name as title, coalesce(category, city) as subtitle,
              '/b/' || slug as href, logo_url as image_url
         from businesses where name ilike $1 or category ilike $1
        order by created_at desc limit $2`,
      [like, limit],
    ),
    sql<SearchHit>(
      `select 'profile' as type, id, coalesce(display_name, username) as title,
              '@' || username as subtitle, '/u/' || username as href, avatar_url as image_url
         from profiles
        where not suspended and (username ilike $1 or display_name ilike $1)
        order by created_at desc limit $2`,
      [like, limit],
    ),
    sql<SearchHit>(
      `select 'vehicle' as type, v.id,
              v.year || ' ' || v.make || ' ' || v.model as title, v.city as subtitle,
              '/cars/' || v.id as href,
              (select url from vehicle_photos p where p.vehicle_id = v.id limit 1) as image_url
         from vehicles v
        where v.status = 'listed' and (v.make ilike $1 or v.model ilike $1 or v.city ilike $1)
        order by v.created_at desc limit $2`,
      [like, limit],
    ),
  ]);
  return [...campaigns, ...businesses, ...people, ...vehicles];
}
