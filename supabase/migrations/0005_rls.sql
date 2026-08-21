-- Row Level Security. Server code uses the service role; anything reaching the
-- database with a user's own JWT is confined to these policies.

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

alter table profiles            enable row level security;
alter table wallets             enable row level security;
alter table credit_ledger       enable row level security;
alter table links               enable row level security;
alter table blocked_domains     enable row level security;
alter table placements          enable row level security;
alter table daily_rounds        enable row level security;
alter table board_round_entries enable row level security;
alter table spot_schedules      enable row level security;
alter table bar_queue           enable row level security;
alter table creator_referrals   enable row level security;
alter table creator_sessions    enable row level security;
alter table click_events        enable row level security;
alter table creator_earnings    enable row level security;
alter table payout_requests     enable row level security;
alter table stripe_payments     enable row level security;
alter table app_settings        enable row level security;
alter table admin_audit_log     enable row level security;

-- ---- identity ----
create policy profiles_self_read on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_self_write on profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy wallets_self_read on wallets for select using (user_id = auth.uid() or is_admin());
create policy ledger_self_read  on credit_ledger for select using (user_id = auth.uid() or is_admin());

-- ---- links: approved links are public, drafts are not ----
create policy links_public_read on links for select
  using ((moderation_status = 'approved' and enabled) or owner_id = auth.uid() or is_admin());
create policy links_owner_insert on links for insert with check (owner_id = auth.uid());
create policy links_owner_update on links for update
  using (owner_id = auth.uid() or is_admin()) with check (owner_id = auth.uid() or is_admin());

-- ---- placements: remaining credit is private to the owner ----
create policy placements_owner_read on placements for select using (owner_id = auth.uid() or is_admin());

-- ---- public ranking data ----
create policy rounds_public_read  on daily_rounds        for select using (true);
create policy entries_public_read on board_round_entries for select using (true);
create policy spot_public_read    on spot_schedules      for select using (true);
create policy bar_public_read     on bar_queue           for select using (true);
create policy settings_public_read on app_settings       for select using (true);
create policy blocked_admin_read  on blocked_domains     for select using (is_admin());

-- ---- creator ----
create policy referrals_owner on creator_referrals for select using (creator_user_id = auth.uid() or is_admin());
create policy referrals_insert on creator_referrals for insert with check (creator_user_id = auth.uid());
create policy earnings_owner on creator_earnings for select using (creator_user_id = auth.uid() or is_admin());
create policy payouts_owner  on payout_requests  for select using (creator_user_id = auth.uid() or is_admin());
create policy payouts_insert on payout_requests  for insert with check (creator_user_id = auth.uid());
create policy sessions_admin on creator_sessions for select using (is_admin());

-- ---- restricted ----
create policy clicks_admin   on click_events    for select using (is_admin());
create policy payments_owner on stripe_payments for select using (user_id = auth.uid() or is_admin());
create policy audit_admin    on admin_audit_log for select using (is_admin());

-- ---------------------------------------------------------------- public views
-- Deliberately security-definer projections: they expose ONLY fields that are
-- safe in public, and never a placement's remaining credit.

create view public_board as
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
    l.total_opens
  from board_round_entries e
  join daily_rounds r on r.id = e.round_id and r.status = 'active'
  join placements p   on p.id = e.placement_id
  join links l        on l.id = p.link_id
  where p.status = 'active'
    and p.remaining_credit_cents > 0
    and l.moderation_status = 'approved'
    and l.enabled;

create view public_bar as
  select q.queue_position, p.id as placement_id, l.id as link_id,
         l.slug, l.display_name, l.domain, l.image_url
  from bar_queue q
  join placements p on p.id = q.placement_id
  join links l on l.id = p.link_id
  where q.queue_position <= setting_int('bar_capacity', 100);

create view public_spot as
  select s.schedule_id, s.placement_id, s.starts_at, s.ends_at,
         l.id as link_id, l.slug, l.display_name, l.short_description,
         l.image_url, l.domain, l.total_opens
  from current_spot() s
  join links l on l.id = s.link_id;

grant select on public_board, public_bar, public_spot to anon, authenticated;
