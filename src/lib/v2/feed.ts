import "server-only";
import { sql } from "@/lib/db";

/**
 * Global search: jobs, businesses and people. The marketplace feed itself
 * lives in opportunities.ts; vehicles are private and never searchable.
 */

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
  // Vehicles are private and never searchable. Campaigns are the three earning kinds only.
  const [campaigns, businesses, people] = await Promise.all([
    sql<SearchHit>(
      `select 'campaign' as type, c.id, c.title, b.name as subtitle,
              '/o/' || c.id as href,
              coalesce(c.details->>'creative_url', c.details->>'artwork_url', b.cover_url, b.logo_url) as image_url
         from campaigns c join businesses b on b.id = c.business_id
        where c.status = 'open'
          and c.kind in ('recreate_reel', 'instagram_story', 'car_ads')
          and (c.deadline is null or c.deadline > now())
          and (c.title ilike $1 or c.brief ilike $1 or b.name ilike $1)
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
  ]);
  return [...campaigns, ...businesses, ...people];
}
