import "server-only";
import { sql, sqlOne } from "@/lib/db";
import { getBrandKit } from "@/lib/business/brand";
import { AI_REQUEST, aiModel, extractJsonObject, getAnthropic, isAiConfigured, responseText } from "./client";
import type { AiSource } from "./types";

/**
 * A month of content proposals for the calendar: up to twelve drafts, four
 * reels, four photos and four stories, on Mondays, Wednesdays and Fridays at
 * 11:00 local time. When Claude is configured the titles and caption
 * directions come from the model (source "ai"); otherwise a template keyed
 * to the category writes them (source "template"). Thumbnails only ever
 * point at media the business already has; nothing is invented.
 */

export type PostFormat = "reel" | "photo" | "story";

export type ProposedPost = {
  title: string;
  caption: string;
  format: PostFormat;
  recommended_time: string;
  thumbnail_url: string | null;
};

export type ProposeMonthResult = {
  month: string;
  created: number;
  existing: number;
  source: AiSource | "existing";
  posts: ProposedPost[];
};

export const POSTS_PER_MONTH = 12;
export const POST_HOUR_LOCAL = 11;
/** Monday, Wednesday, Friday. */
const POST_WEEKDAYS = [1, 3, 5];
const FORMAT_CYCLE: PostFormat[] = ["reel", "photo", "story"];

export function defaultTimezone(): string {
  return process.env.BUSINESS_TIMEZONE?.trim() || "America/New_York";
}

export function parseMonth(month: string): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) throw new Error("Month must look like YYYY-MM.");
  const year = Number(m[1]);
  const mon = Number(m[2]);
  if (mon < 1 || mon > 12) throw new Error("Month must be between 01 and 12.");
  return { year, month: mon };
}

/** The UTC instant of a local wall-clock time in an IANA zone. */
export function zonedTimeToUtc(year: number, month: number, day: number, hour: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day, hour, 0, 0);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
  const asIfUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second),
  );
  return new Date(guess - (asIfUtc - guess));
}

/** Up to twelve Mon/Wed/Fri 11:00 slots in the month, in order. */
export function monthSlots(month: string, timeZone = defaultTimezone()): Date[] {
  const { year, month: mon } = parseMonth(month);
  const last = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const slots: Date[] = [];
  for (let day = 1; day <= last && slots.length < POSTS_PER_MONTH; day++) {
    const weekday = new Date(Date.UTC(year, mon - 1, day)).getUTCDay();
    if (POST_WEEKDAYS.includes(weekday)) slots.push(zonedTimeToUtc(year, mon, day, POST_HOUR_LOCAL, timeZone));
  }
  return slots;
}

// ------------------------------------------------------------------- inputs

type BusinessRow = { name: string; category: string | null; city: string | null; description: string | null; cover_url: string | null };

/** Media the business already owns, most useful first. Never anything else. */
async function existingMedia(businessId: string, coverUrl: string | null): Promise<string[]> {
  const [shoots, subs] = await Promise.all([
    sql<{ url: string }>(
      `select distinct unnest(deliverable_urls) as url from content_shoots
        where business_id = $1 and status <> 'cancelled'`,
      [businessId],
    ),
    sql<{ url: string }>(
      `select distinct unnest(s.media_urls) as url
         from submissions s join campaigns c on c.id = s.campaign_id
        where c.business_id = $1 and s.status::text in ('approved', 'paid')`,
      [businessId],
    ),
  ]);
  const isImage = (u: string) => /\.(jpe?g|png|webp|gif)(\?|#|$)/i.test(u);
  const urls = [
    ...shoots.map((r) => r.url),
    ...(coverUrl ? [coverUrl] : []),
    ...subs.map((r) => r.url),
  ].filter((u) => typeof u === "string" && u.length > 0 && isImage(u));
  return Array.from(new Set(urls));
}

// ----------------------------------------------------------------- template

type Line = { title: string; caption: string };

const TEMPLATE_LINES: Record<PostFormat, Line[]> = {
  reel: [
    { title: "Behind the counter", caption: "Ten seconds of the work as it happens. No script, one real moment, name the business once." },
    { title: "How it is made", caption: "Start to finish of one product or service in three cuts. Hands and detail over faces." },
    { title: "A regular's order", caption: "Ask a regular what they always get and film the answer. One line, one smile." },
    { title: "Open to close", caption: "Five clips across the day, two seconds each: unlocking the door, the busiest minute, the last customer." },
  ],
  photo: [
    { title: "This week's favourite", caption: "One product, one plain background, daylight. Say the name and the price in the caption." },
    { title: "The team", caption: "One person, first name, what they do here. People remember faces before logos." },
    { title: "The place", caption: "A wide shot of the front or the room at its best hour. Mention the street." },
    { title: "Detail shot", caption: "Get close to a texture or a tool. Caption in one sentence about why it matters." },
  ],
  story: [
    { title: "Today's hours", caption: "Opening hours on a plain background in your brand colours. Sticker with the address." },
    { title: "Poll: this or that", caption: "Two products side by side and a poll sticker. Reply to whoever votes." },
    { title: "Sneak peek", caption: "Something new before it is announced. Five seconds, no polish." },
    { title: "Thank you", caption: "A quick note to this week's customers with a photo from the day." },
  ],
};

function withBusiness(line: Line, b: BusinessRow): Line {
  const where = b.city ? ` in ${b.city}` : "";
  return {
    title: line.title,
    caption: `${line.caption} For ${b.name}${where}.`,
  };
}

function templatePosts(b: BusinessRow, slots: Date[], media: string[]): ProposedPost[] {
  const counters: Record<PostFormat, number> = { reel: 0, photo: 0, story: 0 };
  return slots.map((slot, i) => {
    const format = FORMAT_CYCLE[i % FORMAT_CYCLE.length];
    const line = withBusiness(TEMPLATE_LINES[format][counters[format] % TEMPLATE_LINES[format].length], b);
    counters[format]++;
    return {
      title: line.title,
      caption: line.caption,
      format,
      recommended_time: slot.toISOString(),
      thumbnail_url: media.length ? media[i % media.length] : null,
    };
  });
}

// ----------------------------------------------------------------------- AI

const SYSTEM =
  "You plan a month of social posts for a small local business. Reply with ONLY a JSON object " +
  "{posts: [{title: string (max 60 chars), caption: string (a caption direction, 1 to 2 plain sentences), format: \"reel\"|\"photo\"|\"story\"}]} " +
  "with exactly the number of posts requested, in the order of the dates given, using exactly the format given for each date. " +
  "Ideas must be things the business can film on a phone in its own place. Short, direct sentences. No emojis. No dashes in text. " +
  "Never invent offers, prices, statistics or events.";

async function aiPosts(b: BusinessRow, slots: Date[], media: string[], brandTone: string | null): Promise<ProposedPost[] | null> {
  const plan = slots.map((s, i) => `${i + 1}. ${s.toISOString().slice(0, 10)} ${FORMAT_CYCLE[i % FORMAT_CYCLE.length]}`).join("\n");
  const message = await getAnthropic().messages.create({
    model: aiModel(),
    max_tokens: 4000,
    ...AI_REQUEST,
    system: SYSTEM,
    messages: [{
      role: "user",
      content:
        `Business: ${b.name}\nCategory: ${b.category ?? "unknown"}\nCity: ${b.city ?? "unknown"}\n` +
        `About: ${b.description ?? "n/a"}\nTone: ${brandTone ?? "n/a"}\n` +
        `Media the business already has: ${media.length} files\n\nDates and formats (${slots.length} posts):\n${plan}`,
    }],
  });
  if (message.stop_reason === "refusal") return null;
  const raw = extractJsonObject(responseText(message)) as { posts?: unknown } | null;
  if (!raw || !Array.isArray(raw.posts)) return null;
  const items = raw.posts as Partial<ProposedPost>[];
  if (items.length < slots.length) return null;
  return slots.map((slot, i) => {
    const item = items[i];
    const format = FORMAT_CYCLE[i % FORMAT_CYCLE.length];
    const title = typeof item?.title === "string" && item.title.trim() ? item.title.trim().slice(0, 200) : null;
    const caption = typeof item?.caption === "string" && item.caption.trim() ? item.caption.trim().slice(0, 1000) : null;
    if (!title || !caption) throw new Error("Model returned an incomplete post.");
    return { title, caption, format, recommended_time: slot.toISOString(), thumbnail_url: media.length ? media[i % media.length] : null };
  });
}

// ------------------------------------------------------------------ public

/**
 * Create the month's drafts once. A month that already has AI or template
 * drafts is left alone and reported as `source: "existing"`.
 */
export async function proposeMonth(
  businessId: string,
  month: string,
  options: { timezone?: string } = {},
): Promise<ProposeMonthResult> {
  const { year, month: mon } = parseMonth(month);
  const monthStart = `${year}-${String(mon).padStart(2, "0")}-01`;

  const existing = await sqlOne<{ n: string }>(
    `select count(*)::text as n from calendar_posts
      where business_id = $1 and source in ('ai', 'template')
        and coalesce(scheduled_for, recommended_time) >= $2::date
        and coalesce(scheduled_for, recommended_time) < ($2::date + interval '1 month')`,
    [businessId, monthStart],
  );
  const have = Number(existing?.n ?? 0);
  if (have > 0) return { month, created: 0, existing: have, source: "existing", posts: [] };

  const b = await sqlOne<BusinessRow>(
    `select name, category, city, description, cover_url from businesses where id = $1`,
    [businessId],
  );
  if (!b) throw new Error("Business not found.");

  const slots = monthSlots(month, options.timezone ?? defaultTimezone());
  const [media, brand] = await Promise.all([existingMedia(businessId, b.cover_url), getBrandKit(businessId)]);

  let posts: ProposedPost[] | null = null;
  let source: AiSource = "template";
  if (isAiConfigured()) {
    try {
      posts = await aiPosts(b, slots, media, brand.kit.tone);
      if (posts) source = "ai";
    } catch (error) {
      console.error("proposeMonth fell back to the template:", error);
    }
  }
  if (!posts) posts = templatePosts(b, slots, media);

  for (const post of posts) {
    await sql(
      `insert into calendar_posts
         (business_id, platform, status, title, copy, caption, format, source, thumbnail_url, recommended_time, scheduled_for)
       values ($1, 'instagram', 'idea', $2, $3, $3, $4, $5, $6, $7, $7)`,
      [businessId, post.title, post.caption, post.format, source, post.thumbnail_url, post.recommended_time],
    );
  }
  return { month, created: posts.length, existing: 0, source, posts };
}

/** Approve every draft in the month that is still waiting. Returns how many changed. */
export async function approveAll(businessId: string, month: string): Promise<number> {
  const { year, month: mon } = parseMonth(month);
  const monthStart = `${year}-${String(mon).padStart(2, "0")}-01`;
  const rows = await sql<{ id: string }>(
    `update calendar_posts set status = 'approved'
      where business_id = $1 and status in ('idea', 'draft', 'needs_approval')
        and coalesce(scheduled_for, recommended_time) >= $2::date
        and coalesce(scheduled_for, recommended_time) < ($2::date + interval '1 month')
      returning id`,
    [businessId, monthStart],
  );
  return rows.length;
}

/** Move a post to a new time. Published posts stay where they are. */
export async function moveCalendarPost(postId: string, businessId: string, when: Date | string): Promise<boolean> {
  const at = when instanceof Date ? when : new Date(when);
  if (Number.isNaN(at.getTime())) throw new Error("That is not a valid date.");
  const row = await sqlOne<{ id: string }>(
    `update calendar_posts set scheduled_for = $3
      where id = $1 and business_id = $2 and status <> 'published' returning id`,
    [postId, businessId, at],
  );
  return Boolean(row);
}
