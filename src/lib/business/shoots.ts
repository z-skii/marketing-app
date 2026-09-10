import "server-only";
import { sql, sqlOne } from "@/lib/db";
import { PLAN_BY_KEY, type PlanKey, type PlanShoots } from "@/config/plans";

/**
 * Content shoots: the photographer or videographer visits a plan includes.
 * The allocation comes from src/config/plans.ts; this module plans the
 * month, keeps it idempotent, and records deliverables. Who actually goes
 * is decided by an admin (assignShoot in src/app/admin/market/shoot-actions.ts).
 */

export type ShootStatus = "planned" | "scheduled" | "done" | "cancelled";

export type DeliveryStatus = "none" | "processing" | "delivered";

export type ContentShoot = {
  id: string;
  business_id: string;
  scheduled_for: string | null;
  /** "14:00:00" when the admin set a start time. */
  starts_at: string | null;
  status: ShootStatus;
  photos_planned: number;
  videos_planned: number;
  deliverable_urls: string[];
  assigned_to: string | null;
  assigned_label: string | null;
  notes: string | null;
  delivery_status: DeliveryStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** A shoot as the assigned creator sees it: which business, and what has been uploaded so far. */
export type AssignedShoot = ContentShoot & {
  business_name: string;
  business_logo_url: string | null;
  photos_uploaded: number;
  videos_uploaded: number;
};

export type ShootActor = { userId: string; isAdmin: boolean };

/** The shoot row as ContentShoot; `t` is the table alias when the query joins. */
function shootColumns(t = ""): string {
  const c = (name: string) => `${t}${name}`;
  return `${c("id")}, ${c("business_id")}, ${c("scheduled_for")}::text as scheduled_for, ${c("starts_at")}::text as starts_at,
   ${c("status")}, ${c("photos_planned")}, ${c("videos_planned")}, ${c("deliverable_urls")}, ${c("assigned_to")},
   ${c("assigned_label")}, ${c("notes")}, ${c("delivery_status")}, ${c("completed_at")}::text as completed_at,
   ${c("created_at")}::text as created_at, ${c("updated_at")}::text as updated_at`;
}
const SHOOT_COLUMNS = shootColumns();

/** Preferred days of the month for each shoot slot: the 18th first, then two weeks earlier. */
export const SHOOT_DAYS = [18, 4, 25, 11];

/** The plan's allocation, or null when the business has no live subscription. */
export async function shootAllocation(businessId: string): Promise<{ plan: PlanKey; shoots: PlanShoots } | null> {
  const row = await sqlOne<{ plan: PlanKey }>(
    `select plan from business_subscriptions where business_id = $1 and status in ('active', 'trialing')`,
    [businessId],
  );
  if (!row) return null;
  return { plan: row.plan, shoots: PLAN_BY_KEY[row.plan].shoots };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoDate(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/**
 * The date for shoot slot `index` in the given month: the preferred day, or
 * when that has already passed, the next available day (tomorrow, capped at
 * the end of the month so the shoot still belongs to this month).
 */
export function shootDateFor(year: number, month: number, index: number, today = new Date()): string {
  const day = SHOOT_DAYS[index % SHOOT_DAYS.length];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const candidate = new Date(Date.UTC(year, month - 1, Math.min(day, lastDay)));
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (candidate >= todayUtc) return isoDate(candidate);
  const tomorrow = new Date(todayUtc.getTime() + 24 * 60 * 60 * 1000);
  const endOfMonth = new Date(Date.UTC(year, month - 1, lastDay));
  return isoDate(tomorrow <= endOfMonth ? tomorrow : endOfMonth);
}

/**
 * Make sure the current month has the shoots the plan includes. Safe to call
 * on every page view: it only creates what is missing and never moves or
 * duplicates existing shoots. Returns how many it created.
 */
export async function ensureMonthlyShoots(
  businessId: string,
  now = new Date(),
): Promise<{ created: number; plan: PlanKey | null; total: number }> {
  const allocation = await shootAllocation(businessId);
  if (!allocation) return { created: 0, plan: null, total: 0 };

  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const monthStart = `${year}-${pad(month)}-01`;

  const existing = await sqlOne<{ n: string }>(
    `select count(*)::text as n from content_shoots
      where business_id = $1 and status <> 'cancelled'
        and scheduled_for >= $2::date and scheduled_for < ($2::date + interval '1 month')`,
    [businessId, monthStart],
  );
  const have = Number(existing?.n ?? 0);
  const want = allocation.shoots.perMonth;
  if (have >= want) return { created: 0, plan: allocation.plan, total: have };

  const photos = Math.ceil(allocation.shoots.photos / want);
  const videos = Math.ceil(allocation.shoots.videos / want);
  let created = 0;
  for (let index = have; index < want; index++) {
    await sql(
      `insert into content_shoots (business_id, scheduled_for, status, photos_planned, videos_planned)
       values ($1, $2::date, 'planned', $3, $4)`,
      [businessId, shootDateFor(year, month, index, now), photos, videos],
    );
    created++;
  }
  return { created, plan: allocation.plan, total: have + created };
}

/** The next shoot that has not happened yet, soonest first. Booked shoots come before planned slots. */
export async function getNextShoot(businessId: string): Promise<ContentShoot | null> {
  return sqlOne<ContentShoot>(
    `select ${SHOOT_COLUMNS} from content_shoots
      where business_id = $1 and status in ('planned', 'scheduled')
        and (scheduled_for is null or scheduled_for >= current_date)
      order by (status = 'scheduled') desc, scheduled_for nulls last, created_at limit 1`,
    [businessId],
  );
}

/** The most recent shoot that happened (done), newest first. */
export async function getLastShoot(businessId: string): Promise<ContentShoot | null> {
  return sqlOne<ContentShoot>(
    `select ${SHOOT_COLUMNS} from content_shoots
      where business_id = $1 and status = 'done'
      order by coalesce(completed_at, updated_at) desc limit 1`,
    [businessId],
  );
}

/** One shoot by id, without a business scope: for the assigned creator and admins. Check permission first. */
export async function getShootById(shootId: string): Promise<ContentShoot | null> {
  return sqlOne<ContentShoot>(`select ${SHOOT_COLUMNS} from content_shoots where id = $1`, [shootId]);
}

/** Shoots assigned to a person, with the business and what they have uploaded so far. Not a marketplace job. */
export async function listShootsAssignedTo(userId: string, limit = 24): Promise<AssignedShoot[]> {
  return sql<AssignedShoot>(
    `select ${shootColumns("s.")},
            b.name as business_name, b.logo_url as business_logo_url,
            (select count(*) from content_deliverables d where d.shoot_id = s.id and d.kind = 'photo')::int as photos_uploaded,
            (select count(*) from content_deliverables d where d.shoot_id = s.id and d.kind = 'video')::int as videos_uploaded
       from content_shoots s join businesses b on b.id = s.business_id
      where s.assigned_to = $1 and s.status <> 'cancelled'
      order by (s.status = 'done'), s.scheduled_for nulls last, s.created_at
      limit $2`,
    [userId, Math.min(Math.max(limit, 1), 100)],
  );
}

export async function countShootsAssignedTo(userId: string): Promise<number> {
  const row = await sqlOne<{ n: string }>(
    `select count(*)::text as n from content_shoots where assigned_to = $1 and status <> 'cancelled'`,
    [userId],
  );
  return Number(row?.n ?? 0);
}

/** True when the person is a verified TapMart creator (creator_profiles.verification = 'verified'). */
export async function isVerifiedCreator(userId: string): Promise<boolean> {
  const row = await sqlOne<{ ok: boolean }>(
    `select exists(select 1 from creator_profiles where profile_id = $1 and verification = 'verified') as ok`,
    [userId],
  );
  return Boolean(row?.ok);
}

export async function listShoots(businessId: string, limit = 12): Promise<ContentShoot[]> {
  return sql<ContentShoot>(
    `select ${SHOOT_COLUMNS} from content_shoots
      where business_id = $1 order by scheduled_for desc nulls last, created_at desc limit $2`,
    [businessId, Math.min(Math.max(limit, 1), 100)],
  );
}

export async function getShoot(shootId: string, businessId: string): Promise<ContentShoot | null> {
  return sqlOne<ContentShoot>(
    `select ${SHOOT_COLUMNS} from content_shoots where id = $1 and business_id = $2`,
    [shootId, businessId],
  );
}

function cleanUrls(urls: string[]): string[] {
  return Array.from(new Set(urls.map((u) => u.trim()).filter((u) => u.length > 0 && u.length <= 500))).slice(0, 200);
}

/**
 * Append delivered photo and video URLs to a shoot. Adding files does not
 * change the status; that stays with the admin or the assigned person
 * (setShootStatus). Returns the updated shoot or null when it does not exist.
 */
export async function addDeliverables(shootId: string, businessId: string, urls: string[]): Promise<ContentShoot | null> {
  const clean = cleanUrls(urls);
  if (clean.length === 0) return getShoot(shootId, businessId);
  return sqlOne<ContentShoot>(
    `update content_shoots
        set deliverable_urls = (
              select array_agg(distinct u order by u) from unnest(deliverable_urls || $3::text[]) as u),
            updated_at = now()
      where id = $1 and business_id = $2
      returning ${SHOOT_COLUMNS}`,
    [shootId, businessId, clean],
  );
}

/** Status changes are for admins and the assigned person only. */
export async function setShootStatus(shootId: string, status: ShootStatus, actor: ShootActor): Promise<ContentShoot> {
  const row = await sqlOne<{ assigned_to: string | null }>(
    `select assigned_to from content_shoots where id = $1`,
    [shootId],
  );
  if (!row) throw new Error("Shoot not found.");
  if (!actor.isAdmin && row.assigned_to !== actor.userId) {
    throw new Error("Only an admin or the assigned person can change a shoot's status.");
  }
  const updated = await sqlOne<ContentShoot>(
    `update content_shoots set status = $2, updated_at = now() where id = $1 returning ${SHOOT_COLUMNS}`,
    [shootId, status],
  );
  if (!updated) throw new Error("Shoot not found.");
  return updated;
}

/**
 * Admin-only: who is going. A platform assignee must be a verified creator,
 * because only the assigned verified creator can upload deliverables.
 * `assigneeId` may be null with a label for someone outside the platform.
 */
export async function assignShootTo(
  shootId: string,
  assigneeId: string | null,
  label: string | null,
): Promise<ContentShoot> {
  if (assigneeId && !(await isVerifiedCreator(assigneeId))) {
    throw new Error("Only a verified TapMart creator can be assigned to a shoot.");
  }
  const updated = await sqlOne<ContentShoot>(
    `update content_shoots
        set assigned_to = $2, assigned_label = nullif($3, ''),
            status = case when status = 'planned' and ($2::uuid is not null or nullif($3, '') is not null)
                          then 'scheduled' else status end,
            updated_at = now()
      where id = $1 returning ${SHOOT_COLUMNS}`,
    [shootId, assigneeId, label?.trim().slice(0, 120) ?? null],
  );
  if (!updated) throw new Error("Shoot not found.");
  return updated;
}
