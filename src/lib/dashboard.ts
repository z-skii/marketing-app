import "server-only";
import { sql, sqlOne } from "./db";

export type WalletSummary = {
  availableCents: number;
  assignedCents: number;
  totalCents: number;
};

export async function getWallet(userId: string): Promise<WalletSummary> {
  const row = await sqlOne<{ available: string; assigned: string }>(
    `select
       coalesce(w.available_credit_cents, 0)::text as available,
       coalesce((select sum(remaining_credit_cents) from placements
                  where owner_id = $1 and status in ('active','pending','paused')), 0)::text as assigned
     from wallets w where w.user_id = $1`,
    [userId],
  );
  const availableCents = Number(row?.available ?? 0);
  const assignedCents = Number(row?.assigned ?? 0);
  return { availableCents, assignedCents, totalCents: availableCents + assignedCents };
}

export type OwnedLink = {
  link_id: string;
  slug: string;
  display_name: string;
  domain: string;
  image_url: string | null;
  moderation_status: "pending" | "approved" | "rejected" | "suspended";
  opens_today: number;
  total_opens: number;
  board_rank: number | null;
  board_score_cents: number | null;
  board_remaining_cents: number | null;
  board_status: string | null;
  spot_remaining_cents: number | null;
  spot_status: string | null;
  next_spot_at: string | null;
  bar_remaining_cents: number | null;
  bar_status: string | null;
  bar_position: number | null;
};

export async function getOwnedLinks(userId: string): Promise<OwnedLink[]> {
  const rows = await sql<Record<string, unknown>>(
    `select
       l.id as link_id, l.slug, l.display_name, l.domain, l.image_url,
       l.moderation_status, l.total_opens,
       board.remaining_credit_cents as board_remaining_cents,
       board.status::text            as board_status,
       pb.rank                       as board_rank,
       e.score_cents                 as board_score_cents,
       coalesce(e.opens_count, 0)    as opens_today,
       spot.remaining_credit_cents   as spot_remaining_cents,
       spot.status::text             as spot_status,
       (select min(s.starts_at) from spot_schedules s
         where s.placement_id = spot.id and s.starts_at > now() and s.status = 'scheduled')
                                     as next_spot_at,
       bar.remaining_credit_cents    as bar_remaining_cents,
       bar.status::text              as bar_status,
       bq.queue_position             as bar_position
     from links l
     left join placements board on board.link_id = l.id and board.placement_type = 'board'
     left join placements spot  on spot.link_id  = l.id and spot.placement_type  = 'spot'
     left join placements bar   on bar.link_id   = l.id and bar.placement_type   = 'bar'
     left join bar_queue bq     on bq.placement_id = bar.id
     left join daily_rounds r   on r.status = 'active'
     left join board_round_entries e on e.placement_id = board.id and e.round_id = r.id
     left join public_board pb  on pb.placement_id = board.id
     where l.owner_id = $1
     order by coalesce(e.score_cents, 0) desc, l.created_at desc`,
    [userId],
  );

  return rows.map((row) => {
    const out = { ...row } as Record<string, unknown>;
    for (const key of [
      "total_opens", "opens_today", "board_rank", "board_score_cents", "board_remaining_cents",
      "spot_remaining_cents", "bar_remaining_cents", "bar_position",
    ]) {
      out[key] = out[key] == null ? null : Number(out[key]);
    }
    return out as unknown as OwnedLink;
  });
}

export type LedgerRow = {
  id: string; amount_cents: number; transaction_type: string;
  balance_after_cents: number; reason: string | null; created_at: string;
};

export async function getLedger(userId: string, limit = 25): Promise<LedgerRow[]> {
  const rows = await sql<LedgerRow>(
    `select id, amount_cents, transaction_type, balance_after_cents, reason, created_at
       from credit_ledger where user_id = $1 order by created_at desc limit $2`,
    [userId, limit],
  );
  return rows.map((r) => ({
    ...r,
    amount_cents: Number(r.amount_cents),
    balance_after_cents: Number(r.balance_after_cents),
  }));
}

// ------------------------------------------------------------------ creator

export type CreatorSummary = {
  todayVisitors: number; todayOpens: number; todayEarningsCents: number;
  weekOpens: number; weekEarningsCents: number;
  pendingCents: number; availableCents: number; paidCents: number;
};

export async function getCreatorSummary(userId: string): Promise<CreatorSummary> {
  const row = await sqlOne<Record<string, string>>(
    `select
      (select count(distinct anonymous_visitor_id)::text from creator_sessions
        where creator_user_id = $1 and first_seen_at >= date_trunc('day', now())) as today_visitors,
      (select count(*)::text from click_events
        where creator_user_id = $1 and qualified and created_at >= date_trunc('day', now())) as today_opens,
      (select coalesce(sum(amount_cents),0)::text from creator_earnings
        where creator_user_id = $1 and created_at >= date_trunc('day', now())) as today_earnings,
      (select count(*)::text from click_events
        where creator_user_id = $1 and qualified and created_at >= now() - interval '7 days') as week_opens,
      (select coalesce(sum(amount_cents),0)::text from creator_earnings
        where creator_user_id = $1 and created_at >= now() - interval '7 days') as week_earnings,
      (select coalesce(sum(amount_cents),0)::text from creator_earnings
        where creator_user_id = $1 and status = 'pending') as pending,
      (select coalesce(sum(amount_cents),0)::text from creator_earnings
        where creator_user_id = $1 and status = 'available') as available,
      (select coalesce(sum(amount_cents),0)::text from creator_earnings
        where creator_user_id = $1 and status = 'paid') as paid`,
    [userId],
  );
  const n = (key: string) => Number(row?.[key] ?? 0);
  return {
    todayVisitors: n("today_visitors"), todayOpens: n("today_opens"),
    todayEarningsCents: n("today_earnings"), weekOpens: n("week_opens"),
    weekEarningsCents: n("week_earnings"), pendingCents: n("pending"),
    availableCents: n("available"), paidCents: n("paid"),
  };
}

export async function getOrCreateReferral(userId: string): Promise<string> {
  const existing = await sqlOne<{ referral_code: string }>(
    `select referral_code from creator_referrals
      where creator_user_id = $1 and target_type = 'home' limit 1`,
    [userId],
  );
  if (existing) return existing.referral_code;

  const code = Math.random().toString(36).slice(2, 10);
  const created = await sqlOne<{ referral_code: string }>(
    `insert into creator_referrals (creator_user_id, referral_code, target_type)
     values ($1, $2, 'home')
     on conflict (referral_code) do nothing
     returning referral_code`,
    [userId, code],
  );
  return created?.referral_code ?? getOrCreateReferral(userId);
}
