import "server-only";
import { sql, sqlOne } from "./db";

export type AdminOverview = {
  pendingLinks: number; approvedLinks: number; suspendedLinks: number;
  activePlacements: number; barLive: number; barQueued: number;
  spotScheduled: number; users: number;
  creditPurchasedCents: number; creditConsumedCents: number; creditReservedCents: number;
  creatorPendingCents: number; payoutsOpen: number;
  clicksToday: number; rejectedToday: number;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const row = await sqlOne<Record<string, string>>(
    `select
      (select count(*)::text from links where moderation_status = 'pending')   as pending_links,
      (select count(*)::text from links where moderation_status = 'approved')  as approved_links,
      (select count(*)::text from links where moderation_status = 'suspended') as suspended_links,
      (select count(*)::text from placements where status = 'active')          as active_placements,
      (select count(*)::text from public_bar)                                  as bar_live,
      (select count(*)::text from bar_queue
        where queue_position > setting_int('bar_capacity', 100))               as bar_queued,
      (select count(*)::text from spot_schedules
        where status = 'scheduled' and starts_at > now())                      as spot_scheduled,
      (select count(*)::text from profiles)                                    as users,
      (select coalesce(sum(amount_cents),0)::text from credit_ledger
        where transaction_type = 'stripe_topup')                               as credit_purchased,
      (select coalesce(sum(-amount_cents),0)::text from credit_ledger
        where transaction_type = 'qualified_click_debit')                      as credit_consumed,
      (select coalesce(sum(remaining_credit_cents),0)::text from placements)   as credit_reserved,
      (select coalesce(sum(amount_cents),0)::text from creator_earnings
        where status = 'pending')                                              as creator_pending,
      (select count(*)::text from payout_requests where status = 'requested')  as payouts_open,
      (select count(*)::text from click_events
        where qualified and created_at >= date_trunc('day', now()))            as clicks_today,
      (select count(*)::text from click_events
        where not qualified and created_at >= date_trunc('day', now()))        as rejected_today`,
  );
  const n = (k: string) => Number(row?.[k] ?? 0);
  return {
    pendingLinks: n("pending_links"), approvedLinks: n("approved_links"),
    suspendedLinks: n("suspended_links"), activePlacements: n("active_placements"),
    barLive: n("bar_live"), barQueued: n("bar_queued"), spotScheduled: n("spot_scheduled"),
    users: n("users"), creditPurchasedCents: n("credit_purchased"),
    creditConsumedCents: n("credit_consumed"), creditReservedCents: n("credit_reserved"),
    creatorPendingCents: n("creator_pending"), payoutsOpen: n("payouts_open"),
    clicksToday: n("clicks_today"), rejectedToday: n("rejected_today"),
  };
}

export type ModerationLink = {
  id: string; slug: string; display_name: string; domain: string; destination_url: string;
  short_description: string | null; image_url: string | null;
  moderation_status: string; created_at: string; owner_email: string | null;
  reserved_cents: number;
};

export async function getLinksForModeration(status: string, limit = 40): Promise<ModerationLink[]> {
  const rows = await sql<ModerationLink>(
    `select l.id, l.slug, l.display_name, l.domain, l.destination_url, l.short_description,
            l.image_url, l.moderation_status::text, l.created_at, u.email as owner_email,
            coalesce((select sum(p.remaining_credit_cents) from placements p where p.link_id = l.id), 0)
              as reserved_cents
       from links l
       join auth.users u on u.id = l.owner_id
      where l.moderation_status = $1::moderation_status
      order by l.created_at desc limit $2`,
    [status, limit],
  );
  return rows.map((r) => ({ ...r, reserved_cents: Number(r.reserved_cents) }));
}

export type SuspiciousClick = {
  rejection_reason: string; n: number;
};

export async function getRejectionBreakdown(): Promise<SuspiciousClick[]> {
  const rows = await sql<{ rejection_reason: string; n: string }>(
    `select coalesce(rejection_reason, 'unknown') as rejection_reason, count(*)::text as n
       from click_events
      where not qualified and created_at >= now() - interval '24 hours'
      group by 1 order by count(*) desc limit 10`,
  );
  return rows.map((r) => ({ rejection_reason: r.rejection_reason, n: Number(r.n) }));
}

export async function getPayoutRequests() {
  return sql<{ id: string; amount_cents: string; status: string; created_at: string; email: string }>(
    `select pr.id, pr.amount_cents, pr.status::text, pr.created_at, u.email
       from payout_requests pr join auth.users u on u.id = pr.creator_user_id
      order by pr.created_at desc limit 25`,
  );
}

export async function getAuditLog() {
  return sql<{ id: string; action: string; target_type: string | null; created_at: string; email: string | null }>(
    `select a.id, a.action, a.target_type, a.created_at, u.email
       from admin_audit_log a
       left join auth.users u on u.id = a.admin_user_id
      order by a.created_at desc limit 25`,
  );
}

export async function getUpcomingSpot() {
  return sql<{ starts_at: string; display_name: string; domain: string }>(
    `select s.starts_at, l.display_name, l.domain
       from spot_schedules s
       join placements p on p.id = s.placement_id
       join links l on l.id = p.link_id
      where s.status = 'scheduled' and s.starts_at > now()
      order by s.starts_at limit 12`,
  );
}

export type MemberRow = {
  id: string;
  member_no: string;
  email: string | null;
  display_name: string | null;
  role: "user" | "admin";
  suspended: boolean;
  created_at: string;
  available_credit_cents: string | null;
  reserved_cents: string;
  links_count: string;
  lifetime_topup_cents: string;
};

/** The member directory: every account with the numbers that matter. */
export async function getMembers(limit = 200): Promise<MemberRow[]> {
  return sql<MemberRow>(
    `select p.id, p.member_no, u.email, p.display_name, p.role, p.suspended, p.created_at,
            w.available_credit_cents,
            coalesce((select sum(pl.remaining_credit_cents) from placements pl
                       where pl.owner_id = p.id and pl.status in ('pending','active','paused')), 0) as reserved_cents,
            (select count(*) from links l where l.owner_id = p.id) as links_count,
            coalesce((select sum(sp.amount_cents) from stripe_payments sp
                       where sp.user_id = p.id and sp.status = 'succeeded'), 0) as lifetime_topup_cents
       from profiles p
       join auth.users u on u.id = p.id
       left join wallets w on w.user_id = p.id
      order by p.member_no
      limit $1`,
    [limit],
  );
}
