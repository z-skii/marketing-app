import "server-only";
import { sql } from "@/lib/db";
import { dayLabel } from "./dates";
import { isVideoUrl, type CalendarPost, type LibraryItem } from "./types";

/**
 * Everything the business has to post with, one tile per file: calendar
 * post media first (so a scheduled or published file carries its status),
 * then shoot deliverables, approved or paid campaign submissions, and the
 * brand cover and logo. A file that appears in several places shows once.
 */

type ShootRow = { id: string; scheduled_for: string | null; deliverable_urls: string[] };
type SubmissionRow = { media_urls: string[]; title: string };

export async function listLibrary(
  businessId: string,
  posts: CalendarPost[],
  brand: { cover_url: string | null; logo_url: string | null },
): Promise<LibraryItem[]> {
  const [shoots, submissions] = await Promise.all([
    sql<ShootRow>(
      `select id, scheduled_for::text as scheduled_for, deliverable_urls from content_shoots
        where business_id = $1 and status <> 'cancelled' and cardinality(deliverable_urls) > 0
        order by scheduled_for desc nulls last, created_at desc`,
      [businessId],
    ),
    sql<SubmissionRow>(
      `select s.media_urls, c.title
         from submissions s join campaigns c on c.id = s.campaign_id
        where c.business_id = $1 and s.status::text in ('approved', 'paid')
        order by s.created_at desc`,
      [businessId],
    ),
  ]);

  const seen = new Set<string>();
  const items: LibraryItem[] = [];
  const add = (url: string | null | undefined, source: string, postStatus: string | null = null) => {
    const clean = typeof url === "string" ? url.trim() : "";
    if (!clean || seen.has(clean)) return;
    seen.add(clean);
    items.push({ url: clean, kind: isVideoUrl(clean) ? "video" : "photo", source, postStatus });
  };

  for (const p of posts) {
    for (const u of p.media_urls) add(u, `Post: ${p.title}`, p.status);
    add(p.thumbnail_url, `Post: ${p.title}`, p.status);
  }
  for (const s of shoots) {
    const label = s.scheduled_for ? `From the ${dayLabel(s.scheduled_for, { weekday: false })} shoot` : "From a shoot";
    for (const u of s.deliverable_urls) add(u, label);
  }
  for (const s of submissions) {
    for (const u of s.media_urls) add(u, `Campaign: ${s.title}`);
  }
  add(brand.cover_url, "Brand cover");
  add(brand.logo_url, "Brand logo");
  return items;
}

/** The most recent file a shoot delivered, images first, for the next-shoot picture. */
export async function latestShootDeliverable(businessId: string): Promise<string | null> {
  const rows = await sql<{ deliverable_urls: string[] }>(
    `select deliverable_urls from content_shoots
      where business_id = $1 and status <> 'cancelled' and cardinality(deliverable_urls) > 0
      order by scheduled_for desc nulls last, updated_at desc limit 1`,
    [businessId],
  );
  const urls = rows[0]?.deliverable_urls ?? [];
  return urls.find((u) => !isVideoUrl(u)) ?? urls[0] ?? null;
}
