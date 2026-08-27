-- The Spot shows how much money is behind the takeover today. Like the board
-- score, this is money PUT IN today — never the remaining balance, which
-- stays private so an ad can't be sniped the moment it runs low.

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
         ), 0)::bigint as backed_cents_today
  from current_spot() s
  join links l on l.id = s.link_id;

-- Re-pin the hardening from 0006: invoker security, no anon/authenticated read.
alter view public_spot set (security_invoker = true);
revoke select on public_spot from anon, authenticated;
