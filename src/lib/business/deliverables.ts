import "server-only";
import { sql, sqlOne, transaction } from "@/lib/db";
import { notify } from "@/lib/v2/core";
import { zonedTimeToUtc, defaultTimezone } from "@/lib/ai/schedule";
import { getShootById, isVerifiedCreator, type ContentShoot } from "./shoots";

/**
 * Content deliverables: the real photos and videos a verified TapMart
 * creator uploads for a shoot. One row per file. The creator (or an admin)
 * adds them; the business approves, asks for an edit, schedules them onto
 * the calendar, and marks them published. Nothing on the Content tab exists
 * that did not come through here.
 */

export type DeliverableKind = "photo" | "video";
export type DeliverableStatus = "new" | "approved" | "rejected" | "scheduled" | "published";
export type DeliverableFormat = "reel" | "photo" | "story";

export type Deliverable = {
  id: string;
  shoot_id: string;
  business_id: string;
  uploaded_by: string | null;
  kind: DeliverableKind;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  status: DeliverableStatus;
  edit_note: string | null;
  calendar_post_id: string | null;
  created_at: string;
  updated_at: string;
  /** Who uploaded it, as the business sees it. */
  uploader_name: string | null;
  uploader_verified: boolean;
  /** The shoot's date, for "From the Sep 18 shoot". */
  shoot_date: string | null;
};

export type DeliverableCounts = Record<DeliverableStatus, number> & { total: number };

const COLUMNS = `d.id, d.shoot_id, d.business_id, d.uploaded_by, d.kind, d.url, d.thumbnail_url, d.caption, d.status,
   d.edit_note, d.calendar_post_id, d.created_at::text as created_at, d.updated_at::text as updated_at,
   coalesce(p.display_name, p.username) as uploader_name,
   exists(select 1 from creator_profiles cp where cp.profile_id = d.uploaded_by and cp.verification = 'verified') as uploader_verified,
   s.scheduled_for::text as shoot_date`;
const FROM = `from content_deliverables d
   left join profiles p on p.id = d.uploaded_by
   join content_shoots s on s.id = d.shoot_id`;

const URL_MAX = 500;
const CAPTION_MAX = 2000;
const NOTE_MAX = 1000;

export const FORMAT_FOR_KIND: Record<DeliverableKind, DeliverableFormat> = { photo: "photo", video: "reel" };

/** Video by file extension; everything else is a photo. Matches MediaPreview. */
export function kindOfUrl(url: string): DeliverableKind {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url) ? "video" : "photo";
}

// ------------------------------------------------------------------ reads

export async function listDeliverables(
  businessId: string,
  filter: { status?: DeliverableStatus[]; shootId?: string; limit?: number } = {},
): Promise<Deliverable[]> {
  const statuses = filter.status && filter.status.length > 0 ? filter.status : null;
  return sql<Deliverable>(
    `select ${COLUMNS} ${FROM}
      where d.business_id = $1
        and ($2::text[] is null or d.status = any($2::text[]))
        and ($3::uuid is null or d.shoot_id = $3)
      order by d.created_at desc, d.id
      limit $4`,
    [businessId, statuses, filter.shootId ?? null, Math.min(Math.max(filter.limit ?? 200, 1), 500)],
  );
}

/** What the business has not looked at yet. */
export async function listNewDeliverables(businessId: string): Promise<Deliverable[]> {
  return listDeliverables(businessId, { status: ["new"] });
}

export async function getDeliverable(id: string, businessId: string): Promise<Deliverable | null> {
  return sqlOne<Deliverable>(`select ${COLUMNS} ${FROM} where d.id = $1 and d.business_id = $2`, [id, businessId]);
}

/** Everything a creator or admin has uploaded for one shoot, oldest first. */
export async function listShootDeliverables(shootId: string): Promise<Deliverable[]> {
  return sql<Deliverable>(`select ${COLUMNS} ${FROM} where d.shoot_id = $1 order by d.created_at, d.id`, [shootId]);
}

export async function countDeliverables(businessId: string): Promise<DeliverableCounts> {
  const rows = await sql<{ status: DeliverableStatus; n: string }>(
    `select status, count(*)::text as n from content_deliverables where business_id = $1 group by status`,
    [businessId],
  );
  const counts: DeliverableCounts = { new: 0, approved: 0, rejected: 0, scheduled: 0, published: 0, total: 0 };
  for (const r of rows) {
    counts[r.status] = Number(r.n);
    counts.total += Number(r.n);
  }
  return counts;
}

// ------------------------------------------------------------ permission

export type Uploader = { id: string; role: "user" | "admin" };

/**
 * Who may upload for a shoot: the assigned person, only while they are a
 * verified creator, or an admin. Everyone else is refused. The check is
 * server-side and every write path calls it.
 */
export async function canUploadToShoot(shootId: string, uploader: Uploader): Promise<boolean> {
  if (uploader.role === "admin") return true;
  const row = await sqlOne<{ assigned_to: string | null }>(`select assigned_to from content_shoots where id = $1`, [shootId]);
  if (!row || row.assigned_to !== uploader.id) return false;
  return isVerifiedCreator(uploader.id);
}

type ShootRef = Pick<ContentShoot, "id" | "business_id" | "status" | "delivery_status" | "assigned_to">;

async function requireUploader(shootId: string, uploader: Uploader): Promise<ShootRef> {
  const [allowed, shoot] = await Promise.all([
    canUploadToShoot(shootId, uploader),
    sqlOne<ShootRef>(`select id, business_id, status, delivery_status, assigned_to from content_shoots where id = $1`, [shootId]),
  ]);
  if (!allowed || !shoot) throw new Error("FORBIDDEN");
  return shoot;
}

// ---------------------------------------------------------------- writes

/**
 * Record one delivered file. The first upload flips the shoot to
 * "processing" so the business sees content is on its way.
 */
export async function addDeliverable(input: {
  shootId: string;
  uploadedBy: Uploader;
  kind?: DeliverableKind;
  url: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
}): Promise<Deliverable> {
  const shoot = await requireUploader(input.shootId, input.uploadedBy);
  if (shoot.status === "cancelled") throw new Error("This shoot was cancelled.");
  const url = input.url.trim();
  if (!url || url.length > URL_MAX) throw new Error("That upload did not come back with a usable link.");
  const thumb = input.thumbnailUrl?.trim() || null;
  if (thumb && thumb.length > URL_MAX) throw new Error("That thumbnail link is too long.");
  const kind = input.kind ?? kindOfUrl(url);
  const caption = input.caption?.trim().slice(0, CAPTION_MAX) || null;

  const id = await transaction(async (client) => {
    const inserted = await client.query<{ id: string }>(
      `insert into content_deliverables (shoot_id, business_id, uploaded_by, kind, url, thumbnail_url, caption)
       values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [shoot.id, shoot.business_id, input.uploadedBy.id, kind, url, thumb, caption],
    );
    await client.query(
      `update content_shoots
          set delivery_status = case when delivery_status = 'none' then 'processing' else delivery_status end,
              updated_at = now()
        where id = $1`,
      [shoot.id],
    );
    return inserted.rows[0].id;
  });
  const row = await getDeliverable(id, shoot.business_id);
  if (!row) throw new Error("Could not read the deliverable back.");
  return row;
}

/**
 * The creator says the shoot is delivered: the shoot is done, the content is
 * ready, and the business owner hears about it.
 */
export async function finishDelivery(shootId: string, actor: Uploader): Promise<ContentShoot> {
  const shoot = await requireUploader(shootId, actor);
  const count = await sqlOne<{ n: string }>(`select count(*)::text as n from content_deliverables where shoot_id = $1`, [shootId]);
  if (Number(count?.n ?? 0) === 0) throw new Error("Upload at least one photo or video first.");
  await sql(
    `update content_shoots
        set delivery_status = 'delivered', status = 'done', completed_at = coalesce(completed_at, now()), updated_at = now()
      where id = $1`,
    [shootId],
  );
  const updated = await getShootById(shootId);
  if (!updated) throw new Error("Shoot not found.");
  const business = await sqlOne<{ owner_id: string }>(`select owner_id from businesses where id = $1`, [shoot.business_id]);
  if (business) {
    await notify(business.owner_id, "system", "Your content is ready", {
      body: `${count?.n ?? 0} photos and videos from your shoot are waiting for your approval.`,
      href: "/business/content",
    });
  }
  return updated;
}

async function setStatus(
  id: string,
  businessId: string,
  from: DeliverableStatus[],
  to: DeliverableStatus,
  extra: { edit_note?: string | null } = {},
): Promise<Deliverable> {
  const row = await sqlOne<{ id: string }>(
    `update content_deliverables
        set status = $3, edit_note = case when $4::boolean then $5 else edit_note end, updated_at = now()
      where id = $1 and business_id = $2 and status = any($6::text[])
      returning id`,
    [id, businessId, to, "edit_note" in extra, extra.edit_note ?? null, from],
  );
  if (!row) throw new Error("That file is not in a state that allows this.");
  const d = await getDeliverable(id, businessId);
  if (!d) throw new Error("Deliverable not found.");
  return d;
}

export async function approveDeliverable(id: string, businessId: string): Promise<Deliverable> {
  return setStatus(id, businessId, ["new", "rejected"], "approved", { edit_note: null });
}

export async function rejectDeliverable(id: string, businessId: string): Promise<Deliverable> {
  return setStatus(id, businessId, ["new", "approved"], "rejected");
}

/** Keep the file as new with a note for the creator; the creator sees it on the shoot page. */
export async function requestEdit(id: string, businessId: string, note: string): Promise<Deliverable> {
  const clean = note.trim().slice(0, NOTE_MAX);
  if (!clean) throw new Error("Say what should change.");
  const d = await setStatus(id, businessId, ["new", "approved", "rejected"], "new", { edit_note: clean });
  const shoot = await sqlOne<{ assigned_to: string | null }>(`select assigned_to from content_shoots where id = $1`, [d.shoot_id]);
  if (shoot?.assigned_to) {
    await notify(shoot.assigned_to, "system", "An edit was requested on a shoot file", { body: clean, href: `/me/shoots/${d.shoot_id}` });
  }
  return d;
}

const PLATFORMS = ["instagram", "facebook", "tiktok", "google_business", "other"];
const FORMATS: DeliverableFormat[] = ["reel", "photo", "story"];

/** "YYYY-MM-DDTHH:MM" read as business local time, or any full ISO instant. */
export function parseScheduledFor(value: string, timeZone = defaultTimezone()): Date {
  const local = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (local) {
    const [, y, m, d, h, min] = local.map(Number);
    const at = zonedTimeToUtc(y, m, d, h, timeZone);
    return new Date(at.getTime() + min * 60_000);
  }
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) throw new Error("That is not a valid date.");
  return at;
}

/**
 * Put a new or approved file on the calendar: one calendar_posts row with
 * the real media, status scheduled, tied back to the deliverable.
 */
export async function scheduleDeliverable(
  id: string,
  businessId: string,
  scheduledFor: string,
  platform = "instagram",
  format?: DeliverableFormat,
): Promise<Deliverable> {
  const at = parseScheduledFor(scheduledFor);
  if (at.getTime() < Date.now() - 60_000) throw new Error("Pick a time that has not passed.");
  const plat = PLATFORMS.includes(platform) ? platform : "instagram";
  const current = await getDeliverable(id, businessId);
  if (!current) throw new Error("Deliverable not found.");
  if (!["new", "approved"].includes(current.status)) throw new Error("This file is already on the calendar.");
  const fmt = format && FORMATS.includes(format) ? format : FORMAT_FOR_KIND[current.kind];
  const title = current.caption?.split("\n")[0].slice(0, 120) || `${current.kind === "video" ? "Video" : "Photo"} from the shoot`;

  await transaction(async (client) => {
    const post = await client.query<{ id: string }>(
      `insert into calendar_posts
         (business_id, platform, status, title, caption, copy, format, source, thumbnail_url, media_urls, scheduled_for, deliverable_id)
       values ($1, $2, 'scheduled', $3, $4, $4, $5, 'shoot', $6, array[$7::text], $8, $9)
       returning id`,
      [businessId, plat, title, current.caption, fmt, current.thumbnail_url ?? (current.kind === "photo" ? current.url : null), current.url, at, id],
    );
    await client.query(
      `update content_deliverables set status = 'scheduled', calendar_post_id = $3, updated_at = now()
        where id = $1 and business_id = $2`,
      [id, businessId, post.rows[0].id],
    );
  });
  const d = await getDeliverable(id, businessId);
  if (!d) throw new Error("Deliverable not found.");
  return d;
}

/** The business posted it (or the publisher did): both rows say published. */
export async function markPublished(id: string, businessId: string): Promise<Deliverable> {
  const current = await getDeliverable(id, businessId);
  if (!current) throw new Error("Deliverable not found.");
  if (current.status !== "scheduled") throw new Error("Schedule it first.");
  await transaction(async (client) => {
    await client.query(
      `update content_deliverables set status = 'published', updated_at = now() where id = $1 and business_id = $2`,
      [id, businessId],
    );
    if (current.calendar_post_id) {
      await client.query(
        `update calendar_posts set status = 'published', published_at = coalesce(published_at, now())
          where id = $1 and business_id = $2`,
        [current.calendar_post_id, businessId],
      );
    }
  });
  const d = await getDeliverable(id, businessId);
  if (!d) throw new Error("Deliverable not found.");
  return d;
}
