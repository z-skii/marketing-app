-- Every public ad surface shows its money openly: what has been spent and
-- what is left. Spent is derived from the append-only ledger (allocations in,
-- releases out, minus what remains), so it is exact by construction.

create or replace view public_board as
  select
    row_number() over (
      order by e.score_cents desc, e.previous_rank nulls last, e.activated_at, e.placement_id
    )                       as rank,
    e.previous_rank,
    e.score_cents           as score_cents_today,
    e.opens_count           as opens_today,
    p.id                    as placement_id,
    l.id                    as link_id,
    l.slug, l.display_name, l.short_description, l.image_url, l.domain,
    l.total_opens,
    p.remaining_credit_cents::bigint as remaining_cents,
    greatest(m.put_in - m.released - p.remaining_credit_cents, 0)::bigint as spent_cents
  from board_round_entries e
  join daily_rounds r on r.id = e.round_id and r.status = 'active'
  join placements p   on p.id = e.placement_id
  join links l        on l.id = p.link_id
  cross join lateral (
    select coalesce(sum(-cl.amount_cents) filter (where cl.transaction_type
             in ('board_allocate','spot_allocate','bar_allocate')), 0) as put_in,
           coalesce(sum(cl.amount_cents) filter (where cl.transaction_type
             = 'placement_release'), 0) as released
      from credit_ledger cl
     where cl.related_entity_type = 'placement' and cl.related_entity_id = p.id
  ) m
  where p.status = 'active'
    and p.remaining_credit_cents > 0
    and l.moderation_status = 'approved'
    and l.enabled;

create or replace view public_bar as
  select q.queue_position, p.id as placement_id, l.id as link_id,
         l.slug, l.display_name, l.domain, l.image_url,
         p.remaining_credit_cents::bigint as remaining_cents,
         greatest(m.put_in - m.released - p.remaining_credit_cents, 0)::bigint as spent_cents
  from bar_queue q
  join placements p on p.id = q.placement_id
  join links l on l.id = p.link_id
  cross join lateral (
    select coalesce(sum(-cl.amount_cents) filter (where cl.transaction_type
             in ('board_allocate','spot_allocate','bar_allocate')), 0) as put_in,
           coalesce(sum(cl.amount_cents) filter (where cl.transaction_type
             = 'placement_release'), 0) as released
      from credit_ledger cl
     where cl.related_entity_type = 'placement' and cl.related_entity_id = p.id
  ) m
  where q.queue_position <= setting_int('bar_capacity', 100);

create or replace view public_spot as
  select s.schedule_id, s.placement_id, s.starts_at, s.ends_at,
         l.id as link_id, l.slug, l.display_name, l.short_description,
         l.image_url, l.domain, l.total_opens,
         coalesce((
           select sum(-cl.amount_cents)
             from credit_ledger cl
            where cl.transaction_type = 'spot_allocate'
              and cl.related_entity_type = 'placement'
              and cl.related_entity_id = s.placement_id
              and cl.created_at >= ny_day_start(now())
         ), 0)::bigint as backed_cents_today,
         p.remaining_credit_cents::bigint as remaining_cents,
         greatest(m.put_in - m.released - p.remaining_credit_cents, 0)::bigint as spent_cents
  from current_spot() s
  join links l on l.id = s.link_id
  join placements p on p.id = s.placement_id
  cross join lateral (
    select coalesce(sum(-cl.amount_cents) filter (where cl.transaction_type
             in ('board_allocate','spot_allocate','bar_allocate')), 0) as put_in,
           coalesce(sum(cl.amount_cents) filter (where cl.transaction_type
             = 'placement_release'), 0) as released
      from credit_ledger cl
     where cl.related_entity_type = 'placement' and cl.related_entity_id = p.id
  ) m;

-- Re-pin the hardening from 0006 on all three replaced views.
alter view public_board set (security_invoker = true);
alter view public_bar   set (security_invoker = true);
alter view public_spot  set (security_invoker = true);
revoke select on public_board, public_bar, public_spot from anon, authenticated;
