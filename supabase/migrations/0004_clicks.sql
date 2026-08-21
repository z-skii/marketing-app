-- The financially critical path. A qualified outbound click debits placement
-- credit exactly once, can never drive a balance below zero, and can never pay
-- a creator twice for the same click.

create or replace function record_click(
  p_placement_id   uuid,
  p_visitor_id     text,
  p_ip_hash        text default null,
  p_user_agent     text default null,
  p_creator_user   uuid default null,
  p_creator_referral uuid default null,
  p_viewer_user    uuid default null,
  p_pre_rejection  text default null
) returns table (
  qualified        boolean,
  rejection_reason text,
  destination_url  text,
  debited_cents    bigint
) language plpgsql as $$
declare
  v_p        placements;
  v_link     links;
  v_cost     bigint;
  v_before   bigint;
  v_after    bigint;
  v_reject   text := p_pre_rejection;
  v_click_id uuid;
  v_window   bigint := setting_int('duplicate_click_window_hours', 24);
  v_commission bigint := setting_int('creator_commission_cents', 1);
  v_hold     bigint := setting_int('creator_fraud_hold_days', 7);
  v_round    uuid;
  v_earn_creator boolean := false;
begin
  -- Resolve the destination first: an unqualified visitor still gets sent on
  -- their way, they simply are not charged for.
  select p.* into v_p from placements p where p.id = p_placement_id;
  if not found then
    return query select false, 'unknown_placement'::text, null::text, 0::bigint;
    return;
  end if;

  select l.* into v_link from links l where l.id = v_p.link_id;
  destination_url := v_link.destination_url;

  -- Lock the owner's wallet then the placement, always in that order, so
  -- concurrent clicks and allocations queue rather than deadlock.
  perform ensure_wallet(v_p.owner_id);
  perform 1 from wallets where user_id = v_p.owner_id for update;
  select p.* into v_p from placements p where p.id = p_placement_id for update;

  v_cost := click_price_cents(v_p.placement_type);

  if v_reject is null then
    if v_link.moderation_status <> 'approved' or not v_link.enabled then
      v_reject := 'link_not_live';
    elsif v_p.status <> 'active' then
      v_reject := 'placement_inactive';
    elsif p_viewer_user is not null and p_viewer_user = v_p.owner_id then
      v_reject := 'owner_click';
    elsif exists (
      select 1 from click_events c
       where c.anonymous_visitor_id = p_visitor_id
         and c.link_id = v_p.link_id
         and c.qualified
         and c.created_at > now() - make_interval(hours => v_window::int)
    ) then
      v_reject := 'duplicate_window';
    elsif v_p.remaining_credit_cents < v_cost then
      v_reject := 'insufficient_credit';
    end if;
  end if;

  -- A placement that can no longer cover a click is done for this cycle.
  if v_reject = 'insufficient_credit' and v_p.status = 'active' then
    update placements set status = 'exhausted', exhausted_at = now(), updated_at = now()
     where id = v_p.id;
    if v_p.placement_type = 'bar' then perform bar_sync(); end if;
  end if;

  if v_reject is not null then
    insert into click_events (placement_id, link_id, anonymous_visitor_id, ip_hash, user_agent,
                              creator_referral_id, creator_user_id, qualified, rejection_reason)
    values (v_p.id, v_p.link_id, p_visitor_id, p_ip_hash, p_user_agent,
            p_creator_referral, p_creator_user, false, v_reject);
    return query select false, v_reject, v_link.destination_url, 0::bigint;
    return;
  end if;

  -- ---- charge ----------------------------------------------------------
  v_before := wallet_total_credit_cents(v_p.owner_id);

  update placements
     set remaining_credit_cents = remaining_credit_cents - v_cost,
         opens_count = opens_count + 1,
         status = case when remaining_credit_cents - v_cost = 0
                       then 'exhausted'::placement_status else status end,
         exhausted_at = case when remaining_credit_cents - v_cost = 0 then now() else exhausted_at end,
         updated_at = now()
   where id = v_p.id
     and remaining_credit_cents >= v_cost   -- belt and braces under concurrency
   returning * into v_p;

  if not found then
    insert into click_events (placement_id, link_id, anonymous_visitor_id, ip_hash, user_agent,
                              creator_referral_id, creator_user_id, qualified, rejection_reason)
    values (p_placement_id, v_link.id, p_visitor_id, p_ip_hash, p_user_agent,
            p_creator_referral, p_creator_user, false, 'insufficient_credit');
    return query select false, 'insufficient_credit'::text, v_link.destination_url, 0::bigint;
    return;
  end if;

  v_after := v_before - v_cost;

  update links set total_opens = total_opens + 1, updated_at = now() where id = v_p.link_id;

  -- Round-scoped open counter. Note this touches opens only — NEVER score_cents.
  if v_p.placement_type = 'board' then
    select id into v_round from daily_rounds where status = 'active';
    if v_round is not null then
      update board_round_entries set opens_count = opens_count + 1, updated_at = now()
       where round_id = v_round and placement_id = v_p.id;
    end if;
  end if;

  v_earn_creator := p_creator_user is not null
                and p_creator_user <> v_p.owner_id
                and v_commission > 0
                and setting_bool('feature_creator_program', true);

  insert into click_events (placement_id, link_id, anonymous_visitor_id, ip_hash, user_agent,
                            creator_referral_id, creator_user_id, qualified, debit_cents,
                            creator_earning_cents)
  values (v_p.id, v_p.link_id, p_visitor_id, p_ip_hash, p_user_agent,
          p_creator_referral, p_creator_user, true, v_cost,
          case when v_earn_creator then v_commission else 0 end)
  returning id into v_click_id;

  perform ledger_append(v_p.owner_id, -v_cost, 'qualified_click_debit', v_before, v_after,
                        'click_event', v_click_id, 'Qualified open',
                        jsonb_build_object('placement_type', v_p.placement_type,
                                           'link_id', v_p.link_id));

  -- One click, at most one commission — enforced by the unique click_event_id.
  if v_earn_creator then
    insert into creator_earnings (creator_user_id, click_event_id, amount_cents, status, available_at)
    values (p_creator_user, v_click_id, v_commission, 'pending',
            now() + make_interval(days => v_hold::int))
    on conflict (click_event_id) do nothing;

    if p_creator_referral is not null then
      update creator_referrals set clicks_count = clicks_count + 1 where id = p_creator_referral;
    end if;
  end if;

  if v_p.placement_type = 'bar' and v_p.status = 'exhausted' then perform bar_sync(); end if;

  return query select true, null::text, v_link.destination_url, v_cost;
end;
$$;

-- ---------------------------------------------------------------- the bar

-- Rebuilds the bar ordering. Positions 1..bar_capacity are live on the strip;
-- everything past that is queued and promotes automatically as slots free up.
create or replace function bar_sync()
returns void language plpgsql as $$
begin
  delete from bar_queue q
   where not exists (
     select 1 from placements p join links l on l.id = p.link_id
      where p.id = q.placement_id
        and p.placement_type = 'bar'
        and p.status = 'active'
        and p.remaining_credit_cents > 0
        and l.moderation_status = 'approved'
        and l.enabled
   );

  insert into bar_queue (placement_id, queue_position, entered_at)
  select p.id, 0, coalesce(p.activated_at, p.created_at)
  from placements p join links l on l.id = p.link_id
  where p.placement_type = 'bar' and p.status = 'active' and p.remaining_credit_cents > 0
    and l.moderation_status = 'approved' and l.enabled
  on conflict (placement_id) do nothing;

  with ordered as (
    select q.id, row_number() over (order by q.entered_at, q.placement_id) as pos
    from bar_queue q
  )
  update bar_queue b set queue_position = o.pos from ordered o where b.id = o.id;
end;
$$;

-- ---------------------------------------------------------------- the spot

-- Deterministically spreads each eligible placement's daily appearances across
-- the day instead of running them back to back.
create or replace function schedule_spot_day(p_round uuid default null)
returns integer language plpgsql as $$
declare
  v_round      daily_rounds;
  v_per_day    int := setting_int('spot_appearances_per_day', 10)::int;
  v_seconds    int := setting_int('spot_appearance_seconds', 60)::int;
  v_capacity   int := setting_int('spot_capacity', 144)::int;
  v_slots      int;
  v_count      int;
  v_created    int := 0;
  r            record;
  k            int;
  v_block      int;
  v_offset     int;
  v_minute     int;
  v_start      timestamptz;
begin
  if p_round is null then
    v_round := ensure_current_round();
  else
    select * into v_round from daily_rounds where id = p_round;
  end if;

  -- Minutes available per appearance block, e.g. 1440 / 10 = 144.
  v_slots := greatest(1, (1440 / greatest(v_per_day, 1)));

  delete from spot_schedules
   where round_id = v_round.id and status = 'scheduled' and starts_at > now();

  create temp table if not exists _spot_elig (idx int, placement_id uuid) on commit drop;
  delete from _spot_elig;

  insert into _spot_elig (idx, placement_id)
  select (row_number() over (order by coalesce(p.activated_at, p.created_at), p.id))::int - 1, p.id
  from placements p join links l on l.id = p.link_id
  where p.placement_type = 'spot' and p.status = 'active' and p.remaining_credit_cents > 0
    and l.moderation_status = 'approved' and l.enabled
  limit v_capacity;

  select count(*) into v_count from _spot_elig;
  if v_count = 0 then return 0; end if;

  for r in select idx, placement_id from _spot_elig loop
    for k in 0 .. v_per_day - 1 loop
      v_block  := k * v_slots;
      -- Each placement keeps a fixed phase inside every block, so appearances
      -- land exactly one block apart (144 minutes at the default settings) and
      -- no two placements ever share a minute.
      v_offset := r.idx * (v_slots / greatest(v_count, 1));
      v_minute := v_block + v_offset;
      v_start  := v_round.starts_at + make_interval(mins => v_minute);
      if v_start >= v_round.ends_at then continue; end if;
      if v_start + make_interval(secs => v_seconds) <= now() then continue; end if;

      insert into spot_schedules (placement_id, round_id, starts_at, ends_at, status)
      values (r.placement_id, v_round.id, v_start,
              v_start + make_interval(secs => v_seconds), 'scheduled');
      v_created := v_created + 1;
    end loop;
  end loop;

  return v_created;
end;
$$;

-- The spot showing right now, skipping any placement that has since run dry.
create or replace function current_spot()
returns table (
  schedule_id uuid, placement_id uuid, link_id uuid, starts_at timestamptz, ends_at timestamptz
) language sql stable as $$
  select s.id, s.placement_id, p.link_id, s.starts_at, s.ends_at
  from spot_schedules s
  join placements p on p.id = s.placement_id
  join links l on l.id = p.link_id
  where s.starts_at <= now() and s.ends_at > now()
    and s.status in ('scheduled', 'played')
    and p.status = 'active' and p.remaining_credit_cents > 0
    and l.moderation_status = 'approved' and l.enabled
  order by s.starts_at desc
  limit 1;
$$;
