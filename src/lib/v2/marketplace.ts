import "server-only";
import { sql, sqlOne } from "@/lib/db";
import { buildStage, type StageProps } from "@/lib/vehicles/stage";
import type { StagePhoto } from "@/components/v2/vehicle/VehicleStage";
import type { InviteKind, InviteStatus } from "@/lib/v2/requests";

/**
 * The business marketplace: the people and the cars a business can send a
 * direct request to. Every number here is measured (a connected Instagram
 * account, real reviews, approved work). Instagram followers are only
 * returned when the account is connected; a pending handle is returned as a
 * handle and nothing else.
 */

export type PeopleTab = "for_you" | "people" | "nearby";

export type PersonInstagram = {
  status: "disconnected" | "pending" | "connected" | "error";
  handle: string | null;
  /** Only present when status = connected. */
  followers: number | null;
  avatar_url: string | null;
};

export type Person = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  verification: "unverified" | "pending" | "verified" | "rejected" | null;
  rating_avg: number | null;
  rating_count: number;
  completed_jobs: number;
  instagram: PersonInstagram | null;
  has_listed_vehicle: boolean;
  /** Up to three: approved work first, then portfolio. */
  media: string[];
  same_city: boolean;
};

type PersonRow = Omit<Person, "instagram" | "media" | "rating_avg"> & {
  bio: string | null;
  suspended: boolean;
  rating_avg: string | null;
  ig_status: PersonInstagram["status"] | null;
  ig_handle: string | null;
  ig_followers: number | null;
  ig_avatar: string | null;
  media: string[] | null;
};

const PERSON_SELECT = `
  select p.id, p.username, p.display_name, p.avatar_url, p.city, p.bio, p.suspended,
         cp.verification::text as verification, cp.rating_avg::text as rating_avg,
         coalesce(cp.rating_count, 0)::int as rating_count, coalesce(cp.completed_jobs, 0)::int as completed_jobs,
         sa.status::text as ig_status, sa.handle as ig_handle,
         case when sa.status = 'connected' then sa.follower_count end as ig_followers,
         case when sa.status = 'connected' then sa.avatar_url end as ig_avatar,
         exists (select 1 from vehicles v where v.owner_id = p.id and v.status = 'listed' and v.available) as has_listed_vehicle,
         (select array_agg(m.url order by m.rank, m.ord)
            from (select 1 as rank, row_number() over (order by s.created_at desc) as ord, s.media_urls[1] as url
                    from submissions s
                   where s.creator_id = p.id and s.status in ('approved', 'paid') and cardinality(s.media_urls) > 0
                  union all
                  select 2, row_number() over (order by pi.sort, pi.created_at desc), pi.media_url
                    from portfolio_items pi where pi.profile_id = p.id) m) as media,
         ($2::text is not null and lower(coalesce(p.city, '')) = lower($2::text)) as same_city
    from profiles p
    left join creator_profiles cp on cp.profile_id = p.id
    left join social_accounts sa on sa.profile_id = p.id and sa.provider = 'instagram'`;

const PERSON_ORDER = `
   order by same_city desc, (cp.verification = 'verified') desc nulls last, cp.rating_avg desc nulls last,
            greatest(p.onboarded_at, p.created_at, (select max(s.created_at) from submissions s where s.creator_id = p.id)) desc`;

function toPerson(r: PersonRow): Person {
  const { ig_status, ig_handle, ig_followers, ig_avatar, media, rating_avg, bio: _bio, suspended: _suspended, ...rest } = r;
  void _bio; void _suspended;
  return {
    ...rest,
    rating_avg: rating_avg == null ? null : Number(rating_avg),
    instagram: ig_status ? { status: ig_status, handle: ig_handle, followers: ig_status === "connected" ? ig_followers : null, avatar_url: ig_status === "connected" ? ig_avatar : null } : null,
    media: (media ?? []).filter(Boolean).slice(0, 3),
  };
}

/** People a business can send a request to. Same city first, then verified, then rated, then recently active. */
export async function listPeople(options: {
  businessId: string;
  viewerId: string;
  viewerCity: string | null;
  tab?: PeopleTab;
  q?: string | null;
  limit?: number;
  offset?: number;
}): Promise<Person[]> {
  const limit = Math.min(options.limit ?? 24, 60);
  const offset = Math.max(options.offset ?? 0, 0);
  const q = options.q?.trim() ? `%${options.q.trim().replace(/[%_]/g, "")}%` : null;
  const rows = await sql<PersonRow>(
    `${PERSON_SELECT}
      where p.wants_earn and not p.suspended and p.onboarded_at is not null
        and p.id <> $1 and p.id <> (select owner_id from businesses where id = $3)
        and ($4::boolean = false or ($2::text is not null and lower(coalesce(p.city, '')) = lower($2::text)))
        and ($5::text is null or p.username ilike $5 or coalesce(p.display_name, '') ilike $5 or coalesce(p.city, '') ilike $5)
      ${PERSON_ORDER}
      limit $6 offset $7`,
    [options.viewerId, options.viewerCity, options.businessId, options.tab === "nearby", q, limit, offset],
  );
  return rows.map(toPerson);
}

// ---------------------------------------------------------------------- cars

export type CarZone = { zone: string; asking_cents: number | null };

export type Car = {
  id: string;
  owner_id: string;
  owner_username: string;
  owner_name: string;
  owner_avatar: string | null;
  owner_rating_avg: number | null;
  owner_rating_count: number;
  year: number;
  make: string;
  model: string;
  color: string | null;
  city: string | null;
  monthly_miles: number | null;
  available: boolean;
  rating_avg: number | null;
  rating_count: number;
  zones: CarZone[];
  from_cents: number | null;
  same_city: boolean;
  stage: StageProps;
};

type CarRow = {
  id: string; owner_id: string; owner_username: string; owner_name: string | null; owner_avatar: string | null;
  owner_rating_avg: string | null; owner_rating_count: number;
  year: number; make: string; model: string; color: string | null; city: string | null; monthly_miles: number | null;
  available: boolean; rating_avg: string | null; rating_count: number;
  zones: CarZone[] | null; from_cents: number | null; same_city: boolean;
  model_glb_url: string | null; poster_url: string | null;
  photos: StagePhoto[] | null; scan_photos: StagePhoto[] | null; scan_label: string | null;
};

const CAR_SELECT = `
  select v.id, v.owner_id, p.username as owner_username, p.display_name as owner_name, p.avatar_url as owner_avatar,
         cp.rating_avg::text as owner_rating_avg, coalesce(cp.rating_count, 0)::int as owner_rating_count,
         v.year, v.make, v.model, v.color, v.city, v.monthly_miles, v.available,
         v.rating_avg::text as rating_avg, v.rating_count, v.model_glb_url, v.poster_url,
         coalesce((select json_agg(json_build_object('zone', z.zone::text, 'asking_cents', z.asking_cents_monthly::int) order by z.zone)
                     from vehicle_zones z where z.vehicle_id = v.id and z.available), '[]'::json) as zones,
         (select min(z.asking_cents_monthly)::int from vehicle_zones z where z.vehicle_id = v.id and z.available) as from_cents,
         coalesce((select json_agg(json_build_object('angle', ph.angle, 'url', ph.url) order by ph.created_at)
                     from vehicle_photos ph where ph.vehicle_id = v.id), '[]'::json) as photos,
         ls.capture->'photos' as scan_photos,
         ls.quality->>'label' as scan_label,
         ($1::text is not null and lower(coalesce(v.city, '')) = lower($1::text)) as same_city
    from vehicles v
    join profiles p on p.id = v.owner_id
    left join creator_profiles cp on cp.profile_id = p.id
    left join lateral (select s.capture, s.quality from vehicle_scans s
                        where s.vehicle_id = v.id order by s.created_at desc limit 1) ls on true`;

function toCar(r: CarRow): Car {
  const { model_glb_url, poster_url, photos, scan_photos, scan_label, owner_rating_avg, rating_avg, owner_name, ...rest } = r;
  return {
    ...rest,
    owner_name: owner_name ?? r.owner_username,
    owner_rating_avg: owner_rating_avg == null ? null : Number(owner_rating_avg),
    rating_avg: rating_avg == null ? null : Number(rating_avg),
    zones: r.zones ?? [],
    stage: buildStage({ glbUrl: model_glb_url, posterUrl: poster_url, photos: photos ?? [], scanPhotos: scan_photos, scanQualityLabel: scan_label }),
  };
}

/** Listed, available cars owned by other people. Same city first. */
export async function listCarsForBusiness(options: {
  viewerId: string;
  viewerCity: string | null;
  nearby?: boolean;
  q?: string | null;
  limit?: number;
  offset?: number;
}): Promise<Car[]> {
  const limit = Math.min(options.limit ?? 24, 60);
  const offset = Math.max(options.offset ?? 0, 0);
  const q = options.q?.trim() ? `%${options.q.trim().replace(/[%_]/g, "")}%` : null;
  const rows = await sql<CarRow>(
    `${CAR_SELECT}
      where v.status = 'listed' and v.available and not p.suspended and v.owner_id <> $2
        and ($3::boolean = false or ($1::text is not null and lower(coalesce(v.city, '')) = lower($1::text)))
        and ($4::text is null or v.make ilike $4 or v.model ilike $4 or coalesce(v.city, '') ilike $4
             or (v.make || ' ' || v.model) ilike $4)
      order by same_city desc, (v.model_glb_url is not null) desc, v.created_at desc
      limit $5 offset $6`,
    [options.viewerCity, options.viewerId, Boolean(options.nearby), q, limit, offset],
  );
  return rows.map(toCar);
}

/** One listed car with everything the business page shows. Null when it is not listed. */
export async function getCarForBusiness(vehicleId: string, viewerCity: string | null): Promise<Car | null> {
  if (!/^[0-9a-f-]{36}$/i.test(vehicleId)) return null;
  const row = await sqlOne<CarRow>(`${CAR_SELECT} where v.id = $2 and v.status = 'listed'`, [viewerCity, vehicleId]);
  return row ? toCar(row) : null;
}

// -------------------------------------------------------------- one person

export type WorkItem = { url: string; kind: string; campaign_title: string; created_at: string };
export type Review = { rating: number; body: string | null; created_at: string; business_name: string | null };
export type SentInvite = {
  id: string; campaign_id: string; kind: InviteKind; status: InviteStatus; pay_cents: number; vehicle_id: string | null; created_at: string;
};

export type PersonDetail = Person & {
  bio: string | null;
  suspended: boolean;
  work: WorkItem[];
  portfolio: string[];
  reviews: Review[];
  vehicles: Car[];
  invites: SentInvite[];
};

export async function getPersonForBusiness(username: string, businessId: string, viewerCity: string | null): Promise<PersonDetail | null> {
  const row = await sqlOne<PersonRow>(`${PERSON_SELECT} where lower(p.username) = lower($1)`, [username, viewerCity]);
  if (!row) return null;
  const person = toPerson(row);

  const [work, portfolio, reviews, vehicles, invites] = await Promise.all([
    sql<WorkItem>(
      `select s.media_urls[1] as url, c.kind::text as kind, c.title as campaign_title, s.created_at
         from submissions s join campaigns c on c.id = s.campaign_id
        where s.creator_id = $1 and s.status in ('approved', 'paid') and cardinality(s.media_urls) > 0
        order by s.created_at desc limit 9`,
      [person.id],
    ),
    sql<{ media_url: string }>(`select media_url from portfolio_items where profile_id = $1 order by sort, created_at desc limit 9`, [person.id]),
    sql<Review>(
      `select r.rating, r.body, r.created_at,
              (select b.name from businesses b where b.owner_id = r.reviewer_id order by b.created_at limit 1) as business_name
         from reviews r where r.subject_type = 'profile' and r.subject_id = $1
        order by r.created_at desc limit 3`,
      [person.id],
    ),
    sql<CarRow>(`${CAR_SELECT} where v.owner_id = $2 and v.status = 'listed' order by v.available desc, v.created_at desc limit 3`, [viewerCity, person.id]),
    sql<SentInvite>(
      `select id, campaign_id, kind::text as kind, status, pay_cents::int as pay_cents, vehicle_id, created_at
         from campaign_invites where business_id = $1 and profile_id = $2 order by created_at desc limit 20`,
      [businessId, person.id],
    ),
  ]);

  return {
    ...person,
    bio: row.bio,
    suspended: row.suspended,
    work,
    portfolio: portfolio.map((p) => p.media_url),
    reviews,
    vehicles: vehicles.map(toCar),
    invites,
  };
}

/** "12.4K" style counts for follower numbers. */
export function compactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/** The one or two stats a card is allowed to show, in priority order. */
export function personStats(p: Person, max = 2): string[] {
  const out: string[] = [];
  if (p.instagram?.status === "connected" && p.instagram.followers != null) out.push(`${compactCount(p.instagram.followers)} Instagram followers`);
  if (p.rating_count > 0 && p.rating_avg != null) out.push(`${p.rating_avg.toFixed(1)} TapMart rating`);
  if (p.completed_jobs > 0) out.push(`${p.completed_jobs} completed ${p.completed_jobs === 1 ? "campaign" : "campaigns"}`);
  if (out.length === 0 && p.instagram?.status === "pending" && p.instagram.handle) out.push(`@${p.instagram.handle}, Instagram not verified`);
  return out.slice(0, max);
}
